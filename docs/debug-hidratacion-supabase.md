# Guía de depuración de hidratación (Supabase)

Pasos rápidos para diagnosticar y verificar el flujo de registro de vasos de agua entre la PWA y la Edge Function de Supabase.

## 1. Verificar CORS y headers permitidos
- Archivo: `src/supabase/functions/server/index.tsx`
- Revisar el middleware `cors(...)` y confirmar que `allowHeaders` incluya: `authorization, x-client-info, apikey, content-type, x-client-date, x-timezone-offset`.
- Confirmar que las respuestas (incluyendo la preflight `OPTIONS`) se sirven con esos headers. Si cambias la lista, vuelve a desplegar la función.

## 2. Probar la función manualmente
Ejemplos con `curl` (sustituye `PROJECT_ID`, `USER_ID`, `TOKEN`):
```bash
# Preflight manual (opcional para verificar headers)
curl -i -X OPTIONS \
  -H "Origin: https://lumi-hci-final.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization,x-client-date,x-timezone-offset" \
  https://PROJECT_ID.supabase.co/functions/v1/make-server-7e221a31/hydration/USER_ID

# Registro real de agua
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Client-Date: 2025-11-17" \
  -H "X-Timezone-Offset: 300" \
  -d '{"glasses":1}' \
  https://PROJECT_ID.supabase.co/functions/v1/make-server-7e221a31/hydration/USER_ID
```
Comprueba que la respuesta sea `200` y que el cuerpo incluya `success: true` y `waterGlasses` actualizado.

## 3. Confirmar inserts en Supabase
- En el panel de Supabase, abre la tabla `kv_store_7e221a31` (se usa como KV).
- Busca la clave `daily:{USER_ID}:{YYYY-MM-DD}` y verifica que `value.waterGlasses` se haya incrementado.
- Si no se ve, revisa los logs de la función Edge y los errores devueltos por la llamada `kv.set(...)`.

## 4. Revisar y ajustar RLS
- La función usa la clave de servicio (`SUPABASE_SERVICE_ROLE_KEY`) en el backend, por lo que la RLS normalmente no aplica. Si se cambiara a un rol restringido, asegúrate de que las políticas permitan insertar/seleccionar para el usuario autenticado.
- Si migras a tablas específicas (no KV), crea políticas de `INSERT` y `SELECT` donde `user_id = auth.uid()` o equivalente.

## 5. Validar desde el frontend
- Archivo: `src/contexts/UserContext.tsx` → función `addWater`: solo actualiza estado si `response.ok` y devuelve `true` en éxito, `false` en error.
- Archivo: `src/pages/DashboardScreen.tsx` → `handleAddWater`: registra eventos solo cuando `addWater` devuelve `success === true`; en fallos escribe un error en consola y no muestra éxito.
- Tras registrar agua:
  1) Observa que no aparezcan errores CORS en consola.
  2) El contador en el dashboard debe subir.
  3) Recarga la PWA: el contador debe mantenerse (dato persistente en KV).

## 6. Checklist rápida de fallos comunes
- **CORS**: falta `x-client-date` o `x-timezone-offset` en `allowHeaders`.
- **Token**: `Authorization` ausente/expirado → revisar login y renovar sesión.
- **KV**: error en `kv.set` → inspeccionar logs de la Edge Function.
- **Frontend**: se ve un “Event logged” pero sin persistencia → la petición principal falló; revisar `response.ok` y errores en consola.

## 7. Si vuelve a fallar
- Captura el error de consola y la respuesta HTTP.
- Ejecuta el `curl` anterior con los mismos headers/usuario.
- Verifica la entrada en `kv_store_7e221a31`.
- Revisa la configuración de CORS y vuelve a desplegar la función si hubo cambios.
