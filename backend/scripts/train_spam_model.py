"""
Script robusto para entrenar un modelo de detección de SPAM
Genera un archivo 'modelo_spam_final.joblib' para inferencia en producción
"""

import os
import re
import joblib
import nltk
from html.parser import HTMLParser
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

# Descargar recursos necesarios de NLTK
print("Descargando recursos de NLTK...")
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)

# Configuración de rutas inteligentes y relativas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, 'trec')

print(f"BASE_DIR: {BASE_DIR}")
print(f"DATASET_PATH: {DATASET_PATH}")


class MLStripper(HTMLParser):
    """
    Clase para eliminar etiquetas HTML de texto.
    Basada en html.parser.HTMLParser para procesamiento limpio.
    """
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = []
    
    def handle_data(self, data):
        self.text.append(data)
    
    def get_data(self):
        return ''.join(self.text)


def strip_html_tags(html_text):
    """Elimina todas las etiquetas HTML del texto."""
    stripper = MLStripper()
    stripper.feed(html_text)
    return stripper.get_data()


class Parser:
    """
    Clase para procesar y tokenizar texto de correos electrónicos.
    Incluye limpieza, normalización y stemming.
    """
    def __init__(self):
        self.stopwords = set(nltk.corpus.stopwords.words('english'))
        self.stemmer = nltk.PorterStemmer()
    
    def tokenize(self, text):
        """
        Procesa el texto aplicando:
        1. Conversión a minúsculas
        2. Eliminación de puntuación
        3. Filtrado de stopwords
        4. Stemming
        """
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.split()
        tokens = [
            self.stemmer.stem(token) 
            for token in tokens 
            if token not in self.stopwords and len(token) > 1
        ]
        return ' '.join(tokens)
    
    def parse_email(self, subject, body):
        """
        Procesa un correo completo uniendo Subject y Body.
        Elimina HTML y aplica tokenización.
        """
        body_clean = strip_html_tags(body)
        full_text = f"{subject} {body_clean}"
        return self.tokenize(full_text)


def clean_path(original_path):
    """
    Limpia rutas que vienen con '../data/inmail.x' del archivo index
    y las convierte a rutas absolutas correctas.
    """
    cleaned = original_path.replace('../', '')
    return os.path.join(DATASET_PATH, cleaned)


def load_dataset(limit=15000):
    """
    Carga el dataset TREC desde el archivo index.
    Detecta y limpia rutas automáticamente.
    Limita a 'limit' correos para compatibilidad con RAM baja.
    """
    index_path = os.path.join(DATASET_PATH, 'full', 'index')
    
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"No se encontró el archivo index en: {index_path}")
    
    print(f"Cargando dataset desde: {index_path}")
    
    emails = []
    labels = []
    parser = Parser()
    
    with open(index_path, 'r', errors='ignore') as f:
        lines = f.readlines()[:limit]
        
        for i, line in enumerate(lines):
            parts = line.strip().split()
            if len(parts) < 2:
                continue
            
            label = parts[0]
            email_path = ' '.join(parts[1:])
            email_path = clean_path(email_path)
            
            try:
                with open(email_path, 'r', errors='ignore') as email_file:
                    content = email_file.read()
                    subject = ''
                    body = content
                    
                    if 'Subject:' in content:
                        lines_content = content.split('\n')
                        for line_content in lines_content:
                            if line_content.startswith('Subject:'):
                                subject = line_content.replace('Subject:', '').strip()
                                break
                    
                    processed_text = parser.parse_email(subject, body)
                    
                    if processed_text.strip():
                        emails.append(processed_text)
                        labels.append(1 if label == 'spam' else 0)
            
            except FileNotFoundError:
                continue
            except Exception as e:
                print(f"Error procesando {email_path}: {e}")
                continue
            
            if (i + 1) % 1000 == 0:
                print(f"Procesados {i + 1}/{len(lines)} correos...")
    
    print(f"\nTotal de correos cargados: {len(emails)}")
    print(f"SPAM: {sum(labels)}, HAM: {len(labels) - sum(labels)}")
    
    return emails, labels


def train_model():
    """
    Entrena el modelo de detección de SPAM usando Pipeline de Scikit-Learn.
    Exporta el modelo entrenado a 'modelo_spam_final.joblib'.
    """
    print("\n" + "="*60)
    print("INICIANDO ENTRENAMIENTO DEL MODELO DE DETECCIÓN DE SPAM")
    print("="*60 + "\n")
    
    X, y = load_dataset(limit=15000)
    
    if len(X) == 0:
        raise ValueError("No se pudieron cargar correos del dataset")
    
    print("\nDividiendo datos (80% train / 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Tamaño de entrenamiento: {len(X_train)}")
    print(f"Tamaño de prueba: {len(X_test)}")
    
    print("\nCreando Pipeline (CountVectorizer + LogisticRegression)...")
    pipeline = Pipeline([
        ('vectorizer', CountVectorizer()),
        ('classifier', LogisticRegression(max_iter=2000, random_state=42))
    ])
    
    print("\nEntrenando modelo...")
    pipeline.fit(X_train, y_train)
    print("✓ Entrenamiento completado")
    
    print("\nEvaluando modelo...")
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n" + "="*60)
    print("RESULTADOS DEL ENTRENAMIENTO")
    print("="*60)
    print(f"\nACCURACY: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print("\nREPORTE DE CLASIFICACIÓN:")
    print("-"*60)
    print(classification_report(
        y_test, y_pred, 
        target_names=['HAM', 'SPAM'],
        digits=4
    ))
    
    output_path = os.path.join(os.path.dirname(BASE_DIR), 'modelo_spam_final.joblib')
    print(f"\nGuardando modelo en: {output_path}")
    joblib.dump(pipeline, output_path)
    print("✓ Modelo guardado exitosamente")
    
    print("\n" + "="*60)
    print("ENTRENAMIENTO FINALIZADO CON ÉXITO")
    print("="*60 + "\n")
    
    return pipeline, accuracy


if __name__ == "__main__":
    try:
        model, acc = train_model()
        print(f"\n🎉 ¡Modelo entrenado y guardado con éxito! (Accuracy: {acc:.2%})")
    except Exception as e:
        print(f"\n❌ Error durante el entrenamiento: {e}")
        raise
