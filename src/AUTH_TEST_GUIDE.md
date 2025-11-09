# Guía de Pruebas de Autenticación

## Pruebas Recomendadas

### 1. Test de Signup (Registro)

**Pasos:**
1. Abrir la aplicación
2. Verificar que muestre "✅ Servidor conectado" en la parte inferior
3. Click en "Sign up"
4. Llenar el formulario:
   - Nombre: [tu nombre]
   - Email: [email único]
   - Contraseña: [mínimo 6 caracteres]
   - Horario del día (opcional, tiene valores por defecto)
5. Click en "Create Account"

**Resultado Esperado:**
- Consola muestra: `[Lumi Debug - AuthScreen] Account created, attempting auto-login...`
- Consola muestra: `[Lumi Debug - AuthScreen] Auto-login successful`
- Redirige a la pantalla de onboarding
- NO debe mostrar errores de JWT

**Logs Esperados en el Servidor:**
```
Signup request received for email: [email]
Creating user with Supabase Auth...
User created successfully: [userId]
User data initialized in KV store
```

---

### 2. Test de Login (Inicio de Sesión)

**Pasos:**
1. Usar credenciales de un usuario existente
2. Click en "Sign In"
3. Ingresar email y contraseña
4. Click en "Sign In"

**Resultado Esperado:**
- Consola muestra: `[Lumi Debug - AuthScreen] Sign in successful, user ID: [userId]`
- Consola muestra: `[Lumi Debug - AuthScreen] Checking user profile...`
- Redirige a dashboard (si tiene perfil) o onboarding (si no lo tiene)
- NO debe mostrar errores de JWT

---

### 3. Test de Persistencia de Sesión

**Pasos:**
1. Iniciar sesión
2. Recargar la página (F5 o Cmd+R)

**Resultado Esperado:**
- Consola muestra: `[Lumi Debug - UserContext] Checking for active session...`
- Consola muestra: `[Lumi Debug - UserContext] Active session found for user: [userId]`
- La app se mantiene logueada
- NO debe mostrar el error "Invalid JWT"
- NO debe redirigir a la pantalla de login

**Si Aparece Error "Invalid JWT":**
Esto significa que:
- La sesión de Supabase expiró
- Las credenciales en Supabase no son válidas
- Hay un problema con el token

**Logs Esperados:**
```
[Lumi Debug - UserContext] Checking for active session...
[Lumi Debug - UserContext] Active session found for user: [userId]
[Lumi Debug - UserContext] Loading user profile from server...
[Lumi Debug - UserContext] Profile fetch response status: 200
[Lumi Debug - UserContext] Loaded user data: {...}
[Lumi Debug - UserContext] Profile and needs set successfully
```

---

### 4. Test de Logout

**Pasos:**
1. Estar logueado
2. Ir a la pestaña "Profile"
3. Scroll hasta el final
4. Click en "Cerrar sesión"

**Resultado Esperado:**
- Consola muestra: `[Lumi Debug - UserContext] Logging out...`
- Consola muestra: `[Lumi Debug - UserContext] Supabase signOut completed`
- Consola muestra: `[Lumi Debug - UserContext] Logout completed`
- Redirige a la pantalla de login
- localStorage se limpia

---

### 5. Test de Token Refresh

**Pasos:**
1. Iniciar sesión
2. Dejar la app abierta durante más de 1 hora
3. Interactuar con la app (ej: agregar agua)

**Resultado Esperado:**
- Consola muestra: `[Lumi Debug - UserContext] Auth state changed: TOKEN_REFRESHED`
- Consola muestra: `[Lumi Debug - UserContext] Token refreshed, updating access token`
- La app sigue funcionando normalmente
- NO se cierra la sesión automáticamente

---

## Errores Comunes y Soluciones

### Error: "Invalid JWT" (401)

**Causa:** Token expirado o inválido

**Solución Automática:** 
- El sistema ahora detecta esto y hace logout automático
- Verás en consola: `[Lumi Debug - UserContext] Token invalid, clearing session`

**Acción del Usuario:**
- Simplemente volver a iniciar sesión

---

### Error: "No active Supabase session found"

**Causa:** No hay sesión válida en Supabase

**Comportamiento:**
- La app limpia el localStorage automáticamente
- Redirige al login

**Esto es Normal Si:**
- Es la primera vez que abres la app
- Acabas de hacer logout
- La sesión expiró después de mucho tiempo

---

### Error: "User not found" (404)

**Causa:** El usuario no ha completado el onboarding

**Comportamiento:**
- La app redirige al onboarding
- Esto es normal para usuarios nuevos

---

## Verificación de Configuración

### Variables de Entorno Requeridas

En Supabase Edge Functions, verificar que existan:

```bash
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_DB_URL=[db-url]
```

### Verificar en Consola del Navegador

Al abrir la app, debes ver:

```
Initializing Supabase client with URL: https://[project-id].supabase.co
Supabase client initialized successfully
[Lumi Debug - AuthScreen] Component mounted, testing connection...
[Lumi Debug - AuthScreen] Connection test passed
```

---

## Debug Avanzado

### Habilitar/Deshabilitar Logs

En `/utils/debug.ts`:
```typescript
export const DEBUG = true;  // Cambiar a false para producción
```

### Inspeccionar Estado de Supabase

En la consola del navegador:
```javascript
// Ver sesión actual
const session = await supabase.auth.getSession()
console.log(session)

// Ver usuario actual
const user = await supabase.auth.getUser()
console.log(user)
```

### Forzar Logout

En la consola del navegador:
```javascript
await supabase.auth.signOut()
```

---

## Checklist de Funcionalidad

- [ ] El servidor responde al health check
- [ ] Signup crea un nuevo usuario
- [ ] Signup hace auto-login después de crear cuenta
- [ ] Login funciona con credenciales válidas
- [ ] Login muestra error con credenciales inválidas
- [ ] La sesión persiste al recargar la página
- [ ] NO aparece error "Invalid JWT" al recargar
- [ ] Logout cierra sesión correctamente
- [ ] Logout limpia el localStorage
- [ ] El token se refresca automáticamente
- [ ] Los eventos de auth se loguean correctamente
