from django.apps import AppConfig
import joblib
import os


class SpamDetectorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'spam_detector'
    model = None
    
    def ready(self):
        """
        Carga el modelo ML una sola vez cuando Django inicia.
        Esto optimiza el rendimiento evitando cargar el modelo en cada request.
        """
        from django.conf import settings
        
        if SpamDetectorConfig.model is None:
            model_path = settings.ML_MODEL_PATH
            
            if os.path.exists(model_path):
                try:
                    SpamDetectorConfig.model = joblib.load(model_path)
                    print(f"✅ Modelo ML cargado exitosamente desde: {model_path}")
                except Exception as e:
                    print(f"❌ Error cargando el modelo: {e}")
            else:
                print(f"⚠️ Advertencia: No se encontró el modelo en {model_path}")
