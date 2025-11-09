# Lumi - Características Implementadas

## 🔐 Autenticación y Persistencia

### Inicio de Sesión Persistente
- La sesión del usuario se guarda automáticamente en localStorage
- Al recargar la página, el usuario permanece autenticado
- El perfil se carga automáticamente desde el servidor
- No es necesario volver a iniciar sesión cada vez

### Flujo Inteligente de Onboarding
- **Usuarios nuevos**: Ven el flujo completo de onboarding (colores + configuración de perfil)
- **Usuarios existentes**: Van directamente al dashboard al iniciar sesión
- La app detecta automáticamente si un usuario ya completó su perfil

### Cerrar Sesión
- Botón de logout disponible en la pantalla de perfil
- Limpia toda la información local del usuario
- Limpia el token de autenticación
- Regresa a la pantalla de inicio de sesión

## 📊 Sistema de Analytics

### Registro Automático de Eventos
Todos los eventos de interacción se registran en la base de datos:

- **Hidratación**: Cada vez que se registra agua
  - Número de vasos
  - Total acumulado
  - Porcentaje del objetivo

- **Comidas**: Cada vez que se actualiza una comida
  - Tipo de comida (desayuno, almuerzo, cena)
  - Proteína y fibra
  - Si está balanceada

- **Perfil**: Cambios en la configuración

### Acceso a Estadísticas
```typescript
// Obtener eventos del usuario
await getUserEvents(userId, accessToken, "hydration_logged", 50);

// Obtener estadísticas de hidratación
await getHydrationStats(userId, accessToken, 7); // últimos 7 días
```

## 🔵 Reconexión Bluetooth

### Botón de Reconexión
- Disponible en la pantalla de perfil
- Permite volver a conectar el dispositivo BLE
- Útil cuando hay desconexiones inesperadas

## 💾 Persistencia de Estado

### Pantalla Actual
- La app recuerda en qué pantalla estaba el usuario
- Al recargar, vuelve a la misma ubicación
- Se mantiene el tab seleccionado (Home, Meals, Profile)

### Datos Sincronizados
- Perfil del usuario
- Necesidades nutricionales
- Vasos de agua del día
- Comidas registradas
- Rachas actuales y récord
- Historial de días balanceados

## 🗄️ Estructura de Datos en KV Store

### Usuarios
```
user:{userId} -> { name, age, gender, weight, height, activityLevel, ... }
```

### Datos Diarios
```
daily:{userId}:{date} -> { waterGlasses, meals[], totalProtein, totalFiber }
```

### Rachas
```
streak:{userId} -> { currentStreak, longestStreak, lastBalancedDate }
```

### Eventos de Analytics
```
user:{userId}:event:{timestamp} -> { userId, eventType, timestamp, data }
```

## 🚀 PWA (Progressive Web App)

- Instalable en dispositivos móviles
- Funciona offline (próximamente)
- Iconos y splash screens personalizados
- Optimizada para pantallas móviles
- Safe area insets para dispositivos con notch
- Pull-to-refresh deshabilitado para mejor UX

## 🎨 Características UX

- **Animaciones suaves**: Transiciones entre pantallas con Motion
- **Glassmorfismo**: Diseño moderno con efectos de vidrio
- **Gradientes pastel**: Paleta de colores cálida y reconfortante
- **Feedback visual**: Animaciones de respiración y pulsos
- **Loading states**: Indicadores de carga elegantes
- **Responsive**: Adaptado a diferentes tamaños de pantalla

## 📱 Compatibilidad

- iOS Safari
- Android Chrome
- Desktop browsers
- Instalable como PWA en iOS y Android
