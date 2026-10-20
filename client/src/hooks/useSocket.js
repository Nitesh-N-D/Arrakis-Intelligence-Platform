import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { refreshSession, setAccessToken } from "../services/http";
import { installSocketRecovery } from "../services/socketRecovery";

const fallbackSocketUrl = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:5000";

export function useSocket(token, userId, onResync) {
  const [socket, setSocket] = useState(null);
  const connectionRef = useRef(null);
  const onResyncRef = useRef(onResync);
  const appliedTokenRef = useRef(token);

  onResyncRef.current = onResync;

  useEffect(() => {
    if (!userId || !token) return undefined;

    const connection = io(import.meta.env.VITE_SOCKET_URL || fallbackSocketUrl, {
      auth: { token }
    });
    connectionRef.current = connection;
    const removeRecovery = installSocketRecovery({
      socket: connection,
      refreshSession,
      updateAccessToken: setAccessToken,
      onResync: () => Promise.resolve(onResyncRef.current?.()).catch(() => {})
    });

    setSocket(connection);

    return () => {
      removeRecovery();
      connection.close();
      if (connectionRef.current === connection) connectionRef.current = null;
      setSocket(null);
    };
  }, [userId, Boolean(token)]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || !token || appliedTokenRef.current === token) return;
    appliedTokenRef.current = token;
    connection.auth = { token };
    if (connection.disconnected) connection.connect();
  }, [token]);

  return socket;
}
