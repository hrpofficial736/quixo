"use client";

import { useAppSocket } from "@/context/SocketContext";
import rtcManager from "@/services/rtcManager";
import socketManager from "@/services/socketManager";
import { useConnectionStatusStore } from "@/stores/useConnectionStatusStore";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useUserStore } from "@/stores/useUserStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import toast from "react-hot-toast";

export default function useNextDestFromLandingPage() {
  const socket = useAppSocket();
  const router = useRouter();
  const [navigateToTransferWindow, setNavigateToShowTransferWindow] =
    useState<boolean>(false);
  const pair = (id: string, thisDeviceName: string) => {
    handlePairWithOtherDevice(
      socket!,
      id,
      setNavigateToShowTransferWindow,
      thisDeviceName,
      router,
    );
  };

  return { pair, navigateToTransferWindow };
}

function handlePairWithOtherDevice(
  socket: WebSocket,
  id: string,
  navigateToTransferWindowSetter: Dispatch<SetStateAction<boolean>>,
  thisDeviceName: string,
  router: AppRouterInstance,
) {
  const {
    createNewRTCPeerConnection,
    listenForICECandidates,
    createAnswer,
    addIceCandidate,
    listenForDataChannel,
  } = rtcManager();
  const { emitEvent, listenEvent, removeAllListeners } = socketManager();

  if (!socket || !id) return;

  // Cleanup: Close any existing PC and remove only the listeners relevant to this flow
  useWebRTCConnectionStore.getState().closePC();
  removeAllListeners("request_to_pair");
  removeAllListeners("room_ready");
  removeAllListeners("offer");
  removeAllListeners("ice-candidates");

  emitEvent(socket!, "request_to_pair", {
    redirectUrl: window.location.href,
    thisDeviceName,
    pairingId: id,
  });

  let roomErrorToastShown: boolean = false;

  listenEvent("request_to_pair", (res) => {
    if (!res.success && !roomErrorToastShown) {
      toast.error(res.message);
      roomErrorToastShown = true;
      router.push("/");
      return;
    }
  });

  listenEvent("room_ready", (res) => {
    if (!res.success) {
      toast.error(res.message);
      navigateToTransferWindowSetter(false);
      return;
    }
    useUserStore.getState().setUser({
      id: res.data["id"] as string,
      pairingId: id,
      otherDeviceName: res.data["otherDeviceName"] as string,
    });
    let isDisconnecting = false;

    const disconnect = () => {
      if (isDisconnecting) return;
      isDisconnecting = true;
      toast.success("Disconnected with " + res.data["otherDeviceName"]);
      useUserStore.setState(useUserStore.getInitialState());
      useWebRTCConnectionStore.setState(
        useWebRTCConnectionStore.getInitialState(),
      );
      useFileTransferStore.setState(useFileTransferStore.getInitialState());
      useConnectionStatusStore.setState(
        useConnectionStatusStore.getInitialState(),
      );
      router.push("/");
    };

    const pc = createNewRTCPeerConnection(disconnect);

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
        outgoingCandidatesQueue.push(candidate);
      }
    });
    listenForDataChannel(pc, () => {
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
      if (!pc || pc.signalingState === "closed") {
        return;
      }
      if (!params.success) {
        console.error("ICE candidate event failed!", params.message);
        return;
      }
      const candidate = params.data["candidate"] as RTCIceCandidate | null;

      if (candidate) {
        addIceCandidate(pc, candidate);
      }
    });

    listenEvent("room_deleted", (params) => {
      if (params.success) {
        disconnect();
        useWebRTCConnectionStore.getState().closePC();
      }
    });
  });
}
