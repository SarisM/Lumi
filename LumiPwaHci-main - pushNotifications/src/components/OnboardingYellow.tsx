import { motion } from "motion/react";
import { Sparkles, Star } from "lucide-react";
import { Button } from "./ui/button";

interface OnboardingYellowProps {
  onNext: () => void;
}

export function OnboardingYellow({ onNext }: OnboardingYellowProps) {
  return (
    <div className="relative h-full bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 overflow-hidden p-6 flex flex-col">
      {/* Background elements */}
      <motion.div
        className="absolute top-1/4 right-10 w-48 h-48 bg-yellow-200/40 rounded-full blur-3xl"
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
        {/* Lumi device - YELLOW PASTEL (perfect state) */}
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
          {/* Soft yellow glow - peaceful and complete */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full blur-3xl opacity-70"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
          />
          
          {/* Device body */}
          <div className="relative w-full h-full bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center border border-white/50">
            {/* Soft yellow inner glow - perfect state */}
            <motion.div
              className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-200 to-amber-300"
              animate={{
                boxShadow: [
                  "0 0 40px rgba(253, 230, 138, 0.6)",
                  "0 0 60px rgba(253, 230, 138, 0.9)",
                  "0 0 40px rgba(253, 230, 138, 0.6)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
              }}
            >
              <div className="w-full h-full flex items-center justify-center relative">
                <Star className="w-10 h-10 text-amber-600" fill="currentColor" />
                <motion.div
                  className="absolute"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                >
                  <Sparkles className="w-14 h-14 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          {/* Metal loop */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-10 border-4 border-gray-300 rounded-t-full shadow-lg" />
        </motion.div>

        {/* Color badge */}
        <motion.div
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-900 px-6 py-2 rounded-full mb-6 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <Star className="w-5 h-5" />
          <span className="font-medium">Amarillo - Perfección Total</span>
        </motion.div>

        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 max-w-sm border border-white/50 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-gray-800 mb-3 text-center">✨ ¡Estás brillando!</h2>
          <p className="text-sm text-gray-700 text-center mb-4 leading-relaxed">
            El <span className="text-amber-600">amarillo suave</span> es mi nivel máximo de felicidad — ¡estás en tu mejor momento!
          </p>
          
          <div className="bg-yellow-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
              <p className="text-xs text-gray-600">Brillo así cuando logras TODAS tus metas del día</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
              <p className="text-xs text-gray-600">Hidratación ✓ Proteína ✓ Fibra ✓ ¡Full balance!</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
              <p className="text-xs text-gray-600">Es mi manera de decir "¡Eres increíble!" 🌟</p>
            </div>
          </div>
        </motion.div>

        <Button 
          className="w-full max-w-xs bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-400 hover:to-amber-500 text-amber-900 rounded-full mt-8"
          onClick={onNext}
        >
          Comencemos
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-8 h-2 bg-yellow-300 rounded-full" />
      </div>
    </div>
  );
}
