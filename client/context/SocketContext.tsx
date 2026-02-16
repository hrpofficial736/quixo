"use client";

import socketManager from "@/services/socketManager";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const SocketContext = createContext<WebSocket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { disconnect, createSocket } = socketManager();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    createSocket((ws) => {
      setSocket(ws);
    }, () => {
      toast.error("Error occured, please refresh the page")
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
