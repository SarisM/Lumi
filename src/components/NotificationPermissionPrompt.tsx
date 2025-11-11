import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { requestNotificationPermission, showNotification } from "../utils/pwa";

const DISMISS_KEY = "lumi_notifications_prompt_dismissed";

export default function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === "undefined") return "denied";
    return Notification.permission;
  });

  useEffect(() => {
    // If already granted or denied or user dismissed the prompt, don't show
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (permission === "default" && !dismissed) {
      setVisible(true);
    }
  }, [permission]);

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setVisible(false);

    if (result === "granted") {
      try {
        await showNotification("Lumi listo", {
          body: "Has activado las notificaciones. Recibirás alertas cuando tu Lumi lo indique.",
          tag: "notifications-enabled",
        });
      } catch (e) {
        console.debug("showNotification failed after permission:", e);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 max-w-xl w-full px-4">
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">¿Quieres recibir notificaciones?</p>
          <p className="text-xs text-gray-500">Activa las notificaciones para recibir alertas cuando tu Lumi lo indique (hidratación, recordatorios).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="px-3 py-1" onClick={handleEnable}>Activar</Button>
          <Button variant="ghost" className="px-3 py-1" onClick={handleDismiss}>Recordármelo después</Button>
        </div>
      </div>
    </div>
  );
}
