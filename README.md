# 🛡️ Detector de SPAM con Machine Learning

Sistema de detección de spam utilizando Regresión Logística y CountVectorizer entrenado con el dataset TREC07p.

## 📋 Stack Tecnológico

### Frontend (Next.js)
- **Next.js**: 16.0.10
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.1.9
- **shadcn/ui**: Componentes UI
- **Recharts**: 2.15.4 (Visualización de datos)

### Backend (requerido)
- **FastAPI**: Python backend para análisis de spam
- **Scikit-learn**: Modelo de Machine Learning
- **Base de datos**: SQLite o PostgreSQL

---

## 🚀 Opciones de Deployment

### Opción 1: Vercel (Frontend)

#### Deployment Automático
1. Haz push de tu código a GitHub
2. Conecta tu repositorio en [vercel.com](https://vercel.com)
3. Vercel detectará automáticamente Next.js
4. Configura la variable de entorno `NEXT_PUBLIC_API_URL`

#### Deployment desde CLI
```bash
npm install -g vercel
vercel login
vercel
```

#### Variables de Entorno en Vercel
En tu proyecto de Vercel, añade:
- `NEXT_PUBLIC_API_URL`: URL de tu backend API (ej: `https://tu-api.onrender.com`)

### Opción 2: Render (Frontend + Backend)

#### Frontend en Render
1. Crea un nuevo "Static Site" en [render.com](https://render.com)
2. Conecta tu repositorio
3. Configuración:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: URL de tu backend

#### Backend en Render
1. Crea un nuevo "Web Service"
2. Usa tu repositorio de FastAPI
3. Configuración:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**: Configura según tu backend

---

## 🔧 Instalación Local

### Prerrequisitos
- Node.js 18.x o superior
- npm o yarn
- Backend de FastAPI corriendo (ver sección Backend)

### Pasos de Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd spamdetectionmodel2

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local y añadir NEXT_PUBLIC_API_URL

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Para producción en Vercel:
# NEXT_PUBLIC_API_URL=https://tu-api-backend.onrender.com
```

---

## ✅ Verificación de Compatibilidad entre Versiones

### Matriz de Compatibilidad

| Paquete | Versión | Compatible con |
|---------|---------|----------------|
| Next.js | 16.0.10 | React 19.2.0 |
| React | 19.2.0 | React DOM 19.2.0 |
| TypeScript | 5.x | Next.js 16.x |
| Tailwind CSS | 4.1.9 | @tailwindcss/postcss 4.1.9 |
| Radix UI | 1.x - 2.x | React 19.x |
| Recharts | 2.15.4 | React 19.x |

### Verificar Compatibilidad

#### 1. Verificar versiones instaladas
```bash
# Ver versiones actuales
npm list next react react-dom typescript

# Ver todas las dependencias
npm list --depth=0
```

#### 2. Verificar peer dependencies
```bash
npm ls
```
Si hay conflictos, verás advertencias `WARN`.

#### 3. Verificar vulnerabilidades
```bash
npm audit
npm audit fix
```

#### 4. Verificar actualizaciones disponibles
```bash
npm outdated
```

### Reglas de Compatibilidad

#### ✅ Compatibilidades Verificadas
- **Next.js 16.x** requiere **React 19.x**
- **Tailwind CSS 4.x** requiere **PostCSS 8.5+**
- **Radix UI 1.x-2.x** es compatible con **React 19.x**
- **TypeScript 5.x** es compatible con **Next.js 16.x**

#### ⚠️ Posibles Conflictos

1. **React 19 y Librerías Legacy**
   - Algunas librerías antiguas pueden no ser compatibles con React 19
   - Solución: Actualizar o buscar alternativas

2. **Tailwind CSS 4.x**
   - Cambios importantes desde v3
   - Usar `@tailwindcss/postcss` en lugar de configuración tradicional

3. **Node.js**
   - Next.js 16 requiere Node.js 18.18.0 o superior
   - Verificar: `node --version`

---

## 🧪 Testing de Compatibilidad

### Test 1: Compilación
```bash
npm run build
```
**Debe compilar sin errores.**

### Test 2: Desarrollo
```bash
npm run dev
```
**Debe iniciar sin advertencias críticas.**

### Test 3: Linting
```bash
npm run lint
```
**No debe haber errores de TypeScript.**

### Test 4: Peer Dependencies
```bash
npm ls 2>&1 | grep -i "peer"
```
**No debe haber conflictos de peer dependencies.**

---

## 📦 Scripts Disponibles

```json
{
  "dev": "next dev",           // Desarrollo (puerto 3000)
  "build": "next build",       // Compilar para producción
  "start": "next start",       // Ejecutar producción
  "lint": "eslint ."           // Verificar código
}
```

---

## 🔄 Actualización de Dependencias

### Actualización Segura

```bash
# 1. Verificar versiones actuales
npm outdated

# 2. Actualizar dependencias menores y parches
npm update

# 3. Actualizar dependencias mayores (con cuidado)
npm install <package>@latest

# 4. Verificar que todo funciona
npm run build
npm run dev
```

### Actualización por Categoría

#### Actualizar solo dependencias de producción
```bash
npm update --save
```

#### Actualizar solo dependencias de desarrollo
```bash
npm update --save-dev
```

---

## 🐛 Troubleshooting

### Error: "Module not found"
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json .next
npm install
```

### Error: "Type error" en TypeScript
```bash
# Verificar versión de TypeScript
npm list typescript

# Reinstalar tipos
npm install --save-dev @types/react @types/node
```

### Error: "Cannot connect to API"
- Verificar que `NEXT_PUBLIC_API_URL` esté configurada
- Verificar que el backend esté corriendo
- Verificar CORS en el backend

### Error de compilación en producción
```bash
# Verificar Next.js config
cat next.config.mjs

# Debe tener:
# typescript: { ignoreBuildErrors: false }
# images: { unoptimized: true }
```

---

## 📊 Configuración del Backend

### Requisitos del Backend (FastAPI)

El frontend espera los siguientes endpoints:

#### POST `/api/analyze/`
```json
{
  "email_text": "string"
}
```

#### POST `/api/analyze-file/`
```
FormData con campo "file"
```

#### GET `/api/statistics/`
Retorna estadísticas de análisis

#### GET `/api/history/?limit=10`
Retorna historial de análisis

### Configurar CORS en FastAPI

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://tu-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📝 Checklist de Deployment

### Pre-deployment
- [ ] Todas las dependencias instaladas
- [ ] `npm run build` exitoso
- [ ] Variables de entorno configuradas
- [ ] Backend corriendo y accesible
- [ ] CORS configurado en backend
- [ ] Tests pasando

### Post-deployment
- [ ] URL del frontend accesible
- [ ] Conexión con backend funcional
- [ ] Análisis de texto funcional
- [ ] Análisis de archivo funcional
- [ ] Estadísticas cargando
- [ ] Historial cargando

---

## 🔍 Verificación Final

### Verificar Build
```bash
npm run build
# Debe completar sin errores
```

### Verificar Tipos
```bash
npx tsc --noEmit
# No debe haber errores de tipos
```

### Verificar Tamaño del Bundle
```bash
npm run build
# Revisar el output para ver tamaños
```

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica la sección de Troubleshooting
2. Revisa los logs en la consola del navegador
3. Verifica los logs del backend
4. Asegúrate de que todas las versiones sean compatibles

---

## 📄 Licencia

[Tu licencia aquí]
