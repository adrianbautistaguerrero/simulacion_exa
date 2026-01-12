# 📦 Guía Completa de Deployment

Esta guía te ayudará a deployar tu aplicación de detección de spam en Vercel (frontend) y Render (backend).

---

## 🎯 Pre-requisitos

### Frontend
- Cuenta en [Vercel](https://vercel.com)
- Repositorio Git (GitHub, GitLab, o Bitbucket)
- Node.js 18.x o superior instalado localmente

### Backend
- Cuenta en [Render](https://render.com)
- Repositorio Git con código de FastAPI/Django
- Python 3.11 instalado localmente

---

## 🚀 Opción 1: Deployment en Vercel (Recomendado para Frontend)

### Paso 1: Preparar el Repositorio

```bash
# Asegúrate de que todos los archivos estén commiteados
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New Project"**
3. Importa tu repositorio de Git
4. Vercel detectará automáticamente que es un proyecto Next.js

### Paso 3: Configurar Variables de Entorno

En la sección **"Environment Variables"**, añade:

```
NEXT_PUBLIC_API_URL=https://tu-backend-api.onrender.com
```

**IMPORTANTE**: Reemplaza `tu-backend-api.onrender.com` con la URL real de tu backend después de deployarlo.

### Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera a que la compilación termine (2-5 minutos)
3. Tu app estará disponible en `https://tu-proyecto.vercel.app`

### Paso 5: Actualizar Variables de Entorno

Una vez que tu backend esté deployado:
1. Ve a **Settings → Environment Variables** en Vercel
2. Actualiza `NEXT_PUBLIC_API_URL` con la URL correcta del backend
3. Click en **"Redeploy"** para aplicar cambios

---

## 🔧 Opción 2: Deployment en Render

### Para el Frontend (Alternativa a Vercel)

#### Paso 1: Crear Nuevo Static Site

1. Ve a [render.com](https://render.com) e inicia sesión
2. Click en **"New +"** → **"Static Site"**
3. Conecta tu repositorio

#### Paso 2: Configuración

```yaml
Build Command: npm install && npm run build
Publish Directory: .next
```

#### Paso 3: Variables de Entorno

```
NEXT_PUBLIC_API_URL=https://tu-backend-api.onrender.com
NODE_VERSION=18.18.0
```

#### Paso 4: Deploy

Click en **"Create Static Site"** y espera a que compile.

---

### Para el Backend (FastAPI/Django)

#### Paso 1: Crear Nuevo Web Service

1. En Render, click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio del backend
3. Selecciona la rama (main/master)

#### Paso 2: Configuración

```yaml
Name: spam-detector-api
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Para Django:
```yaml
Start Command: gunicorn django_spam_detector.wsgi:application
```

#### Paso 3: Variables de Entorno

```
PYTHON_VERSION=3.11.0
SECRET_KEY=<genera-una-clave-secreta>
DEBUG=0
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=<tu-url-de-base-de-datos>
```

#### Paso 4: Deploy

Click en **"Create Web Service"**. La URL será algo como:
```
https://spam-detector-api.onrender.com
```

---

## 🔗 Conectar Frontend y Backend

### Paso 1: Obtener URL del Backend

Después de deployar el backend, copia la URL (ej: `https://spam-detector-api.onrender.com`)

### Paso 2: Configurar CORS en el Backend

En tu código de FastAPI, asegúrate de tener:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://tu-proyecto.vercel.app",
        "https://tu-proyecto.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Para Django, en `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://tu-proyecto.vercel.app",
    "https://tu-proyecto.onrender.com",
]
```

### Paso 3: Actualizar Frontend

1. Ve a tu proyecto en Vercel/Render
2. Actualiza `NEXT_PUBLIC_API_URL` con la URL del backend
3. Redeploy el frontend

---

## ✅ Verificación Post-Deployment

### Checklist

- [ ] Frontend accesible en la URL de producción
- [ ] Backend accesible y responde a peticiones
- [ ] Análisis de texto funciona
- [ ] Análisis de archivo funciona
- [ ] Estadísticas cargan correctamente
- [ ] Historial muestra datos
- [ ] Sin errores CORS en la consola del navegador

### Pruebas

#### Test 1: Verificar Backend
```bash
curl https://tu-backend-api.onrender.com/api/statistics/
```
Debe retornar JSON con estadísticas.

#### Test 2: Verificar Frontend
Abre `https://tu-proyecto.vercel.app` en el navegador y:
1. Pega un texto de prueba
2. Click en "Analizar Texto"
3. Verifica que muestra resultados

#### Test 3: Verificar Conexión
Abre DevTools (F12) → Console
No debe haber errores CORS o de conexión.

---

## 🐛 Troubleshooting Común

### Error: "Failed to fetch" o "Network Error"

**Causa**: El frontend no puede conectarse al backend.

**Solución**:
1. Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurada
2. Verifica que el backend esté corriendo
3. Verifica configuración de CORS en el backend
4. Redeploy el frontend después de cambiar variables

### Error: "CORS policy blocked"

**Causa**: El backend no permite peticiones del frontend.

**Solución**:
Añade la URL del frontend a `allow_origins` en el backend:
```python
allow_origins=[
    "https://tu-proyecto.vercel.app",
]
```

### Error: Build failed en Vercel

**Causa**: Error de compilación de TypeScript o dependencias.

**Solución**:
1. Verifica que `npm run build` funcione localmente
2. Revisa los logs de build en Vercel
3. Asegúrate de que todas las dependencias estén en `package.json`

### Backend en Render es lento

**Causa**: Render free tier pone servicios en "sleep" después de 15 minutos de inactividad.

**Solución**:
- Upgrade a plan pagado
- O acepta 30-60 segundos de espera en la primera petición

---

## 🔄 Deployment Automático

### GitHub Actions para Vercel

Vercel deployará automáticamente cuando hagas push a `main`.

Para otras ramas:
1. Ve a Settings → Git en Vercel
2. Configura "Production Branch" y "Preview Branches"

### Webhooks de Render

Render re-deployará automáticamente cuando hagas push al repositorio conectado.

---

## 📊 Monitoreo

### Vercel Analytics

1. Ve a tu proyecto en Vercel
2. Click en **"Analytics"**
3. Revisa métricas de performance y tráfico

### Render Logs

1. Ve a tu servicio en Render
2. Click en **"Logs"**
3. Monitorea errores y peticiones en tiempo real

---

## 🔒 Seguridad

### Variables de Entorno

**NUNCA** commitees archivos `.env` al repositorio:
```bash
# Añade a .gitignore
.env
.env.local
.env*.local
```

### Secrets en Vercel

Las variables de entorno en Vercel están encriptadas y seguras.

### HTTPS

Tanto Vercel como Render proveen HTTPS automático con certificados SSL.

---

## 💰 Costos

### Vercel
- **Hobby (Free)**: 100GB bandwidth/mes, sitios ilimitados
- **Pro ($20/mes)**: 1TB bandwidth, más features

### Render
- **Free**: 750 horas/mes, servicios duermen después de 15 min
- **Starter ($7/mes)**: Siempre activo, 100GB bandwidth

---

## 🆘 Obtener Ayuda

Si tienes problemas:

1. **Logs de Vercel**: Dashboard → Deployments → Click en deployment → Logs
2. **Logs de Render**: Dashboard → Service → Logs
3. **Browser DevTools**: F12 → Console y Network tabs
4. **Documentación**:
   - [Vercel Docs](https://vercel.com/docs)
   - [Render Docs](https://render.com/docs)
   - [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ✨ Próximos Pasos

Después del deployment exitoso:

1. Configura un dominio personalizado
2. Añade monitoreo de errores (Sentry)
3. Configura analytics (Google Analytics, Plausible)
4. Implementa CI/CD testing
5. Añade rate limiting en el backend
