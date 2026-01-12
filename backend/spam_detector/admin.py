from django.contrib import admin
from .models import EmailAnalysis


@admin.register(EmailAnalysis)
class EmailAnalysisAdmin(admin.ModelAdmin):
    list_display = ('id', 'prediction', 'confidence_percentage', 'latency_ms', 'created_at', 'ip_address')
    list_filter = ('prediction', 'created_at')
    search_fields = ('email_content', 'ip_address')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Predicción', {
            'fields': ('prediction', 'confidence', 'latency_ms')
        }),
        ('Contenido', {
            'fields': ('email_content',)
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'created_at')
        }),
    )
