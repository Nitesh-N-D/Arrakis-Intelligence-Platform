import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    const connection = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
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
