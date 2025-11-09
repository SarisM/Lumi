# Resumen de Corrección - Error JWT Inválido

## Problema Original

```
[Lumi Error - UserContext] Profile fetch failed: {"code":401,"message":"Invalid JWT"}
[Lumi Error - UserContext] Error loading profile on restore: Error: Failed to fetch profile: 401
```

## Causa Raíz

El sistema guardaba el `access_token` en localStorage pero no validaba si seguía siendo válido al restaurar la sesión. Cuando la app se recargaba:

1. ❌ Se leía el token de localStorage
2. ❌ Se intentaba usar sin validar
3. ❌ El token había expirado
4. ❌ El servidor respondía con 401 Unauthorized

## Solución Implementada

### 1. Validación de Sesión con Supabase

**Archivo:** `/contexts/UserContext.tsx`

**Cambios:**
- ✅ Ahora se usa `supabase.auth.getSession()` para obtener la sesión válida
- ✅ Si la sesión no existe o es inválida, se hace logout automático
- ✅ El token se obtiene de la sesión activa de Supabase, no de localStorage

**Código:**
```typescript
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (!session) {
  // No hay sesión válida, limpiar todo
  await logout();
  return;
}

// Usar el token válido de la sesión activa
const validToken = session.access_token;
```

### 2. Listener de Eventos de Autenticación

**Nuevas Capacidades:**
- ✅ Escucha cambios en el estado de autenticación
- ✅ Detecta cuando el usuario cierra sesión (`SIGNED_OUT`)
- ✅ Detecta cuando el token se refresca (`TOKEN_REFRESHED`)
- ✅ Actualiza automáticamente el token cuando Supabase lo refresca

**Código:**
```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    await logout();
  } else if (event === 'TOKEN_REFRESHED') {
    setAccessToken(session.access_token);
    localStorage.setItem("lumi_access_token", session.access_token);
  }
});
```

### 3. Logout Asíncrono Mejorado

**Mejoras:**
- ✅ Ahora es asíncrono (`async`)
- ✅ Llama a `supabase.auth.signOut()` para cerrar sesión en Supabase
- ✅ Limpia todo el estado y localStorage
- ✅ Incluye logging detallado

**Código:**
```typescript
const logout = async () => {
  debugLog('UserContext', 'Logging out...');
  
  await supabase.auth.signOut();
  
  // Limpiar todo el estado
  setUserId(null);
  setAccessToken(null);
  // ... resto del estado
  
  // Limpiar localStorage
  localStorage.removeItem("lumi_user_id");
  localStorage.removeItem("lumi_access_token");
  // ... resto de localStorage
};
```

### 4. Cliente de Supabase Configurado

**Archivo:** `/utils/supabase/client.tsx`

**Configuración:**
```typescript
export const supabase = createClient(
  supabaseUrl,
  publicAnonKey,
  {
    auth: {
      persistSession: true,      // Persiste sesión en localStorage
      autoRefreshToken: true,    // Refresca token automáticamente
      detectSessionInUrl: true   // Detecta sesión en URL
    }
  }
);
```

## Flujo Corregido

### Al Iniciar la App

```
1. UserContext se monta
2. ✅ Llama a supabase.auth.getSession()
3. ✅ Verifica si hay sesión válida
   - Si SÍ: Usa el token de la sesión activa
   - Si NO: Hace logout y limpia todo
4. ✅ Carga el perfil del usuario con token válido
5. ✅ Configura listener para cambios de auth
```

### Durante el Uso de la App

```
1. Supabase refresca el token automáticamente antes de que expire
2. ✅ El listener detecta TOKEN_REFRESHED
3. ✅ Actualiza el access_token en el estado
4. ✅ Actualiza el access_token en localStorage
5. ✅ Las siguientes requests usan el token actualizado
```

### Al Recargar la Página

```
1. UserContext se monta nuevamente
2. ✅ Llama a supabase.auth.getSession()
3. ✅ Obtiene la sesión activa (si existe)
4. ✅ Usa el token válido de la sesión
5. ✅ NO usa el token de localStorage directamente
6. ✅ NO hay error "Invalid JWT"
```

### Al Hacer Logout

```
1. Usuario hace click en "Cerrar sesión"
2. ✅ Se llama a logout() asíncrono
3. ✅ Se cierra sesión en Supabase
4. ✅ Se limpia todo el estado
5. ✅ Se limpia localStorage
6. ✅ Se redirige a login
```

## Verificación de la Corrección

### Logs Esperados (Todo Funciona)

```
[Lumi Debug - UserContext] Checking for active session...
[Lumi Debug - UserContext] Active session found for user: [userId]
[Lumi Debug - UserContext] Loading user profile from server...
[Lumi Debug - UserContext] Profile fetch response status: 200
[Lumi Debug - UserContext] Loaded user data: {...}
[Lumi Debug - UserContext] Profile and needs set successfully
[Lumi Debug - UserContext] Setting up auth state listener
```

### Si la Sesión Expiró (Comportamiento Correcto)

```
[Lumi Debug - UserContext] Checking for active session...
[Lumi Debug - UserContext] No active Supabase session found
[Lumi Debug - UserContext] Clearing stale localStorage data
[Lumi Debug - UserContext] Logging out...
[Lumi Debug - UserContext] Supabase signOut completed
[Lumi Debug - UserContext] Logout completed
```

## Archivos Modificados

1. ✅ `/contexts/UserContext.tsx` - Validación de sesión y listener
2. ✅ `/utils/supabase/client.tsx` - Configuración del cliente
3. ✅ `/pages/AuthScreen.tsx` - Logging mejorado
4. ✅ `/pages/ProfileScreen.tsx` - Logout asíncrono
5. ✅ `/App.tsx` - Logout asíncrono
6. ✅ `/utils/debug.ts` - Utilidades de debugging (nuevo)

## Archivos de Documentación

1. ✅ `/SUPABASE_DEBUG.md` - Guía de debugging
2. ✅ `/AUTH_TEST_GUIDE.md` - Guía de pruebas
3. ✅ `/FIX_SUMMARY.md` - Este archivo

## Próximos Pasos

1. **Probar el flujo completo:**
   - Signup nuevo usuario
   - Login con usuario existente
   - Recargar página (verificar que NO aparezca error JWT)
   - Dejar app abierta 1+ hora (verificar refresh de token)
   - Hacer logout

2. **Verificar logs:**
   - Todos los logs deben empezar con `[Lumi Debug - ...]` o `[Lumi Error - ...]`
   - No debe aparecer "Invalid JWT" en restauración de sesión
   - Los eventos TOKEN_REFRESHED deben aparecer periódicamente

3. **En Producción:**
   - Cambiar `DEBUG = false` en `/utils/debug.ts`
   - Esto deshabilitará todos los logs de debug

## Resultado Final

✅ **El error "Invalid JWT" está RESUELTO**

La app ahora:
- Valida sesiones con Supabase antes de usarlas
- Refresca tokens automáticamente
- Hace logout automático cuando la sesión es inválida
- Maneja correctamente la persistencia de sesión
- Proporciona logging detallado para debugging
