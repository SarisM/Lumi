# Configuración del Arduino Nano 33 BLE para Lumi

## Hardware Requerido

- Arduino Nano 33 BLE o Nano 33 BLE Sense
- LED RGB (cátodo común o ánodo común)
- 3 resistencias de 220Ω (una para cada color del LED)
- Cables de conexión
- Batería o fuente de alimentación portátil

## Conexiones del LED RGB

Conecta el LED RGB al Arduino de la siguiente manera:

### LED RGB Cátodo Común:
- Pin R (Rojo) → Pin D2 del Arduino (con resistencia 220Ω)
- Pin G (Verde) → Pin D3 del Arduino (con resistencia 220Ω)
- Pin B (Azul) → Pin D4 del Arduino (con resistencia 220Ω)
- Pin GND → GND del Arduino

### LED RGB Ánodo Común:
- Pin R (Rojo) → Pin D2 del Arduino (con resistencia 220Ω)
- Pin G (Verde) → Pin D3 del Arduino (con resistencia 220Ω)
- Pin B (Azul) → Pin D4 del Arduino (con resistencia 220Ω)
- Pin VCC → 3.3V del Arduino

## Código Arduino

```cpp
#include <ArduinoBLE.h>

// Definir pines del LED RGB
#define RED_PIN 2
#define GREEN_PIN 3
#define BLUE_PIN 4

// Definir si el LED es de cátodo común (true) o ánodo común (false)
#define COMMON_CATHODE true

// UUIDs del servicio BLE (deben coincidir con la app)
#define SERVICE_UUID "19b10000-e8f2-537e-4f6c-d104768a1214"
#define CHAR_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"

// Crear servicio y característica BLE
BLEService lumiService(SERVICE_UUID);
BLEByteCharacteristic commandChar(CHAR_UUID, BLEWrite);

// Estado actual del LED
int currentCommand = 0;
unsigned long lastBlinkTime = 0;
bool blinkState = false;

void setup() {
  Serial.begin(9600);
  while (!Serial);

  // Configurar pines del LED como salida
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  // Apagar LED al inicio
  setColor(0, 0, 0);

  // Inicializar BLE
  if (!BLE.begin()) {
    Serial.println("Error al iniciar BLE");
    while (1);
  }

  // Configurar BLE
  BLE.setLocalName("Lumi Keychain");
  BLE.setAdvertisedService(lumiService);
  lumiService.addCharacteristic(commandChar);
  BLE.addService(lumiService);

  // Iniciar advertising
  BLE.advertise();
  Serial.println("Esperando conexión BLE...");

  // LED blanco breve para indicar que está listo
  setColor(255, 255, 255);
  delay(500);
  setColor(0, 0, 0);
}

void loop() {
  // Esperar conexión BLE
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Conectado a: ");
    Serial.println(central.address());

    // LED verde breve para confirmar conexión
    setColor(0, 255, 0);
    delay(300);
    setColor(0, 0, 0);

    while (central.connected()) {
      // Verificar si hay un nuevo comando
      if (commandChar.written()) {
        currentCommand = commandChar.value();
        Serial.print("Comando recibido: ");
        Serial.println(currentCommand);
        
        // Reiniciar estado de parpadeo
        lastBlinkTime = millis();
        blinkState = false;
      }

      // Ejecutar comando actual
      executeCommand(currentCommand);
    }

    Serial.println("Desconectado");
    setColor(0, 0, 0);
  }
}

void executeCommand(int command) {
  switch (command) {
    case 0: // Apagar
      setColor(0, 0, 0);
      break;
      
    case 1: // Azul - necesita agua
      setColor(0, 0, 255);
      break;
      
    case 2: // Verde - comida balanceada
      setColor(0, 255, 0);
      break;
      
    case 3: // Naranja - comida no balanceada
      setColor(255, 128, 0);
      break;
      
    case 4: // Amarillo - gran final (todo perfecto)
      setColor(255, 255, 0);
      break;
      
    case 5: // Naranja titilante - mal final
      if (millis() - lastBlinkTime >= 500) {
        blinkState = !blinkState;
        if (blinkState) {
          setColor(255, 128, 0);
        } else {
          setColor(0, 0, 0);
        }
        lastBlinkTime = millis();
      }
      break;
      
    default:
      setColor(0, 0, 0);
      break;
  }
}

void setColor(int red, int green, int blue) {
  if (COMMON_CATHODE) {
    // Para LED de cátodo común
    analogWrite(RED_PIN, red);
    analogWrite(GREEN_PIN, green);
    analogWrite(BLUE_PIN, blue);
  } else {
    // Para LED de ánodo común (invertir valores)
    analogWrite(RED_PIN, 255 - red);
    analogWrite(GREEN_PIN, 255 - green);
    analogWrite(BLUE_PIN, 255 - blue);
  }
}
```

## Instrucciones de Carga

1. Instala el IDE de Arduino desde [arduino.cc](https://www.arduino.cc/en/software)

2. Instala la librería ArduinoBLE:
   - Abre el IDE de Arduino
   - Ve a Herramientas → Administrador de bibliotecas
   - Busca "ArduinoBLE" y haz clic en Instalar

3. Selecciona la placa:
   - Ve a Herramientas → Placa → Arduino Mbed OS Nano Boards → Arduino Nano 33 BLE

4. Selecciona el puerto:
   - Conecta el Arduino a tu computadora
   - Ve a Herramientas → Puerto → Selecciona el puerto COM/USB correspondiente

5. Carga el código:
   - Copia el código Arduino completo de arriba
   - Pega en el IDE de Arduino
   - Haz clic en el botón "Subir" (→)

6. Verifica el funcionamiento:
   - Abre el Monitor Serial (Herramientas → Monitor Serial)
   - Establece la velocidad a 9600 baudios
   - Deberías ver "Esperando conexión BLE..."

## Protocolo de Comandos

| Comando | Color | Significado |
|---------|-------|-------------|
| 0 | Apagado | Sin notificaciones |
| 1 | Azul | Necesita hidratarse |
| 2 | Verde | Comida balanceada registrada |
| 3 | Naranja | Alerta de nutrición |
| 4 | Amarillo | ¡Día perfecto! |
| 5 | Naranja titilante | Mejorar hábitos mañana |

## Lógica de Alarmas

### Agua:
- **Primera alarma**: 1.5 horas después del último registro de agua
- **Alarmas subsecuentes**: Cada 30 minutos si no se registra consumo
- **Cesa cuando**: Se cumple la meta diaria de hidratación

### Comida:
- **Primera alarma**: 9:00 AM si no hay registro de desayuno
- **Alarmas subsecuentes**: 5 horas después de la última comida
- **Feedback inmediato**: Verde si la comida es balanceada, naranja si no lo es

### Final del día:
- Se activa a la hora configurada por el usuario
- **Amarillo**: Si el progreso total es ≥80%
- **Naranja titilante**: Si el progreso total es <80%

## Solución de Problemas

### El LED no se enciende:
- Verifica las conexiones del LED
- Asegúrate de que el tipo de LED (cátodo/ánodo común) está correctamente configurado
- Prueba con valores reducidos de brillo si el LED es muy brillante

### No se puede conectar vía Bluetooth:
- Asegúrate de que el código está cargado correctamente
- Verifica que el Arduino está alimentado
- Revisa que estás usando un navegador compatible (Chrome, Edge, Opera)
- En el Monitor Serial, verifica que aparece "Esperando conexión BLE..."

### El Arduino no aparece en la lista de dispositivos:
- Presiona el botón de reset del Arduino
- Asegúrate de que ningún otro dispositivo está conectado al Arduino
- Intenta desconectar y reconectar el cable USB

### Los colores no son correctos:
- Ajusta la variable `COMMON_CATHODE` según tu tipo de LED
- Verifica que los cables estén conectados a los pines correctos
- Ajusta los valores RGB en la función `setColor()` si es necesario

## Personalización

### Ajustar brillo del LED:
Modifica los valores en `setColor()` dividiendo los valores RGB:
```cpp
void setColor(int red, int green, int blue) {
  // Reducir brillo al 50%
  red = red / 2;
  green = green / 2;
  blue = blue / 2;
  
  // ... resto del código
}
```

### Cambiar velocidad de parpadeo:
En el caso 5, cambia el valor `500` (milisegundos) a otro valor:
```cpp
if (millis() - lastBlinkTime >= 300) { // Parpadeo más rápido
```

### Agregar efectos de transición:
Puedes implementar fade entre colores usando PWM gradual:
```cpp
void fadeToColor(int targetR, int targetG, int targetB) {
  // Implementar transición suave
}
```

## Consideraciones de Batería

Para uso portátil:
- Usa una batería LiPo de 3.7V con protección
- Agrega un interruptor de encendido/apagado
- Considera reducir el brillo del LED para ahorrar batería
- El Arduino Nano 33 BLE consume ~7mA en idle, más el consumo del LED

## Carcasa (Opcional)

Para convertir el proyecto en un llavero:
- Diseña/imprime una carcasa 3D
- Agrega un aro para llavero
- Usa difusor para el LED (papel de lija o acrílico translúcido)
- Sella la carcasa para protegerla de agua/polvo
