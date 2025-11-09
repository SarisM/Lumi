# 🌟 Lumi - App de Bienestar con Llavero Inteligente BLE

Una aplicación móvil de bienestar que se conecta vía Bluetooth Low Energy (BLE) a un dispositivo Arduino Nano 33 BLE en forma de llavero inteligente. El llavero cambia de color según el estado emocional y nutricional del usuario, ayudando a construir hábitos saludables de forma visual e intuitiva.

## ✨ Características Principales

### 🎨 Llavero Inteligente con Indicadores de Color

El llavero Lumi cambia de color en tiempo real según tu progreso diario:

- 🔵 **Azul** - Necesitas hidratación
- 🟢 **Verde** - Nutrición balanceada (buena proteína y fibra)
- 🟠 **Naranja** - Alerta nutricional (falta proteína o fibra)
- 💛 **Amarillo pastel** - ¡Perfección total! Todos los objetivos cumplidos

### 🎯 Tres Pilares de Bienestar

1. **💧 Hidratación**
   - Tracking de vasos de agua (250ml cada uno)
   - Cálculo automático basado en peso corporal (33ml/kg)
   - Botón rápido para registrar consumo

2. **🍽️ Nutrición Luminosa**
   - Seguimiento de proteína y fibra en cada comida
   - Tres comidas: Desayuno, Almuerzo y Cena
   - Sliders intuitivos para registrar nutrientes
   - Metas calculadas automáticamente según perfil

3. **⚡ Balance Energético** (próximamente)
   - Momentos de descanso y respiración
   - Tracking de energía diaria

### 📊 Sistema de Rachas

- **Racha actual**: Días consecutivos cumpliendo metas
- **Mejor racha**: Récord personal
- **Visualización de 7 días**: Progreso de la última semana
- **Mensajes motivacionales** según tu racha

### 🎨 Diseño

- **Glassmorfismo** con efectos de vidrio esmerilado
- **Gradientes suaves** en tonos pastel
- **Animaciones de respiración** que acompañan al usuario
- **Interfaz orgánica** que simula respirar lentamente
- **Responsive** optimizado para móvil

## 🛠️ Tecnologías

### Frontend

- **React** con TypeScript
- **Motion** (Framer Motion) para animaciones fluidas
- **Tailwind CSS v4** para estilos
- **shadcn/ui** componentes de UI
- **Lucide React** para iconos
- **Web Bluetooth API** para conexión BLE

### Backend

- **Supabase**
  - Edge Functions (Hono server)
  - Key-Value Store para persistencia de datos
  - Auth (preparado para autenticación)
- **Deno** runtime para edge functions

## 📁 Estructura del Proyecto

```
lumi/
├── components/
│   ├── DashboardScreen.tsx       # Pantalla principal con anillo Lumi
│   ├── NutritionScreen.tsx       # Registro de comidas
│   ├── ProfileScreen.tsx         # Perfil y estadísticas
│   ├── BluetoothScreen.tsx       # Conexión BLE
│   ├── InsightsScreen.tsx        # Análisis y tendencias
│   ├── ProfileSetupScreen.tsx    # Configuración inicial
│   ├── Onboarding*.tsx           # Flujo de bienvenida (5 pantallas)
│   └── ui/                       # Componentes shadcn/ui
├── contexts/
│   └── UserContext.tsx           # Estado global del usuario
├── supabase/functions/server/
│   ├── index.tsx                 # API endpoints
│   └── kv_store.tsx              # Utilidades KV (protegido)
├── utils/supabase/
│   └── info.tsx                  # Configuración Supabase
└── App.tsx                       # Componente principal
```

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase (opcional, para backend)

### Pasos

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/lumi.git
cd lumi
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

Edita el archivo `.env` y completa con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-key-aqui
```

> 🔐 **IMPORTANTE**: Nunca subas el archivo `.env` a Git. Ya está incluido en `.gitignore`.

**Para obtener tus credenciales:**
1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia la **Project URL** y la **anon/public key**

4. **Ejecutar en desarrollo**

```bash
npm run dev
```

### 🚀 Para Despliegue en Producción

Consulta la [**Guía de Despliegue Completa (DEPLOYMENT.md)**](./DEPLOYMENT.md) para:
- ✅ Configuración segura de variables de entorno
- ✅ Despliegue en Vercel, Netlify, u otras plataformas
- ✅ Configuración de Supabase Edge Functions
- ✅ Convertir a PWA instalable
- ✅ Troubleshooting y mejores prácticas

## 🔌 API Endpoints

### Usuarios

- `POST /make-server-17dd3838/users` - Crear/actualizar perfil
- `GET /make-server-17dd3838/users/:userId` - Obtener perfil

### Hidratación

- `POST /make-server-17dd3838/hydration/:userId` - Registrar agua
- `GET /make-server-17dd3838/hydration/:userId/:date` - Datos de un día
- `GET /make-server-17dd3838/hydration/:userId?days=N` - Historial

### Nutrición

- `POST /make-server-17dd3838/nutrition/:userId` - Registrar comida

### Resumen

- `GET /make-server-17dd3838/summary/:userId` - Resumen del día

## 📊 Estructura de Datos

### Perfil de Usuario

```typescript
{
  userId: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  weight: number; // kg
  height: number; // cm
  activityLevel: "sedentary" | "light" | "moderate" | "very";
}
```

### Datos Diarios

```typescript
{
  date: string; // YYYY-MM-DD
  waterGlasses: number;
  meals: Array<{
    type: "breakfast" | "lunch" | "dinner";
    protein: number; // gramos
    fiber: number; // gramos
    timestamp: string;
  }>;
  totalProtein: number;
  totalFiber: number;
}
```

## 🧮 Cálculos Nutricionales

### Proteína Diaria

```
Base: peso (kg) × multiplicador de actividad
- Sedentario: × 1.0
- Ligeramente activo: × 1.2
- Moderadamente activo: × 1.4
- Muy activo: × 1.6
```

### Fibra Diaria

```
Hombres:
- < 50 años: 38g
- ≥ 50 años: 30g

Mujeres:
- < 50 años: 25g
- ≥ 50 años: 21g
```

### Agua Diaria

```
peso (kg) × 33ml ÷ 250ml = número de vasos
```

## 🔵 Arduino Nano 33 BLE - Llavero

### Hardware Requerido

- Arduino Nano 33 BLE Sense
- LED RGB (WS2812B o similar)
- Batería LiPo pequeña (opcional)
- Carcasa para llavero 3D impresa

### Código Arduino (ejemplo básico)

```cpp
#include <ArduinoBLE.h>
#include <Adafruit_NeoPixel.h>

#define LED_PIN 6
#define NUM_LEDS 1

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

BLEService lumiService("19B10000-E8F2-537E-4F6C-D104768A1214");
BLEIntCharacteristic colorCharacteristic("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite);

void setup() {
  Serial.begin(9600);
  strip.begin();

  if (!BLE.begin()) {
    Serial.println("BLE failed!");
    while (1);
  }

  BLE.setLocalName("Lumi");
  BLE.setAdvertisedService(lumiService);
  lumiService.addCharacteristic(colorCharacteristic);
  BLE.addService(lumiService);
  BLE.advertise();
}

void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    while (central.connected()) {
      if (colorCharacteristic.written()) {
        int color = colorCharacteristic.value();
        setColor(color);
      }
    }
  }
}

void setColor(int color) {
  // 0: Azul, 1: Verde, 2: Naranja, 3: Amarillo
  switch(color) {
    case 0: strip.setPixelColor(0, strip.Color(96, 165, 250)); break;
    case 1: strip.setPixelColor(0, strip.Color(52, 211, 153)); break;
    case 2: strip.setPixelColor(0, strip.Color(251, 146, 60)); break;
    case 3: strip.setPixelColor(0, strip.Color(253, 230, 138)); break;
  }
  strip.show();
}
```

## 🎯 Próximas Características

- [ ] Sincronización completa con Arduino BLE
- [ ] Notificaciones push para recordatorios
- [ ] Modo de respiración guiada
- [ ] Gráficas de tendencias semanales/mensuales
- [ ] Exportación de datos
- [ ] Integración con Apple Health / Google Fit
- [ ] Modos de tema (claro/oscuro)
- [ ] Soporte para múltiples dispositivos Lumi

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más información.

## 👥 Autores

- **Equipo Lumi** - _Desarrollo inicial_

## 🙏 Agradecimientos

- shadcn/ui por los componentes base
- Supabase por el backend as a service
- La comunidad de Arduino por el soporte BLE
- Motion (Framer Motion) por las animaciones fluidas

---

**Hecho con 💚 y mucha ☕ por el equipo Lumi**

_Ilumina tu bienestar, un día a la vez_ ✨