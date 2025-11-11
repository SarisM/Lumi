import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { requestNotificationPermission, showNotification } from "../utils/pwa";
import { useUser } from "../contexts/UserContext";

const DISMISS_KEY = "lumi_notifications_prompt_dismissed";

export default function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === "undefined") return "denied";
    return Notification.permission;
  });
  const { userId } = useUser();

  useEffect(() => {
    // Only show when user is logged in
    if (!userId) {
      setVisible(false);
      return;
    }

    // If already granted or denied or user dismissed the prompt, don't show
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (permission === "default" && !dismissed) {
      setVisible(true);
    }
  }, [permission, userId]);

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
    <div className="fixed top-4 inset-x-0 z-60 flex justify-center px-4">
      <div className="max-w-xl w-full bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
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
