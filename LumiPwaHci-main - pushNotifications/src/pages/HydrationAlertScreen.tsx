import { motion } from "motion/react";
import { Droplet, X, Clock, Waves } from "lucide-react";
import { Button } from "../components/ui/button";

interface HydrationAlertScreenProps {
  onDismiss: () => void;
  onSnooze: () => void;
}

export function HydrationAlertScreen({ onDismiss, onSnooze }: HydrationAlertScreenProps) {
  return (
    <div className="relative h-full bg-gradient-to-br from-blue-400 via-blue-300 to-cyan-300 overflow-hidden flex items-center justify-center">
      {/* Animated water waves background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating water droplets */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-white/40 rounded-full"
          style={{
            left: `${20 + i * 12}%`,
            top: `${30 + (i % 2) * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 px-6 w-full max-w-sm">
        {/* Main alert card */}
        <motion.div
          className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border-4 border-white/60"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Pulsing water icon */}
          <motion.div
            className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-xl"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 10px 40px rgba(59, 130, 246, 0.3)",
                "0 10px 60px rgba(59, 130, 246, 0.5)",
                "0 10px 40px rgba(59, 130, 246, 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Droplet className="w-14 h-14 text-white" fill="white" />
          </motion.div>

          {/* Alert text */}
          <div className="text-center mb-6">
            <motion.h2
              className="text-gray-800 mb-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              ¡Tu cuerpo te llama! 💧
            </motion.h2>
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Tu Lumi brilla en azul porque necesitas hidratarte. ¡Dale ese boost de H₂O que mereces!
            </motion.p>
          </div>

          {/* Wave animation separator */}
          <motion.div
            className="flex justify-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>

          {/* Action buttons */}
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onDismiss}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl h-14 shadow-lg"
              >
                <Droplet className="w-5 h-5 mr-2" />
                Ya bebí agua
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onSnooze}
                variant="outline"
                className="w-full bg-white/50 border-2 border-blue-200 hover:bg-blue-50 text-blue-700 rounded-2xl h-12"
              >
                <Clock className="w-4 h-4 mr-2" />
                Recordar en 10 min
              </Button>
            </motion.div>
          </div>

          {/* Tip card */}
          <motion.div
            className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-start gap-3">
              <Waves className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <span className="font-medium">Fun fact:</span> El agua le da superpoderes a tu cerebro, 
                te llena de energía y hace que tu piel brille como diamante ✨
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Dismiss button (X) */}
        <motion.button
          onClick={onDismiss}
          className="mt-6 mx-auto w-14 h-14 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-6 h-6 text-blue-600" />
        </motion.button>
      </div>

      {/* Bottom wave decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-30"
        style={{
          background: "linear-gradient(to top, rgba(255,255,255,0.5), transparent)",
        }}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
