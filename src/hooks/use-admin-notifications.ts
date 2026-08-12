import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { getToken } from "@/lib/admin-api";

const API_BASE = import.meta.env.VITE_AGENT_API_URL ?? "";

export type AdminPushNotification = {
  type: string;
  message: string;
  reservationId: string | null;
  createdAt: string;
};

export function useAdminNotifications(
  onNotification: (n: AdminPushNotification) => void,
  enabled: boolean,
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const stop = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
      } catch {
        // ignore
      }
      connectionRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/admin-notifications`, {
        accessTokenFactory: () => getToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("adminNotification", (payload: AdminPushNotification) => {
      onNotificationRef.current(payload);
    });

    connectionRef.current = connection;

    let cancelled = false;
    connection
      .start()
      .catch((err) => {
        if (!cancelled) console.warn("SignalR connection failed:", err);
      });

    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, stop]);

  return { stop };
}
