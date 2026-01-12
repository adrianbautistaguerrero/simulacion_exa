from django.db import models
from django.utils import timezone


class EmailAnalysis(models.Model):
    """Modelo para almacenar el historial de análisis de emails"""
    
    SPAM = 'spam'
    HAM = 'ham'
    PREDICTION_CHOICES = [
        (SPAM, 'SPAM'),
        (HAM, 'HAM'),
    ]
    
    email_content = models.TextField(help_text="Contenido del email analizado")
    prediction = models.CharField(max_length=10, choices=PREDICTION_CHOICES)
    confidence = models.FloatField(help_text="Nivel de confianza (0-1)")
    latency_ms = models.FloatField(help_text="Tiempo de respuesta en milisegundos")
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    
    class Meta:
        db_table = 'email_analysis'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['prediction']),
        ]
    
    def __str__(self):
        return f"{self.prediction.upper()} - {self.confidence:.2%} ({self.created_at})"
    
    @property
    def confidence_percentage(self):
        return round(self.confidence * 100, 2)
