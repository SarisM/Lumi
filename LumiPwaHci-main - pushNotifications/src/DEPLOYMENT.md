# 🚀 Guía de Despliegue - Lumi

Esta guía te ayudará a desplegar Lumi de forma segura fuera del entorno de Figma Make.

## 🔐 Seguridad de Claves (IMPORTANTE)

### ⚠️ Sobre el archivo `/utils/supabase/info.tsx`

**En el entorno de Figma Make:**
- Este archivo es autogenerado y las claves están protegidas por el sistema
- No necesitas modificarlo mientras trabajes en Figma Make

**Para despliegue externo (Vercel, Netlify, etc.):**
- ⚠️ **NUNCA** uses este archivo con claves hardcodeadas en producción
- Sigue los pasos de esta guía para usar variables de entorno

## 📋 Pasos para Despliegue Seguro

### 1. Configurar Variables de Entorno

#### A. Crear archivo .env local

```bash
cp .env.example .env
```

#### B. Obtener tus credenciales de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia las siguientes claves:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (solo para backend)

#### C. Completar el archivo .env

```env
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (solo backend)
SUPABASE_DB_URL=postgresql://... (solo backend)
```

### 2. Modificar el código para usar variables de entorno

#### A. Actualizar `/utils/supabase/info.tsx`

Reemplaza el contenido del archivo con:

```typescript
// Configuración de Supabase desde variables de entorno
export const projectId = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '';
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
```

#### B. Actualizar `/contexts/UserContext.tsx`

Busca las importaciones de Supabase y asegúrate de que usen las variables de entorno:

```typescript
import { projectId, publicAnonKey } from "../utils/supabase/info";

// O directamente:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 3. Verificar que .gitignore está configurado

Asegúrate de que `.env` está en `.gitignore`:

```
.env
.env.local
.env.*.local
```

### 4. Configurar variables en tu plataforma de despliegue

#### Vercel

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** > **Environment Variables**
3. Agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### Netlify

1. Ve a **Site settings** > **Build & deploy** > **Environment**
2. Agrega las mismas variables

#### Otros servicios

Consulta la documentación de tu plataforma para agregar variables de entorno.

## 🏗️ Opciones de Despliegue

### Opción 1: Vercel (Recomendado) ⚡

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Agregar variables de entorno en el dashboard
# https://vercel.com/dashboard
```

**Ventajas:**
- ✅ Deploy automático desde Git
- ✅ Previews de PRs
- ✅ Edge Functions (si necesitas)
- ✅ Dominio gratuito

### Opción 2: Netlify 🌐

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Desplegar
netlify deploy --prod

# O conecta tu repo de GitHub desde el dashboard
```

**Ventajas:**
- ✅ Deploy automático desde Git
- ✅ Functions integradas
- ✅ Formularios y más features

### Opción 3: GitHub Pages 📄

Para apps estáticas simples (sin backend Supabase activo):

```bash
# Construir
npm run build

# Desplegar (requiere configuración adicional)
npm run deploy
```

### Opción 4: Self-Hosting 🏠

```bash
# Construir
npm run build

# El contenido estático estará en /dist
# Súbelo a tu servidor web (Nginx, Apache, etc.)
```

## 🔧 Configuración de Supabase Edge Functions

Si usas las Edge Functions del backend:

### 1. Instalar Supabase CLI

```bash
npm install supabase --save-dev
# o
brew install supabase/tap/supabase
```

### 2. Iniciar sesión

```bash
npx supabase login
```

### 3. Link a tu proyecto

```bash
npx supabase link --project-ref tu-project-id
```

### 4. Desplegar Functions

```bash
npx supabase functions deploy
```

### 5. Configurar variables de entorno en Supabase

```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu-key
```

## 🧪 Probar Localmente

### 1. Correr el frontend

```bash
npm run dev
```

### 2. Correr Supabase Functions localmente

```bash
npx supabase functions serve
```

### 3. Verificar conexión

Abre http://localhost:5173 y verifica que:
- ✅ El perfil se guarda correctamente
- ✅ El tracking de agua funciona
- ✅ Las comidas se registran

## 📱 Convertir a PWA (Opcional)

Para que la app sea instalable en móviles:

### 1. Crear `public/manifest.json`

```json
{
  "name": "Lumi - App de Bienestar",
  "short_name": "Lumi",
  "description": "Construye hábitos saludables con tu llavero inteligente",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#FBBF24",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Registrar Service Worker

Agrega en `index.html`:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

### 3. Crear `public/sw.js`

```javascript
const CACHE_NAME = 'lumi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## 🔍 Checklist Pre-Despliegue

- [ ] Variables de entorno configuradas
- [ ] `.env` en `.gitignore`
- [ ] Claves hardcodeadas removidas del código
- [ ] Build exitoso (`npm run build`)
- [ ] Tests pasando (si aplica)
- [ ] Edge Functions desplegadas
- [ ] Conexión a Supabase funcionando
- [ ] Web Bluetooth testeado en móvil

## 🆘 Solución de Problemas

### Error: "Invalid API key"

- ✅ Verifica que las variables de entorno estén configuradas
- ✅ Asegúrate de usar el prefijo `VITE_` para variables del frontend
- ✅ Reinicia el servidor de desarrollo después de cambiar `.env`

### Error: "CORS blocked"

- ✅ Verifica la configuración CORS en Supabase
- ✅ Agrega tu dominio de producción en Supabase Dashboard > Authentication > URL Configuration

### Edge Functions no responden

- ✅ Verifica que estén desplegadas: `npx supabase functions list`
- ✅ Revisa los logs: `npx supabase functions logs`
- ✅ Asegúrate de que la URL en el código coincida con tu proyecto

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## 💬 Soporte

Si tienes problemas durante el despliegue:
1. Revisa los logs de tu plataforma
2. Verifica las variables de entorno
3. Consulta los logs de Supabase
4. Abre un issue en GitHub

---

**¡Buena suerte con tu despliegue! 🚀✨**
