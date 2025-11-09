# Debugging Supabase Authentication Issues

## Problema Reportado
El usuario reportó que Supabase no funciona, ni el login ni el sign up.

## Última Actualización: Fix de JWT Inválido

### Problema del JWT Inválido (401)
El error "Invalid JWT" ocurría porque:
- Se guardaba el access_token en localStorage
- Al recargar, el token podía estar expirado
- No se validaba con Supabase antes de usar

### Solución Implementada
✅ **Validación de Sesión con Supabase**
- Ahora se usa `supabase.auth.getSession()` para obtener sesión válida
- Si la sesión expiró, se hace logout automático
- El token se actualiza automáticamente cuando Supabase lo refresca

✅ **Listener de Cambios de Auth**
- Se escuchan eventos: `SIGNED_OUT`, `TOKEN_REFRESHED`, `SIGNED_IN`
- El token se actualiza automáticamente cuando se refresca
- El estado se limpia cuando el usuario cierra sesión

✅ **Logout Mejorado**
- Ahora es asíncrono y cierra sesión en Supabase
- Limpia todo el estado y localStorage
- Desuscribe listeners al cerrar sesión

## Cambios Implementados

### 1. Servidor Backend (`/supabase/functions/server/index.tsx`)

#### Endpoint de Signup Mejorado
- ✅ Añadido logging detallado en cada paso del proceso
- ✅ Verificación de variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- ✅ Mensajes de error más descriptivos con contexto completo
- ✅ Mejor manejo de errores de KV store (continúa aunque falle)

#### Nuevo Endpoint de Testing
- ✅ Añadido `/make-server-7e221a31/test-supabase` para verificar conexión
- ✅ Verifica estado de variables de entorno
- ✅ Prueba consulta a la base de datos KV

#### Endpoint de Perfil de Usuario Mejorado
- ✅ Validación de userId antes de consultar
- ✅ Mensajes de error más descriptivos
- ✅ Logging mejorado

### 2. Cliente de Supabase (`/utils/supabase/client.tsx`)

- ✅ Verificación de credenciales al inicializar
- ✅ Configuración explícita de opciones de autenticación:
  - `persistSession: true` - Persiste la sesión en localStorage
  - `autoRefreshToken: true` - Refresca automáticamente el token
  - `detectSessionInUrl: true` - Detecta sesión en la URL
- ✅ Logging de inicialización

### 3. AuthScreen (`/pages/AuthScreen.tsx`)

#### Test de Conexión Automático
- ✅ Verifica la conexión al montar el componente
- ✅ Muestra estado de conexión en la UI (debug info)

#### Login/Signup Mejorado
- ✅ Logging detallado de cada paso
- ✅ Mensajes de error en español más claros
- ✅ Validación de contraseña (mínimo 6 caracteres)
- ✅ Mejor manejo de errores con contexto

### 4. UserContext (`/contexts/UserContext.tsx`)

- ✅ Logging detallado en restauración de sesión
- ✅ Mejor manejo de errores al cargar perfil
- ✅ Validaciones adicionales

### 5. Utilidades de Debug (`/utils/debug.ts`) - NUEVO

- ✅ `debugLog()` - Logging consistente con contexto
- ✅ `debugError()` - Errores con contexto
- ✅ `debugWarn()` - Advertencias con contexto
- ✅ `testSupabaseConnection()` - Función helper para testing

## Cómo Diagnosticar Problemas

### 1. Verificar Conexión del Servidor
Abre la consola del navegador y busca el mensaje:
```
✅ Servidor conectado
```

Si ves:
```
⚠️ [mensaje de error]
```
Revisa los logs de la consola para más detalles.

### 2. Verificar Variables de Entorno del Servidor

Las siguientes variables DEBEN estar configuradas en Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

### 3. Revisar Logs en la Consola

Todos los logs están prefijados con `[Lumi Debug - Contexto]` o `[Lumi Error - Contexto]`.

#### Durante Login:
```
[Lumi Debug - AuthScreen] Attempting to sign in with email: [email]
[Lumi Debug - AuthScreen] Sign in successful, user ID: [userId]
[Lumi Debug - AuthScreen] Checking user profile...
[Lumi Debug - AuthScreen] Profile data: {...}
```

#### Durante Signup:
```
[Lumi Debug - AuthScreen] Attempting to sign up with email: [email]
[Lumi Debug - AuthScreen] Signup response: {...}
[Lumi Debug - AuthScreen] Account created, attempting auto-login...
[Lumi Debug - AuthScreen] Auto-login successful
```

#### En el Servidor:
```
Signup request received for email: [email]
Creating user with Supabase Auth...
User created successfully: [userId]
User data initialized in KV store
```

### 4. Problemas Comunes y Soluciones

#### Error: "Missing Supabase credentials"
**Causa**: Variables de entorno no configuradas
**Solución**: Verificar que las variables estén configuradas en Supabase

#### Error: "Failed to fetch"
**Causa**: Servidor no accesible o CORS
**Solución**: 
- Verificar que el servidor esté corriendo
- Verificar configuración de CORS en el servidor

#### Error: "Invalid login credentials"
**Causa**: Email o contraseña incorrectos
**Solución**: Verificar credenciales

#### Error: "User already registered"
**Causa**: El email ya está en uso
**Solución**: Usar otro email o hacer login

#### Error: "User not found"
**Causa**: Perfil de usuario no existe en KV store
**Solución**: 
- Verificar que el signup completó correctamente
- Revisar logs del servidor para errores de KV store

## Testing Manual

### 1. Test de Conexión
1. Abrir la app en el navegador
2. Ir a AuthScreen
3. Revisar el indicador de debug (parte inferior)
4. Debe mostrar: "✅ Servidor conectado"

### 2. Test de Signup
1. Click en "Sign up"
2. Llenar el formulario
3. Click en "Create Account"
4. Revisar logs en consola
5. Debe redirigir a onboarding

### 3. Test de Login
1. Usar credenciales existentes
2. Click en "Sign In"
3. Revisar logs en consola
4. Debe redirigir a dashboard (si tiene perfil) o onboarding

## Flags de Debug

En `/utils/debug.ts`, cambiar `DEBUG = false` para deshabilitar logging en producción.

## Próximos Pasos

Si los problemas persisten después de estos cambios:

1. Verificar que Supabase Auth esté habilitado en el proyecto
2. Verificar que el servicio de Supabase esté activo
3. Revisar límites de rate limiting
4. Verificar configuración de email en Supabase (aunque `email_confirm: true` debería saltarse esto)
