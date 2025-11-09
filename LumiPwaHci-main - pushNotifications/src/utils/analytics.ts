import { projectId, publicAnonKey } from "./supabase/info";

export type EventType = 
  | "hydration_logged"
  | "meal_logged"
  | "energy_updated"
  | "bluetooth_connected"
  | "bluetooth_disconnected"
  | "onboarding_completed"
  | "profile_updated";

export interface UserEvent {
  userId: string;
  eventType: EventType;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * Registra un evento de interacción del usuario en la base de datos
 */
export async function logUserEvent(
  userId: string,
  accessToken: string,
  eventType: EventType,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const event: UserEvent = {
      userId,
      eventType,
      timestamp,
      data,
    };

    // Guardar evento con clave: user:{userId}:event:{timestamp}
    const eventKey = `user:${userId}:event:${timestamp}`;
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7e221a31/analytics/event`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          key: eventKey,
          event,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Error logging user event:", error);
      return false;
    }

    console.log(`✅ Event logged: ${eventType}`, data);
    return true;
  } catch (error) {
    console.error("Failed to log user event:", error);
    return false;
  }
}

/**
 * Obtiene todos los eventos de un usuario
 */
export async function getUserEvents(
  userId: string,
  accessToken: string,
  eventType?: EventType,
  limit?: number
): Promise<UserEvent[]> {
  try {
    const params = new URLSearchParams();
    params.append("userId", userId);
    if (eventType) params.append("eventType", eventType);
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7e221a31/analytics/events?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Error fetching user events:", error);
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("Failed to fetch user events:", error);
    return [];
  }
}

/**
 * Obtiene estadísticas de hidratación del usuario
 */
export async function getHydrationStats(
  userId: string,
  accessToken: string,
  days: number = 7
): Promise<{
  totalEvents: number;
  averagePerDay: number;
  events: UserEvent[];
}> {
  try {
    const params = new URLSearchParams();
    params.append("userId", userId);
    params.append("days", days.toString());

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7e221a31/analytics/hydration-stats?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Error fetching hydration stats:", error);
      return { totalEvents: 0, averagePerDay: 0, events: [] };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch hydration stats:", error);
    return { totalEvents: 0, averagePerDay: 0, events: [] };
  }
}
