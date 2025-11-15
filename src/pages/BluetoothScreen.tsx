import { motion } from "motion/react";
import { Bluetooth, Check, AlertCircle, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { useEffect } from "react";
import { useBluetooth } from "../contexts/BluetoothContext";

interface BluetoothScreenProps {
  onNext: () => void;
}

export function BluetoothScreen({ onNext }: BluetoothScreenProps) {
  const { isConnected, isConnecting, deviceName, error, connect } = useBluetooth();
  
  // Auto advance after connection
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        onNext();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, onNext]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden p-6 flex flex-col">
      {/* Animated background */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        {/* Connection animation */}
        <div className="relative mb-8">
          {/* Pulse rings */}
          {!isConnected && (
            <>
              <motion.div
                className="absolute inset-0 w-48 h-48 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 border-2 border-blue-400/30 rounded-full"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.5, 0.2, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <motion.div
                className="absolute inset-0 w-48 h-48 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 border-2 border-blue-400/30 rounded-full"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.5, 0.2, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.7,
                }}
              />
            </>
          )}

          {/* Device illustration */}
          <motion.div
            className="relative w-32 h-32"
            animate={{
              scale: isConnected ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.5,
            }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-xl opacity-60"
              animate={{
                opacity: isConnected ? [0.6, 0.8, 0.6] : isConnecting ? [0.3, 0.5, 0.3] : 0.4,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            
            {/* Device */}
            <div className="relative w-full h-full bg-white/90 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center border-2 border-white/50">
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: isConnected
                    ? "linear-gradient(135deg, #34D399, #10B981)"
                    : error
                    ? "linear-gradient(135deg, #EF4444, #DC2626)"
                    : "linear-gradient(135deg, #60A5FA, #A78BFA)",
                }}
                animate={{
                  rotate: isConnected ? 0 : isConnecting ? [0, 360] : 0,
                }}
                transition={{
                  duration: 3,
                  repeat: isConnecting ? Infinity : 0,
                  ease: "linear",
                }}
              >
                {isConnected ? (
                  <Check className="w-8 h-8 text-white" />
                ) : error ? (
                  <X className="w-8 h-8 text-white" />
                ) : (
                  <Bluetooth className="w-8 h-8 text-white" />
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Connection line to phone */}
          {!isConnected && !error && (
            <motion.div
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-blue-400 to-transparent"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          )}
        </div>

        {/* Status text */}
        <motion.div
          className="text-center mb-8"
          key={isConnected ? "connected" : "searching"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-gray-800 mb-2">
            {isConnected ? `¡Conectado a ${deviceName}! ✨` : isConnecting ? "Conectando..." : "Conecta tu dispositivo"}
          </h2>
          <p className="text-sm text-gray-500">
            {isConnected
              ? "Tu dispositivo está listo"
              : isConnecting
              ? "Selecciona tu dispositivo BLE"
              : "Asegúrate de que tu dispositivo esté cerca"}
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-xs"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              {error.includes("no disponible") && (
                <p className="text-xs text-red-600 mt-1">
                  Abre esta app en Chrome, Edge u Opera
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Phone icon */}
        <motion.div
          className="w-16 h-16 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-gray-200 shadow-lg mb-8"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Bluetooth className="w-8 h-8 text-blue-500" />
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-3 w-full max-w-xs">
          {isConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-sm text-center text-gray-600">
                Entrando a tu espacio de bienestar...
              </p>
            </motion.div>
          ) : (
            <>
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? "Conectando..." : "Buscar dispositivo BLE"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-600 rounded-full"
                onClick={onNext}
              >
                Omitir por ahora
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
