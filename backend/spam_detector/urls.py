from django.urls import path
from .views import (
    SpamDetectorAPIView, 
    SpamDetectorFileAPIView,
    StatisticsAPIView,
    HistoryAPIView,
    ExportAPIView
)

app_name = 'spam_detector'

urlpatterns = [
    # Endpoints principales
    path('api/analyze/', SpamDetectorAPIView.as_view(), name='api_analyze'),
    path('api/health/', SpamDetectorAPIView.as_view(), name='api_health'),
    path('api/analyze-file/', SpamDetectorFileAPIView.as_view(), name='api_analyze_file'),
    
    path('api/statistics/', StatisticsAPIView.as_view(), name='api_statistics'),
    path('api/history/', HistoryAPIView.as_view(), name='api_history'),
    path('api/export/', ExportAPIView.as_view(), name='api_export'),
]
