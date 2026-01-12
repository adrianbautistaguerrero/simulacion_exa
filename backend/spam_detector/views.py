from django.shortcuts import render
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import EmailAnalysisSerializer, EmailFileUploadSerializer, PredictionResponseSerializer
from .utils.ml_handler import predict_spam
from .models import EmailAnalysis
from django.db.models import Count, Avg
from datetime import timedelta
from django.utils import timezone


class SpamDetectorAPIView(APIView):
    """
    API REST para detección de spam.
    POST /api/analyze/ - Analiza un email y retorna predicción
    """
    
    def post(self, request):
        """
        Analiza el contenido de un email y retorna la predicción.
        
        Request Body:
        {
            "email_text": "contenido del email..."
        }
        
        Response:
        {
            "prediction": "spam" | "ham" | "error",
            "confidence": 95.23,
            "latency": 12.45,
            "cleaned_text": "texto procesado..."
        }
        """
        serializer = EmailAnalysisSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email_text = serializer.validated_data['email_text']
        
        # Realizar predicción
        result = predict_spam(email_text)
        
        if result.get('prediction') in ['spam', 'ham']:
            try:
                EmailAnalysis.objects.create(
                    email_content=email_text[:1000],
                    prediction=result['prediction'],
                    confidence=result['confidence'] / 100,
                    latency_ms=result['latency'],
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
                )
            except Exception as e:
                print(f"Error saving analysis: {e}")
        
        # Validar respuesta
        response_serializer = PredictionResponseSerializer(data=result)
        if response_serializer.is_valid():
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        return Response(result, status=status.HTTP_200_OK)
    
    def get(self, request):
        """
        Health check endpoint.
        """
        return Response({
            'status': 'online',
            'message': 'Spam Detector API is running',
            'version': '1.0.0'
        })
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SpamDetectorFileAPIView(APIView):
    """
    API REST para detección de spam mediante archivos inmail.
    POST /api/analyze-file/ - Analiza un archivo inmail y retorna predicción
    """
    
    def post(self, request):
        """
        Analiza un archivo inmail (como los del dataset TREC).
        
        Request: multipart/form-data con campo 'file'
        
        Response:
        {
            "prediction": "spam" | "ham" | "error",
            "confidence": 95.23,
            "latency": 12.45,
            "cleaned_text": "texto procesado...",
            "filename": "inmail.1"
        }
        """
        serializer = EmailFileUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = serializer.validated_data['file']
        
        try:
            # Leer el contenido del archivo con múltiples codificaciones
            encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
            file_content = None
            
            for encoding in encodings:
                try:
                    file_content = uploaded_file.read().decode(encoding)
                    break
                except UnicodeDecodeError:
                    uploaded_file.seek(0)
                    continue
            
            if file_content is None:
                return Response(
                    {'error': 'No se pudo leer el archivo con las codificaciones soportadas.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Realizar predicción
            result = predict_spam(file_content)
            result['filename'] = uploaded_file.name
            
            if result.get('prediction') in ['spam', 'ham']:
                try:
                    EmailAnalysis.objects.create(
                        email_content=file_content[:1000],
                        prediction=result['prediction'],
                        confidence=result['confidence'] / 100,
                        latency_ms=result['latency'],
                        ip_address=self._get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
                    )
                except Exception as e:
                    print(f"Error saving analysis: {e}")
            
            # Validar respuesta
            response_serializer = PredictionResponseSerializer(data=result)
            if response_serializer.is_valid():
                result_data = response_serializer.data
                result_data['filename'] = uploaded_file.name
                return Response(result_data, status=status.HTTP_200_OK)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error procesando el archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class StatisticsAPIView(APIView):
    """
    GET /api/statistics/ - Obtiene estadísticas generales del sistema
    """
    
    def get(self, request):
        total_analyses = EmailAnalysis.objects.count()
        spam_count = EmailAnalysis.objects.filter(prediction='spam').count()
        ham_count = EmailAnalysis.objects.filter(prediction='ham').count()
        avg_confidence = EmailAnalysis.objects.aggregate(Avg('confidence'))['confidence__avg'] or 0
        avg_latency = EmailAnalysis.objects.aggregate(Avg('latency_ms'))['latency_ms__avg'] or 0
        
        # Estadísticas de las últimas 24 horas
        last_24h = timezone.now() - timedelta(hours=24)
        recent_analyses = EmailAnalysis.objects.filter(created_at__gte=last_24h)
        recent_spam = recent_analyses.filter(prediction='spam').count()
        recent_ham = recent_analyses.filter(prediction='ham').count()
        
        return Response({
            'total_analyses': total_analyses,
            'spam_count': spam_count,
            'ham_count': ham_count,
            'spam_percentage': round((spam_count / total_analyses * 100) if total_analyses > 0 else 0, 2),
            'ham_percentage': round((ham_count / total_analyses * 100) if total_analyses > 0 else 0, 2),
            'avg_confidence': round(avg_confidence * 100, 2) if avg_confidence else 0,
            'avg_latency': round(avg_latency, 2),
            'last_24h': {
                'total': recent_analyses.count(),
                'spam': recent_spam,
                'ham': recent_ham
            }
        })


class HistoryAPIView(APIView):
    """
    GET /api/history/ - Obtiene el historial de análisis recientes
    """
    
    def get(self, request):
        limit = int(request.GET.get('limit', 10))
        limit = min(limit, 50)
        
        analyses = EmailAnalysis.objects.all()[:limit]
        
        data = [{
            'id': analysis.id,
            'prediction': analysis.prediction,
            'confidence': analysis.confidence_percentage,
            'latency': round(analysis.latency_ms, 2),
            'created_at': analysis.created_at.isoformat(),
            'email_preview': analysis.email_content[:100] + '...' if len(analysis.email_content) > 100 else analysis.email_content
        } for analysis in analyses]
        
        return Response({
            'count': len(data),
            'results': data
        })


class ExportAPIView(APIView):
    """
    GET /api/export/ - Exporta estadísticas en formato JSON o CSV
    """
    
    def get(self, request):
        from django.http import HttpResponse
        import csv
        from io import StringIO
        
        format_type = request.GET.get('format', 'json')
        limit = int(request.GET.get('limit', 100))
        limit = min(limit, 1000)
        
        analyses = EmailAnalysis.objects.all()[:limit]
        
        if format_type == 'csv':
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', 'Predicción', 'Confianza (%)', 'Latencia (ms)', 'Fecha', 'Preview'])
            
            for analysis in analyses:
                writer.writerow([
                    analysis.id,
                    analysis.prediction.upper(),
                    analysis.confidence_percentage,
                    round(analysis.latency_ms, 2),
                    analysis.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    analysis.email_content[:100].replace('\n', ' ')
                ])
            
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="spam_analysis_export.csv"'
            return response
        
        # JSON por defecto
        data = [{
            'id': analysis.id,
            'prediction': analysis.prediction,
            'confidence': analysis.confidence_percentage,
            'latency': round(analysis.latency_ms, 2),
            'created_at': analysis.created_at.isoformat(),
            'email_content': analysis.email_content
        } for analysis in analyses]
        
        return Response({
            'format': 'json',
            'count': len(data),
            'exported_at': timezone.now().isoformat(),
            'data': data
        })
