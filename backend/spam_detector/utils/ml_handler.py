from html.parser import HTMLParser
from io import StringIO
import re
import time


class MLStripper(HTMLParser):
    """
    Clase para remover tags HTML del contenido de emails.
    IMPORTANTE: Esta clase debe ser IDÉNTICA a la usada en el entrenamiento.
    """
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = StringIO()
    
    def handle_data(self, d):
        self.text.write(d)
    
    def get_data(self):
        return self.text.getvalue()


class Parser:
    """
    Parser que extrae y limpia el contenido de emails para el modelo ML.
    IMPORTANTE: Esta clase debe ser IDÉNTICA a la usada en el entrenamiento.
    """
    def __init__(self):
        self.stemmer = None
        self.mail = None
    
    def parse(self, raw_email):
        """
        Parsea el email crudo y extrae el contenido limpio.
        """
        lines = raw_email.split('\n')
        email_body = []
        body_started = False
        
        for line in lines:
            if not body_started:
                if line.strip() == '':
                    body_started = True
                continue
            email_body.append(line)
        
        body_text = '\n'.join(email_body)
        
        # Remover HTML
        s = MLStripper()
        try:
            s.feed(body_text)
            body_text = s.get_data()
        except:
            pass
        
        # Limpiar texto
        body_text = re.sub(r'\s+', ' ', body_text)
        body_text = body_text.lower()
        body_text = re.sub(r'[^a-záéíóúñ\s]', '', body_text)
        
        return body_text.strip()


def predict_spam(email_text):
    """
    Realiza predicción de spam/ham sobre un email.
    
    Args:
        email_text (str): Texto del email a analizar
    
    Returns:
        dict: {
            'prediction': 'spam' o 'ham',
            'confidence': float (0-100),
            'latency': float (milisegundos)
        }
    """
    from spam_detector.apps import SpamDetectorConfig
    
    # Verificar que el modelo esté cargado
    if SpamDetectorConfig.model is None:
        return {
            'prediction': 'error',
            'confidence': 0.0,
            'latency': 0.0,
            'error': 'Modelo no cargado. Asegúrate de que modelo_spam_final.joblib exista en la raíz del proyecto.'
        }
    
    # Medir tiempo de inicio
    start_time = time.time()
    
    try:
        # Preprocesar el email
        parser = Parser()
        cleaned_text = parser.parse(email_text)
        
        # Realizar predicción
        prediction = SpamDetectorConfig.model.predict([cleaned_text])[0]
        
        # Obtener probabilidades (confianza)
        probabilities = SpamDetectorConfig.model.predict_proba([cleaned_text])[0]
        confidence = max(probabilities) * 100
        
        # Calcular latencia
        end_time = time.time()
        latency = (end_time - start_time) * 1000
        
        return {
            'prediction': 'spam' if prediction == 1 else 'ham',
            'confidence': round(confidence, 2),
            'latency': round(latency, 2),
            'cleaned_text': cleaned_text[:200] + '...' if len(cleaned_text) > 200 else cleaned_text
        }
    
    except Exception as e:
        return {
            'prediction': 'error',
            'confidence': 0.0,
            'latency': 0.0,
            'error': str(e)
        }
