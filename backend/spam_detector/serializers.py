from rest_framework import serializers


class EmailAnalysisSerializer(serializers.Serializer):
    """
    Serializer para validar el input de análisis de emails.
    """
    email_text = serializers.CharField(
        min_length=10,
        max_length=50000,
        required=True,
        error_messages={
            'required': 'El campo email_text es requerido.',
            'min_length': 'El email debe tener al menos 10 caracteres.',
            'max_length': 'El email es demasiado largo (máximo 50,000 caracteres).'
        }
    )

class EmailFileUploadSerializer(serializers.Serializer):
    """
    Serializer para validar la subida de archivos inmail.
    """
    file = serializers.FileField(
        required=True,
        error_messages={
            'required': 'El archivo es requerido.',
            'invalid': 'Archivo inválido.'
        }
    )


class PredictionResponseSerializer(serializers.Serializer):
    """
    Serializer para la respuesta de predicción.
    """
    prediction = serializers.CharField()
    confidence = serializers.FloatField()
    latency = serializers.FloatField()
    cleaned_text = serializers.CharField(required=False)
    error = serializers.CharField(required=False)
