from html.parser import HTMLParser
from io import StringIO
import re
import time
import numpy as np


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


def extract_spam_keywords(email_text, model, prediction, top_n=10):
    """
    Extrae las palabras más relevantes que contribuyen a la clasificación de spam.
    
    Args:
        email_text (str): Texto limpio del email
        model: Modelo de ML con vectorizer y clasificador
        prediction (str): Predicción realizada ('spam' o 'ham')
        top_n (int): Número de palabras a retornar
    
    Returns:
        list: Lista de palabras clave que contribuyen al spam
    """
    try:
        # Solo retornar palabras si la predicción es spam
        if prediction != 'spam':
            return []
        
        # Intentar extraer features del modelo
        if hasattr(model, 'named_steps'):
            # Si es un Pipeline
            vectorizer = model.named_steps.get('vectorizer') or model.named_steps.get('tfidfvectorizer')
            classifier = model.named_steps.get('classifier') or model.named_steps.get('logisticregression')
            
            if vectorizer and classifier and hasattr(classifier, 'coef_'):
                # Obtener vocabulario y coeficientes
                feature_names = vectorizer.get_feature_names_out()
                coefficients = classifier.coef_[0]
                
                # Vectorizar el texto actual
                text_vector = vectorizer.transform([email_text])
                
                # Encontrar palabras presentes en el email
                word_indices = text_vector.nonzero()[1]
                
                # Obtener coeficientes de las palabras presentes
                word_importance = []
                for idx in word_indices:
                    word = feature_names[idx]
                    importance = coefficients[idx]
                    if importance > 0:  # Solo palabras que contribuyen a spam
                        word_importance.append((word, importance))
                
                # Ordenar por importancia y retornar top N
                word_importance.sort(key=lambda x: x[1], reverse=True)
                keywords = [word for word, _ in word_importance[:top_n]]
                
                return keywords
        
        # Si no podemos extraer del modelo, usar lista común de palabras spam
        common_spam_words = [
            'free', 'winner', 'click', 'offer', 'prize', 'money', 'cash', 
            'urgent', 'limited', 'act now', 'congratulations', 'claim',
            'bonus', 'discount', 'save', 'deal', 'credit', 'loan'
        ]
        
        # Filtrar palabras que aparecen en el email
        email_words = set(email_text.lower().split())
        found_keywords = [word for word in common_spam_words if word in email_words]
        
        return found_keywords[:top_n]
        
    except Exception as e:
        print(f"Error extracting keywords: {e}")
        return []


def predict_spam(email_text):
    """
    Realiza predicción de spam/ham sobre un email.
    
    Args:
        email_text (str): Texto del email a analizar
    
    Returns:
        dict: {
            'prediction': 'spam' o 'ham',
            'confidence': float (0-100),
            'latency': float (milisegundos),
            'spam_keywords': list (palabras que contribuyen al spam)
        }
    """
    from spam_detector.apps import SpamDetectorConfig
    
    # Verificar que el modelo esté cargado
    if SpamDetectorConfig.model is None:
        return {
            'prediction': 'error',
            'confidence': 0.0,
            'latency': 0.0,
            'spam_keywords': [],
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
        
        # Determinar predicción
        prediction_label = 'spam' if prediction == 1 else 'ham'
        
        spam_keywords = extract_spam_keywords(
            cleaned_text, 
            SpamDetectorConfig.model, 
            prediction_label,
            top_n=10
        )
        
        # Calcular latencia
        end_time = time.time()
        latency = (end_time - start_time) * 1000
        
        return {
            'prediction': prediction_label,
            'confidence': round(confidence, 2),
            'latency': round(latency, 2),
            'cleaned_text': cleaned_text[:200] + '...' if len(cleaned_text) > 200 else cleaned_text,
            'spam_keywords': spam_keywords  # Add keywords to response
        }
    
    except Exception as e:
        return {
            'prediction': 'error',
            'confidence': 0.0,
            'latency': 0.0,
            'spam_keywords': [],
            'error': str(e)
        }
