"use client";

import useSocket from "@/hooks/useSocket";
import { createContext, useContext, useEffect, useState } from "react";

const SocketContext = createContext<WebSocket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { disconnect, createSocket } = useSocket();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    createSocket((ws) => {
      setSocket(ws);
    });
    return () => {
      disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useAppSocket() {
  return useContext(SocketContext);
}
