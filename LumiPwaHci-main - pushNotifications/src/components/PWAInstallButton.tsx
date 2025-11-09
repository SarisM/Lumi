import { useState, useEffect } from "react";
import { Download, Check } from "lucide-react";
import { motion } from "motion/react";
import { showInstallPrompt, canInstallPWA, isPWA, getInstallationStatus } from "../utils/pwa";

export function PWAInstallButton() {
  const [installStatus, setInstallStatus] = useState<'installed' | 'installable' | 'not-installable'>('not-installable');
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check installation status
    const status = getInstallationStatus();
    setInstallStatus(status);
    setShowButton(status === 'installable');

    // Listen for installation status changes
    const interval = setInterval(() => {
      const newStatus = getInstallationStatus();
      if (newStatus !== installStatus) {
        setInstallStatus(newStatus);
        setShowButton(newStatus === 'installable');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInstallClick = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowButton(false);
      setInstallStatus('installed');
    }
  };

  // Don't show button if already installed or not installable
  if (!showButton) {
    return null;
  }

  return (
    <motion.button
      onClick={handleInstallClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-800 rounded-xl shadow-lg transition-all"
      whileTap={{ scale: 0.95 }}
    >
      {installStatus === 'installed' ? (
        <>
          <Check className="w-4 h-4" />
          <span className="text-sm">Instalada</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="text-sm">Instalar Lumi</span>
        </>
      )}
    </motion.button>
  );
}
