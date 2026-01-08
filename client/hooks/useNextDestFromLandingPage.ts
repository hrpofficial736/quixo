"use client";

import { useAppSocket } from "@/context/SocketContext";
import rtcManager from "@/services/rtcManager";
import socketManager from "@/services/socketManager";
import { UserStore, useUserStore } from "@/stores/useUserStore";
import { ReadonlyURLSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function useNextDestFromLandingPage() {
  const socket = useAppSocket();
  const [navigateToTransferWindow, setNavigateToShowTransferWindow] =
    useState<boolean>(false);
  const userStore = useUserStore();
  const pair = (params: ReadonlyURLSearchParams, thisDeviceName: string) => {
    console.log("inside pair handler!");
    handlePairWithOtherDevice(
      socket!,
      params,
      userStore,
      setNavigateToShowTransferWindow,
      thisDeviceName,
    );
  };

  return { pair, navigateToTransferWindow };
}

function handlePairWithOtherDevice(
  socket: WebSocket,
  params: ReadonlyURLSearchParams,
  userStore: UserStore,
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

  if (socket && params.size > 0) {
    emitEvent(socket!, "request_to_pair", {
      deviceName: params.get("name"),
      redirectUrl: window.location.href,
      status: params.get("status"),
      pairingId: params.get("pairing_id"),
      thisDeviceName,
    });
    listenEvent("room_ready", (res) => {
      if (res.success) {
        userStore.setUser({
          id: res.data["id"] as string,
          pairingId: params.get("pairing_id")!,
          otherDeviceName: params.get("name")!,
        });
        const pc = createNewRTCPeerConnection();
        listenForICECandidates(pc, (candidate) => {
          emitEvent(socket!, "ice-candidates", {
            clientId: userStore.id,
            pairingId: userStore.pairingId,
            candidate,
          });
          listenEvent("ice-candidates", (params) => {
            if (params.success) {
              addIceCandidate(pc, params.data["candidate"] as RTCIceCandidate);
            }
          });
        });
        listenEvent("offer", (params) => {
          if (params.success) {
            createAnswer(
              pc,
              params.data["sd"] as RTCSessionDescription,
              (answer) => {
                emitEvent(socket!, "answer", {
                  clientId: userStore.id,
                  pairingId: userStore.pairingId,
                  sd: answer,
                });
              },
            );
          }
        });
        listenForDataChannel(pc, () => {
          navigateToTransferWindowSetter(true);
        });
        return;
      }
      toast.error("Error pairing with device: " + res.message);
      navigateToTransferWindowSetter(false);
    });
  }
}
