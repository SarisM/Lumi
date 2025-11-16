import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { requestNotificationPermission, showNotification } from "../utils/pwa";

// Arduino BLE Commands
export const LED_COMMANDS = {
  OFF: 0,
  WATER: 1,
  BALANCED: 2,
  UNBALANCED: 3,
  GREAT_FINISH: 4,
  BAD_FINISH: 5,
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
  // Test helper: temporarily turn on the blue LED (WATER) for a duration, then turn off
  sendBlueTestPulse: (durationMs?: number) => Promise<void>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

// Optional known service/characteristic UUID for the ESP32 Lumi firmware.
// These are the correct UUIDs published by the ESP32 device; keeping them
// as optional still allows the user to pick other BLE peripherals.
const OPTIONAL_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const OPTIONAL_CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const COMMON_SERVICE_UUIDS = [
  OPTIONAL_SERVICE_UUID,
  // Common vendor/custom service UUIDs used by many ESP32/HM-10 sketches
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  // Nordic UART Service (commonly used for serial over BLE on ESP32)
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  // Generic Access / Generic Attribute (may be present)
  "00001800-0000-1000-8000-00805f9b34fb",
  "00001801-0000-1000-8000-00805f9b34fb",
];
// Toggle verbose BLE diagnostics (set to true to print services/characteristics)
const BLE_DIAGNOSTIC = false;

export function BluetoothProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<any | null>(null);
  const [characteristic, setCharacteristic] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<LEDCommand | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (!(navigator as any).bluetooth) {
      setError("Bluetooth no está disponible en este navegador. Usa Chrome, Edge o Opera.");
      console.error("Web Bluetooth API no disponible");
    }
  }, []);

  useEffect(() => {
    if (isConnected && deviceName) {
      localStorage.setItem("lumi_bluetooth_device", deviceName);
    }
  }, [isConnected, deviceName]);

  const handleDisconnect = () => {
    console.log("Dispositivo Bluetooth desconectado");
    setIsConnected(false);
    setCharacteristic(null);
    setDeviceName(null);
    setError("Dispositivo desconectado");
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

    if (!window.isSecureContext) {
      setError("Bluetooth requiere HTTPS. Por favor, accede a la app mediante HTTPS.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await requestNotificationPermission().catch(console.debug);

      console.log("Buscando dispositivos BLE (aceptando todos los dispositivos)...");

      // Request any nearby BLE device. We include an optional known service UUID so
      // devices exposing it will still be accessible, but the user may pick any
      // BLE device since `acceptAllDevices: true` is used.
      // Request any nearby BLE device. We avoid forcing a single optional
      // service (which can cause some devices to appear to have "no services").
      // Instead, include a short list of common service UUIDs so browsers
      // can grant access to typical ESP32/HM-10 style peripherals.
      const selectedDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: COMMON_SERVICE_UUIDS,
      });

      console.log("Dispositivo seleccionado:", selectedDevice?.name || selectedDevice?.id);
      if (!selectedDevice) throw new Error("No se seleccionó ningún dispositivo");

  setDevice(selectedDevice as any);
  setDeviceName(selectedDevice.name || selectedDevice.id || "Dispositivo BLE");

      selectedDevice.addEventListener("gattserverdisconnected", async () => {
        console.log("Dispositivo GATT desconectado, manejador de evento activado");
        setIsConnected(false);
        setCharacteristic(null);
        // Try to auto-reconnect a few times
        if (reconnectAttempts < 3) {
          const attempt = reconnectAttempts + 1;
          setReconnectAttempts(attempt);
          const backoff = 1000 * attempt;
          console.log(`Intentando reconectar en ${backoff}ms (intento ${attempt})`);
          setTimeout(async () => {
            try {
              await connect();
            } catch (err) {
              console.debug("Reconnect failed:", err);
            }
          }, backoff);
        } else {
          handleDisconnect();
        }
      });

      console.log("Conectando al servidor GATT...");
      const server = await selectedDevice.gatt?.connect();
      if (!server) throw new Error("No se pudo conectar al servidor GATT");

      // Try to find the Arduino-specific service/characteristic first. If it's not present,
      // iterate the available services and characteristics to find a writable characteristic.
  let char: any | null = null;
      try {
        const service = await server.getPrimaryService(OPTIONAL_SERVICE_UUID);
        char = await service.getCharacteristic(OPTIONAL_CHARACTERISTIC_UUID);
      } catch (e) {
        console.debug("Servicio/característica opcional no encontrada, buscando característica escribible...", e);
        // First, try asking for each common UUID individually. Some browsers
        // will grant access only to services explicitly requested—trying
        // them one-by-one can succeed where a bulk getPrimaryServices fails.
        for (const uuid of COMMON_SERVICE_UUIDS) {
          try {
            console.debug("Intentando obtener servicio por UUID:", uuid);
            const svc = await server.getPrimaryService(uuid);
            try {
              const chars = await svc.getCharacteristics();
              for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  char = c;
                  break;
                }
              }
              if (char) break;
            } catch (charsErr) {
              console.debug("No se pudieron leer características del servicio", uuid, charsErr);
            }
          } catch (svcErr) {
            console.debug("Servicio no disponible para UUID", uuid, svcErr);
          }
        }

        // If still no characteristic, try to enumerate all services (fallback).
        if (!char) {
          let services: any[] = [];
          try {
            services = await server.getPrimaryServices();
          } catch (svcErr) {
            console.debug("No se pudieron obtener los servicios GATT del dispositivo (getPrimaryServices)", svcErr);
            const tried = COMMON_SERVICE_UUIDS.join(", ");
            throw new Error(
              `El dispositivo no expone servicios GATT o el navegador no otorgó acceso a ellos. Intentados UUIDs: ${tried}. ` +
                `Comprueba: 1) que el periférico BLE esté encendido y actúe como servidor GATT (publicando servicios/characteristics), ` +
                `2) que la web se sirva vía HTTPS y uses Chrome/Edge en un perfil sin políticas que bloqueen Web Bluetooth, ` +
                `y 3) si usas un sketch de ESP32, que esté publicando un servicio UART (por ejemplo UUID 6e400001-...) o un servicio personalizado. Usa una app de escaneo BLE (nRF Connect) para verificar los servicios del periférico.`
            );
          }

          if (!services || services.length === 0) {
            console.debug("El dispositivo no tiene servicios GATT disponibles");
            const tried = COMMON_SERVICE_UUIDS.join(", ");
            throw new Error(
              `El dispositivo no expone servicios GATT. Intentados UUIDs: ${tried}. ` +
                `Verifica el firmware del periférico y que esté publicando servicios; prueba con una app de escaneo BLE para confirmar.`
            );
          }

          for (const svc of services) {
            try {
              const chars = await svc.getCharacteristics();
              for (const c of chars) {
                // Skip standard read-only characteristics
                const uuid = c.uuid.toLowerCase();
                if (uuid === '00002902-0000-1000-8000-00805f9b34fb' || // Client Characteristic Configuration
                    uuid === '00002a00-0000-1000-8000-00805f9b34fb' || // Device Name
                    uuid === '00002a01-0000-1000-8000-00805f9b34fb') { // Appearance
                  continue;
                }
                // Explicitly avoid using a known-bad/wrong characteristic UUID
                // some devices or older examples use '00002b29-...' by mistake
                // which is not the writable characteristic for our ESP32 firmware.
                if (uuid === '00002b29-0000-1000-8000-00805f9b34fb') {
                  console.warn("Skipping known-wrong characteristic UUID", uuid);
                  continue;
                }
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  console.debug("Found writable characteristic:", c.uuid, c.properties);
                  char = c;
                  break;
                }
              }
              if (char) break;
            } catch (innerErr) {
              console.debug("Error iterating characteristics for service", svc.uuid, innerErr);
            }
          }
        }
      }

      if (!char) throw new Error("No se encontró una característica escribible en el dispositivo BLE");

      // Enable notifications if the characteristic supports it
      if (char.properties.notify) {
        await char.startNotifications();
        char.addEventListener('characteristicvaluechanged', (event: Event) => {
          const val = (event.target as any).value;
          if (val) {
            console.log('Received value from BLE device:', new Uint8Array(val.buffer));
          }
        });
      }

      setCharacteristic(char);
      setIsConnected(true);
      setError(null);

      try {
        showNotification("Lumi conectado", {
          body: `Conectado a ${selectedDevice.name || "dispositivo BLE"}`,
          tag: "bluetooth-connection",
        });
      } catch (e) {
        console.debug("Notification failed:", e);
      }

      // Send initial OFF command
      await sendCommandInternal(char, LED_COMMANDS.OFF);
      
    } catch (err) {
      console.error("Error de conexión Bluetooth:", err);
      
  let errorMessage = "Error al conectar";
      
      if (err instanceof DOMException) {
        // Some browsers or managed environments disable Web Bluetooth globally and
        // surface that as a NotFoundError with a message containing 'globally disabled'.
        const msg = err.message || "";
        if (msg.toLowerCase().includes("globally disabled")) {
          errorMessage = "Web Bluetooth está deshabilitado globalmente en este navegador. Revisa la configuración del navegador o las políticas de tu organización. Prueba en Chrome/Edge con Web Bluetooth habilitado o en un equipo sin restricciones.";
        } else {
          switch (err.name) {
            case 'SecurityError':
              errorMessage = "Bluetooth bloqueado por política de seguridad. Verifica que estés usando HTTPS y que los permisos estén habilitados.";
              break;
            case 'NotFoundError':
              errorMessage = "No se encontró ningún dispositivo BLE. Asegúrate de que esté encendido y cerca.";
              break;
            case 'NotAllowedError':
              errorMessage = "Permiso denegado. Por favor, permite el acceso a Bluetooth.";
              break;
            default:
              errorMessage = err.message;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsConnected(false);
      setCharacteristic(null);
      
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
      try {
        device.gatt.disconnect();
        console.log("Desconexión iniciada");
      } catch (e) {
        console.debug("Error disconnecting device:", e);
      }
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
      // Guard: avoid attempting writes to a known-bad characteristic UUID.
      try {
        const cu = (char?.uuid || "").toLowerCase();
        if (cu === '00002b29-0000-1000-8000-00805f9b34fb') {
          throw new Error(
            `Intento de escribir en la característica equivocada (${cu}). La característica correcta es ${OPTIONAL_CHARACTERISTIC_UUID}. ` +
              `Vuelve a conectar al dispositivo o selecciona el periférico correcto.`
          );
        }
      } catch (guardErr) {
        console.error("BLE guard check failed:", guardErr);
        throw guardErr;
      }
      // Diagnostic: print characteristic details before attempting write
      try {
        console.debug("BLE write: characteristic UUID:", char.uuid, "properties:", char.properties);
        if (BLE_DIAGNOSTIC && char.service) {
          console.debug("BLE write: parent service UUID:", char.service.uuid);
        }
      } catch (diagErr) {
        console.debug("Failed to read characteristic metadata", diagErr);
      }
      // Send command as a single byte using BLE write
      const data = new Uint8Array([command]);
      // Choose write method according to characteristic properties.
      const supportsWrite = !!char.properties?.write;
      const supportsWriteWithoutResponse = !!char.properties?.writeWithoutResponse;

      if (!supportsWrite && !supportsWriteWithoutResponse) {
        throw new Error(`La característica ${char.uuid} no soporta escritura (write/writeWithoutResponse). Propiedades: ${JSON.stringify(char.properties)}`);
      }

      // Attempt multiple write strategies to handle different peripheral/browser implementations.
      // Some devices advertise `writeWithoutResponse` only and/or the implementation exposes
      // `writeValueWithoutResponse` while others require an ArrayBuffer/DataView.
      const attempts: Array<() => Promise<void>> = [];

      // Prefer writeWithoutResponse when the characteristic advertises it — many ESP32
      // UART-like implementations expect writes without response.
      if (supportsWriteWithoutResponse && (char as any).writeValueWithoutResponse) {
        attempts.push(async () => {
          if (BLE_DIAGNOSTIC) console.debug("Trying writeValueWithoutResponse with Uint8Array");
          await (char as any).writeValueWithoutResponse(data);
        });
      }

      // If supportsWrite is advertised, try writeValue with Uint8Array (works in modern browsers).
      if (supportsWrite) {
        attempts.push(async () => {
          if (BLE_DIAGNOSTIC) console.debug("Trying writeValue with Uint8Array");
          await (char as BluetoothRemoteGATTCharacteristic).writeValue(data);
        });
      }

      // Try writeValueWithoutResponse even if the property check failed earlier (some stacks differ).
      if ((char as any).writeValueWithoutResponse && !attempts.length) {
        attempts.push(async () => {
          if (BLE_DIAGNOSTIC) console.debug("Trying writeValueWithoutResponse (fallback)");
          await (char as any).writeValueWithoutResponse(data);
        });
      }

      // Try alternate buffer shapes: ArrayBuffer and DataView — some devices are picky.
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      attempts.push(async () => {
        if (BLE_DIAGNOSTIC) console.debug("Trying writeValue with ArrayBuffer");
        await (char as BluetoothRemoteGATTCharacteristic).writeValue(buffer as ArrayBuffer);
      });
      attempts.push(async () => {
        if (BLE_DIAGNOSTIC) console.debug("Trying writeValue with DataView");
        await (char as BluetoothRemoteGATTCharacteristic).writeValue(new DataView(buffer as ArrayBuffer));
      });

      // Execute attempts sequentially until one succeeds or all fail.
      let lastErr: any = null;
      for (const attempt of attempts) {
        try {
          await attempt();
          lastErr = null;
          break;
        } catch (writeErr: any) {
          lastErr = writeErr;
          console.debug("BLE write attempt failed (will try next):", writeErr);
          // If the error is NotSupportedError, continue trying other strategies; otherwise continue as well
          // since some devices produce generic errors but a different buffer shape can still work.
        }
      }

      if (lastErr) {
        console.error("BLE write_failed for characteristic", char.uuid, "error:", lastErr);
        // If the write failed, attempt a fallback: try other writable characteristics
        // within the same parent service (sometimes devices expose multiple writable
        // characteristics and the first one chosen earlier may reject writes).
        try {
          if (char && (char.service as any) && (char.service as any).getCharacteristics) {
            const siblings = await (char.service as any).getCharacteristics();
            for (const s of siblings) {
              if (s.uuid === char.uuid) continue;
              if (!s.properties) continue;
              if (!(s.properties.write || s.properties.writeWithoutResponse)) continue;
              try {
                console.debug("Trying sibling characteristic for write:", s.uuid, s.properties);
                // Try the same sequence of write attempts for the sibling
                const altData = new Uint8Array([command]);
                if (s.properties.writeWithoutResponse && (s as any).writeValueWithoutResponse) {
                  await (s as any).writeValueWithoutResponse(altData);
                } else if (s.properties.write) {
                  await (s as BluetoothRemoteGATTCharacteristic).writeValue(altData);
                } else if ((s as any).writeValueWithoutResponse) {
                  await (s as any).writeValueWithoutResponse(altData);
                } else {
                  // Try buffer/DataView fallback
                  const buf = altData.buffer.slice(altData.byteOffset, altData.byteOffset + altData.byteLength);
                  try {
                    await (s as BluetoothRemoteGATTCharacteristic).writeValue(buf as ArrayBuffer);
                  } catch (e) {
                    await (s as BluetoothRemoteGATTCharacteristic).writeValue(new DataView(buf as ArrayBuffer));
                  }
                }

                // If we reach here, sibling accepted the write — update stored characteristic
                console.log("BLE write succeeded using sibling characteristic", s.uuid);
                setCharacteristic(s);
                setLastCommand(command);
                return true;
              } catch (sErr) {
                console.debug("Sibling write failed, trying next:", s.uuid, sErr);
                continue;
              }
            }
          }
        } catch (fallbackErr) {
          console.debug("Fallback sibling enumeration failed:", fallbackErr);
        }

        if (lastErr && lastErr.name === 'NotSupportedError') {
          throw new Error(`NotSupportedError al escribir en la característica ${char.uuid}. Revisa que la característica soporte escritura y que el periférico acepte el formato enviado (bytes). Mensaje original: ${lastErr.message}`);
        }
        // Re-throw the last error to preserve original diagnostics
        throw lastErr;
      }
      console.log(`Comando BLE enviado: ${command}`);
      setLastCommand(command);
      // Show a user notification for any command sent. Provide contextual text per command.
      try {
        const titles: Record<number, { title: string; body: string; tag?: string; url?: string }> = {
          [LED_COMMANDS.OFF]: { title: 'Lumi apagado', body: 'Tu Lumi fue apagado.' },
          [LED_COMMANDS.WATER]: { title: 'Hora de hidratarte', body: 'Tu Lumi indica que necesitas agua. Toca para ver el recordatorio.', tag: 'hydration-alert', url: '/hydration' },
          [LED_COMMANDS.BALANCED]: { title: 'Nutrición balanceada', body: 'Tu Lumi muestra un estado nutricional balanceado.' },
          [LED_COMMANDS.UNBALANCED]: { title: 'Nutrición desbalanceada', body: 'Tu Lumi indica que tu última comida no estuvo balanceada.' },
          [LED_COMMANDS.GREAT_FINISH]: { title: '¡Buen trabajo!', body: 'Terminaste una actividad con buena ejecución. Sigue así.' },
          [LED_COMMANDS.BAD_FINISH]: { title: 'Actividad incompleta', body: 'Tu Lumi marcó una finalización pobre. Intenta mejorar la próxima vez.' },
        };

        const info = titles[command] || { title: 'Comando enviado', body: `Se envió el comando ${command}` };

        await showNotification(info.title, {
          body: info.body,
          tag: info.tag || 'bluetooth-command',
          data: info.url ? { url: info.url } : undefined,
        });
      } catch (e) {
        console.debug('Notification failed:', e);
      }
      return true;
    } catch (err) {
      console.error("Error al enviar comando BLE:", err);
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
      if (device?.gatt && device.gatt.connected === false) {
        setIsConnected(false);
        setCharacteristic(null);
      }
    }
  };

  // Test helper: send a short blue LED pulse (WATER then OFF). Intended for manual testing only.
  const sendBlueTestPulse = async (durationMs: number = 1500) => {
    if (!isConnected || !characteristic) {
      console.warn("No hay conexión Bluetooth activa - no se puede enviar pulso de prueba");
      setError("No hay conexión Bluetooth activa");
      return;
    }

    try {
      // Turn on blue LED (WATER command)
      await sendCommandInternal(characteristic, LED_COMMANDS.WATER);
      // Wait requested duration
      await new Promise((res) => setTimeout(res, durationMs));
      // Turn off LED
      await sendCommandInternal(characteristic, LED_COMMANDS.OFF);
      setError(null);
    } catch (err) {
      console.error("Error al enviar pulso de prueba BLE:", err);
      setError("Error al enviar pulso de prueba BLE");
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
        sendBlueTestPulse,
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
