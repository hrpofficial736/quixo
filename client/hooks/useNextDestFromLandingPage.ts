import { useAppSocket } from "@/context/SocketContext";
import rtcManager from "@/services/rtcManager";
import socketManager from "@/services/socketManager";
import { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function useNextDestFromLandingPage(
  params: ReadonlyURLSearchParams,
): boolean {
  const socket = useAppSocket();
  const [showTransferWindow, setShowTransferWindow] = useState<boolean>(false);

  const { emitEvent, listenEvent } = socketManager();

  const {
    createNewRTCPeerConnection,
    listenForICECandidates,
    createAnswer,
    addIceCandidate,
  } = rtcManager();
  useEffect(() => {
    if (socket && params.size > 0) {
      emitEvent(socket!, "request_to_pair", {
        deviceName: params.get("name"),
        redirectUrl: window.location.href,
        status: params.get("status"),
        pairingId: params.get("pairing_id"),
      });
      listenEvent(socket!, (params) => {
        if (params.eventName === "room_ready") {
          if (params.success) {
            const pc = createNewRTCPeerConnection();
            listenForICECandidates(pc, (candidate) => {
              emitEvent(socket!, "ice-candidates", { candidate });
              listenEvent(socket!, (params) => {
                if (params.eventName === "ice-candidates" && params.success) {
                  addIceCandidate(
                    pc,
                    params.data["candidate"] as RTCIceCandidate,
                  );
                }
              });
            });
            listenEvent(socket!, (params) => {
              if (params.eventName === "offer" && params.success) {
                createAnswer(
                  pc,
                  params.data["sd"] as RTCSessionDescription,
                  (answer) => {
                    emitEvent(socket!, "answer", { sd: answer });
                  },
                );
              }
            });
            return;
          }
          toast.error("Error pairing with device: " + params.message);
        }
      });
    }
  }, [socket]);

  return true;
}
