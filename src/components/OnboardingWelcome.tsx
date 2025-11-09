import { motion } from "motion/react";
import { Button } from "./ui/button";

interface OnboardingWelcomeProps {
  onNext: () => void;
}

export function OnboardingWelcome({ onNext }: OnboardingWelcomeProps) {
  return (
    <div className="relative h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden p-6 flex flex-col">
      {/* Background blur circles */}
      <motion.div
        className="absolute top-20 left-10 w-40 h-40 bg-blue-300/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-40 h-40 bg-purple-300/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        {/* Lumi device illustration - multi-color cycling */}
        <motion.div
          className="relative w-40 h-40 mb-8"
          animate={{
            y: [0, -12, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Outer glow - cycling colors */}
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl opacity-60"
            animate={{
              background: [
                "linear-gradient(135deg, #DBEAFE, #93C5FD)",
                "linear-gradient(135deg, #FED7AA, #FDBA74)",
                "linear-gradient(135deg, #D1FAE5, #86EFAC)",
                "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                "linear-gradient(135deg, #DBEAFE, #93C5FD)",
              ],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Device body */}
          <div className="relative w-full h-full bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center border border-white/50">
            {/* Inner glow ring - cycling */}
            <motion.div
              className="w-24 h-24 rounded-full"
              animate={{
                background: [
                  "linear-gradient(135deg, #DBEAFE, #93C5FD)",
                  "linear-gradient(135deg, #FED7AA, #FDBA74)",
                  "linear-gradient(135deg, #D1FAE5, #86EFAC)",
                  "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                  "linear-gradient(135deg, #DBEAFE, #93C5FD)",
                ],
                boxShadow: [
                  "0 0 30px rgba(219, 234, 254, 0.8)",
                  "0 0 30px rgba(254, 215, 170, 0.8)",
                  "0 0 30px rgba(209, 250, 229, 0.8)",
                  "0 0 30px rgba(254, 243, 199, 0.8)",
                  "0 0 30px rgba(219, 234, 254, 0.8)",
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          
          {/* Metal loop */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-10 border-4 border-gray-300 rounded-t-full shadow-lg" />
        </motion.div>

        <motion.h1
          className="text-center mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          ¡Hola! Soy Lumi ✨
        </motion.h1>

        <motion.p
          className="text-center text-gray-600 mb-4 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Tu bestie de luz que te cuida 24/7
        </motion.p>

        <motion.div
          className="bg-white/60 backdrop-blur-md rounded-2xl p-4 mb-8 max-w-xs border border-white/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-gray-700 text-center mb-2">
            Soy un llavero inteligente que brilla con colores mágicos para guiarte hacia tu mejor versión
          </p>
          <p className="text-xs text-gray-500 text-center italic">
            Cada color tiene su vibe especial 🌈
          </p>
        </motion.div>

        <Button 
          className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full"
          onClick={onNext}
        >
          Descubre los colores
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-8 h-2 bg-purple-500 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}
