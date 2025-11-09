import { motion } from "motion/react";
import { Droplet } from "lucide-react";
import { Button } from "./ui/button";

interface OnboardingBlueProps {
  onNext: () => void;
}

export function OnboardingBlue({ onNext }: OnboardingBlueProps) {
  return (
    <div className="relative h-full bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50 overflow-hidden p-6 flex flex-col">
      {/* Background elements */}
      <motion.div
        className="absolute top-1/4 right-10 w-48 h-48 bg-blue-400/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        {/* Lumi device - BLUE */}
        <motion.div
          className="relative w-44 h-44 mb-8"
          animate={{
            y: [0, -12, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Blue glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full blur-3xl opacity-70"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          
          {/* Device body */}
          <div className="relative w-full h-full bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center border border-white/50">
            {/* Blue inner glow */}
            <motion.div
              className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-200 to-blue-300"
              animate={{
                boxShadow: [
                  "0 0 30px rgba(147, 197, 253, 0.6)",
                  "0 0 50px rgba(147, 197, 253, 0.9)",
                  "0 0 30px rgba(147, 197, 253, 0.6)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Droplet className="w-12 h-12 text-blue-700" fill="currentColor" />
              </div>
            </motion.div>
          </div>
          
          {/* Metal loop */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-10 border-4 border-gray-300 rounded-t-full shadow-lg" />
        </motion.div>

        {/* Color badge */}
        <motion.div
          className="flex items-center gap-2 bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800 px-6 py-2 rounded-full mb-6 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <Droplet className="w-5 h-5" />
          <span className="font-medium">Azul - Hidratación</span>
        </motion.div>

        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 max-w-sm border border-white/50 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-gray-800 mb-3 text-center">💧 ¡Dale aguita a tu cuerpo!</h2>
          <p className="text-sm text-gray-700 text-center mb-4 leading-relaxed">
            Cuando brillo en <span className="text-blue-600">azul</span>, es tu recordatorio chill de que necesitas hidratarte
          </p>
          
          <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
              <p className="text-xs text-gray-600">Te hago un reminder suave para que bebas agua</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
              <p className="text-xs text-gray-600">Aparezco cada rato si te olvidas del H₂O</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
              <p className="text-xs text-gray-600">Me relajo cuando registras tu vasito 🌊</p>
            </div>
          </div>
        </motion.div>

        <Button 
          className="w-full max-w-xs bg-gradient-to-r from-blue-300 to-cyan-300 hover:from-blue-400 hover:to-cyan-400 text-blue-900 rounded-full mt-8"
          onClick={onNext}
        >
          Siguiente color
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-8 h-2 bg-blue-500 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}
