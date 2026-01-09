"use client";

import { useAppSocket } from "@/context/SocketContext";
import rtcManager from "@/services/rtcManager";
import socketManager from "@/services/socketManager";
import { useUserStore } from "@/stores/useUserStore";
import { ReadonlyURLSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import toast from "react-hot-toast";

export default function useNextDestFromLandingPage() {
  const socket = useAppSocket();
  const [navigateToTransferWindow, setNavigateToShowTransferWindow] =
    useState<boolean>(false);
  const pair = (params: ReadonlyURLSearchParams, thisDeviceName: string) => {
    console.log("inside pair handler!");
    handlePairWithOtherDevice(
      socket!,
      params,
      setNavigateToShowTransferWindow,
      thisDeviceName,
    );
  };

  return { pair, navigateToTransferWindow };
}

function handlePairWithOtherDevice(
  socket: WebSocket,
  params: ReadonlyURLSearchParams,
  navigateToTransferWindowSetter: Dispatch<SetStateAction<boolean>>,
  thisDeviceName: string,
) {
  console.log("inside main handler!");
  const {
    createNewRTCPeerConnection,
    listenForICECandidates,
    createAnswer,
    addIceCandidate,
    listenForDataChannel,
  } = rtcManager();
  const { emitEvent, listenEvent } = socketManager();

  if (!socket || params.size === 0) return;

  emitEvent(socket!, "request_to_pair", {
    deviceName: params.get("name"),
    redirectUrl: window.location.href,
    status: params.get("status"),
    pairingId: params.get("pairing_id"),
    thisDeviceName,
  });

  listenEvent("room_ready", (res) => {
    if (!res.success) {
      toast.error("Error pairing with device: " + res.message);
      navigateToTransferWindowSetter(false);
      return;
    }
    useUserStore.getState().setUser({
      id: res.data["id"] as string,
      pairingId: params.get("pairing_id")!,
      otherDeviceName: params.get("name")!,
    });
    const pc = createNewRTCPeerConnection();
    const outgoingCandidatesQueue: (RTCIceCandidate | null)[] = [];
    let remoteDescriptionSet = false;

    const sendIceCandidate = (candidate: RTCIceCandidate | null) => {
      const clientId = useUserStore.getState().id;
      const pairingId = useUserStore.getState().pairingId;

      if (!clientId || !pairingId) {
        console.error("Cannot send ice candidates as credentials are null!");
        return;
      }

      if (!candidate) return;

      const payload = {
        clientId,
        pairingId,
        candidate,
      };

      emitEvent(socket, "ice-candidates", payload);
    };

    listenForICECandidates(pc, (candidate) => {
      if (remoteDescriptionSet) {
        sendIceCandidate(candidate);
      } else {
        console.log("queueing candidate, waiting for remote description");
        outgoingCandidatesQueue.push(candidate);
      }
    });
    listenForDataChannel(pc, () => {
      console.log("data channel opened!");
      navigateToTransferWindowSetter(true);
    });
    listenEvent("offer", (params) => {
      if (!params.success) {
        console.error("offer event failed!", params.message);
        return;
      }
      createAnswer(
        pc,
        params.data["sd"] as RTCSessionDescriptionInit,
        (answer) => {
          const clientId = useUserStore.getState().id;
          const pairingId = useUserStore.getState().pairingId;

          if (!clientId || !pairingId) {
            console.error("cannot send answer, identifiers not set");
            return;
          }

          emitEvent(socket, "answer", { clientId, pairingId, sd: answer });

          remoteDescriptionSet = true;

          setTimeout(() => {
            for (const candidate of outgoingCandidatesQueue) {
              sendIceCandidate(candidate);
            }
            outgoingCandidatesQueue.length = 0;
          }, 100);
        },
      );
    });
    listenEvent("ice-candidates", (params) => {
      if (!params.success) {
        console.error("ICE candidate event failed!", params.message);
        return;
      }
      const candidate = params.data["candidate"] as RTCIceCandidate | null;

      if (candidate) {
        console.log("received ICE candidates from other client!");
        addIceCandidate(pc, candidate);
      }
    });
  });
}
