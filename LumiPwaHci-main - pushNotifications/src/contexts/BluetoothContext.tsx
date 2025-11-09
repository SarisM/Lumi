import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { requestNotificationPermission, showNotification } from "../utils/pwa";

// Comandos para el Arduino
export const LED_COMMANDS = {
  OFF: 0,           // Apagar
  WATER: 1,         // Azul - necesita agua
  BALANCED: 2,      // Verde - comida balanceada
  UNBALANCED: 3,    // Naranja - comida NO balanceada
  GREAT_FINISH: 4,  // Amarillo - gran final (>=80%)
  BAD_FINISH: 5,    // Naranja titilante - mal final (<80%)
} as const;

type LEDCommand = typeof LED_COMMANDS[keyof typeof LED_COMMANDS];

interface BluetoothContextType {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCommand: (command: LEDCommand) => Promise<void>;
  lastCommand: LEDCommand | null;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

// Service UUID para el Arduino Nano 33 BLE
// Este UUID debe coincidir con el definido en el sketch de Arduino
const ARDUINO_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
const ARDUINO_CHARACTERISTIC_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";

export function BluetoothProvider({ children }: { children: ReactNode }) {
  // Use `any` for these runtime-only Web Bluetooth objects to avoid TypeScript
  // errors in environments without DOM Web Bluetooth typings while keeping
  // runtime behavior unchanged.
  const [device, setDevice] = useState<any | null>(null);
  const [characteristic, setCharacteristic] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<LEDCommand | null>(null);

  // Verificar si Web Bluetooth API está disponible
  useEffect(() => {
    // Use a safe runtime check via `navigator` cast to any so TypeScript won't
    // complain about missing `bluetooth` on Navigator in some configs.
    if (!(navigator as any).bluetooth) {
      setError("Bluetooth no está disponible en este navegador. Usa Chrome, Edge o Opera.");
      console.error("Web Bluetooth API no disponible");
    }
  }, []);

  // Guardar conexión en localStorage
  useEffect(() => {
    if (isConnected && deviceName) {
      localStorage.setItem("lumi_bluetooth_device", deviceName);
    }
  }, [isConnected, deviceName]);

  // Manejar desconexión del dispositivo
  const handleDisconnect = () => {
    console.log("Dispositivo Bluetooth desconectado");
    setIsConnected(false);
    setCharacteristic(null);
    setDeviceName(null);
    setError("Dispositivo desconectado");
    // Notify the user that the device disconnected
    try {
      showNotification("Lumi desconectado", {
        body: "Se perdió la conexión con tu dispositivo Lumi.",
        tag: "bluetooth-connection",
      });
    } catch (e) {
      console.debug("Notification failed:", e);
    }
  };

  const connect = async () => {
    if (!(navigator as any).bluetooth) {
      setError("Bluetooth no está disponible en este navegador");
      return;
    }

    // Verificar si estamos en contexto seguro (HTTPS o localhost)
    if (!window.isSecureContext) {
      setError("Bluetooth requiere HTTPS. Por favor, accede a la app mediante HTTPS.");
      console.error("Bluetooth requiere contexto seguro (HTTPS)");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Try to request notification permission so we can notify the user about
      // connection/disconnection/errors and hydration alerts.
      try {
        await requestNotificationPermission();
      } catch (e) {
        console.debug("Notification permission request failed:", e);
      }

      console.log("Solicitando dispositivo Bluetooth...");

      // Solicitar dispositivo con el servicio específico. Cast navigator to
      // any to call `requestDevice` without TypeScript complaining in
      // environments missing Web Bluetooth types.
      const selectedDevice = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: "Arduino" },
          { namePrefix: "Nano" },
          { services: [ARDUINO_SERVICE_UUID] }
        ],
        optionalServices: [ARDUINO_SERVICE_UUID]
      });

      console.log("Dispositivo seleccionado:", selectedDevice.name);
      setDevice(selectedDevice);
      setDeviceName(selectedDevice.name || "Arduino Nano");

      // Escuchar evento de desconexión
  // selectedDevice is a runtime BluetoothDevice - attach event listener
  // directly. Keep as-is at runtime; types are `any` above.
  selectedDevice.addEventListener("gattserverdisconnected", handleDisconnect);

      // Conectar al servidor GATT
  console.log("Conectando al servidor GATT...");
  const server = await selectedDevice.gatt?.connect();
      
      if (!server) {
        throw new Error("No se pudo conectar al servidor GATT");
      }

      console.log("Servidor GATT conectado");

      // Obtener el servicio
  console.log("Obteniendo servicio primario...");
  const service = await server.getPrimaryService(ARDUINO_SERVICE_UUID);
  console.log("Servicio obtenido");

  // Obtener la característica
  console.log("Obteniendo característica...");
  const char = await service.getCharacteristic(ARDUINO_CHARACTERISTIC_UUID);
  console.log("Característica obtenida");

      setCharacteristic(char);
      setIsConnected(true);
      setError(null);

      // Notify user that device connected
      try {
        showNotification("Lumi conectado", {
          body: `Conectado a ${selectedDevice.name || "Arduino Nano"}`,
          tag: "bluetooth-connection",
        });
      } catch (e) {
        console.debug("Notification failed:", e);
      }

      // Enviar comando de apagado inicial
      await sendCommandInternal(char, LED_COMMANDS.OFF);
      
      console.log("Conexión Bluetooth exitosa");
    } catch (err) {
      console.error("Error de conexión Bluetooth:", err);
      
      // Manejar diferentes tipos de errores
      let errorMessage = "Error al conectar";
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'SecurityError':
            errorMessage = "Bluetooth bloqueado por política de seguridad. Verifica que estés usando HTTPS y que los permisos estén habilitados.";
            break;
          case 'NotFoundError':
            errorMessage = "No se encontró ningún dispositivo Arduino. Asegúrate de que esté encendido y cerca.";
            break;
          case 'NotAllowedError':
            errorMessage = "Permiso denegado. Por favor, permite el acceso a Bluetooth.";
            break;
          default:
            errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsConnected(false);
      setCharacteristic(null);
      // Notify about the error
      try {
        showNotification("Error Bluetooth", {
          body: errorMessage,
          tag: "bluetooth-error",
        });
      } catch (e) {
        console.debug("Notification failed:", e);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
      console.log("Desconexión iniciada");
    }
    
    setDevice(null);
    setCharacteristic(null);
    setIsConnected(false);
    setDeviceName(null);
    setLastCommand(null);
    localStorage.removeItem("lumi_bluetooth_device");
  };

  const sendCommandInternal = async (char: any, command: LEDCommand) => {
    try {
      // Enviar comando como un byte
      const data = new Uint8Array([command]);
      await char.writeValue(data);
      console.log(`Comando enviado al Arduino: ${command}`);
      setLastCommand(command);
      // If the device indicates a water alert, show a hydration notification
      if (command === LED_COMMANDS.WATER) {
        try {
          showNotification("Hora de hidratarte", {
            body: "Tu Lumi indica que necesitas agua. Toca para ver el recordatorio.",
            tag: "hydration-alert",
            data: { url: "/hydration" },
          });
        } catch (e) {
          console.debug("Notification failed:", e);
        }
      }
      return true;
    } catch (err) {
      console.error("Error al enviar comando:", err);
      throw err;
    }
  };

  const sendCommand = async (command: LEDCommand) => {
    if (!isConnected || !characteristic) {
      console.warn("No hay conexión Bluetooth activa");
      setError("No hay conexión Bluetooth activa");
      return;
    }

    try {
      await sendCommandInternal(characteristic, command);
      setError(null);
    } catch (err) {
      console.error("Error al enviar comando:", err);
      setError("Error al enviar comando al dispositivo");
      
      // Si hay error, intentar reconectar
      if (device?.gatt?.connected === false) {
        setIsConnected(false);
        setCharacteristic(null);
      }
    }
  };

  return (
    <BluetoothContext.Provider
      value={{
        isConnected,
        isConnecting,
        deviceName,
        error,
        connect,
        disconnect,
        sendCommand,
        lastCommand,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
}

export function useBluetooth() {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error("useBluetooth must be used within a BluetoothProvider");
  }
  return context;
}
