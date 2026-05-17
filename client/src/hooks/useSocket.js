import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const fallbackSocketUrl = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:5000";

export function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    const connection = io(import.meta.env.VITE_SOCKET_URL || fallbackSocketUrl, {
      auth: { token }
    });

    setSocket(connection);

    return () => {
      connection.close();
      setSocket(null);
    };
  }, [token]);

  return socket;
}
