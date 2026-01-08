import { useAppSocket } from "@/context/SocketContext";
import rtcManager from "@/services/rtcManager";
import socketManager from "@/services/socketManager";
import { UserStore, useUserStore } from "@/stores/useUserStore";
import { QRCodeDataInterface } from "@/types/socketResponses";
import { Dispatch, SetStateAction, useState } from "react";

export default function useInitializeConnection() {
  const socket = useAppSocket();
  const [readyToPair, setReadyToPair] = useState<string>("WAITING");
  const store = useUserStore();
  const [connected, setConnected] = useState<boolean>(false);
  const execute = (data: QRCodeDataInterface) =>
    handleNameSubmit(data, socket!, setReadyToPair, setConnected, store);

  return { execute, readyToPair, connected };
}

const handleNameSubmit = (
  data: QRCodeDataInterface,
  socket: WebSocket,
  readyToPairSetter: Dispatch<SetStateAction<string>>,
  connectionStatusSetter: Dispatch<SetStateAction<boolean>>,
  userStore: UserStore,
) => {
  const {
    createNewRTCPeerConnection,
    listenForICECandidates,
    addIceCandidate,
    createOffer,
    createDataChannel,
    listenForDataChannel,
    setAnswer,
  } = rtcManager();

  const { emitEvent, listenEvent } = socketManager();

  emitEvent(socket, "ready_to_pair", {
    deviceName: data.deviceName,
    redirectUrl: data.redirectUrl,
    status: data.status,
    pairingId: data.pairingId,
  });
  listenEvent("ready_to_pair", (params) => {
    console.log("event listened: ", params);
    if (params.success) {
      readyToPairSetter("READY_TO_PAIR");
      console.log("ready to pair event successful: ", params);
      useUserStore.getState().setUser({
        id: params.data["id"] as string,
        pairingId: data.pairingId,
        status: "WAITING",
      });
      return;
    }
    readyToPairSetter("FAILED");
  });

  listenEvent("room_ready", (params) => {
    console.log("room ready event on host: ", params);
    if (params.success) {
      useUserStore.getState().setUser({
        otherDeviceName: params.data["otherDeviceName"] as string,
      });
      // console.log(userStore);
      const pc = createNewRTCPeerConnection();
      console.log("peer connection: ", pc);
      createDataChannel(pc);
      listenForDataChannel(pc, () => {
        connectionStatusSetter(true);
      });
      createOffer(pc, (sd) => {
        console.log("offer created: ", sd);

        console.log(
          useUserStore.getState().id,
          useUserStore.getState().pairingId,
        );
        emitEvent(socket!, "offer", {
          clientId: useUserStore.getState().id,
          pairingId: useUserStore.getState().pairingId,
          sd,
        });
      });
      listenEvent("answer", (params) => {
        if (params.success) {
          setAnswer(pc, params.data["sd"] as RTCSessionDescription);
        }
      });
      listenForICECandidates(pc, (candidate) => {
        emitEvent(socket!, "ice-candidates", {
          clientId: useUserStore.getState().id,
          pairingId: useUserStore.getState().pairingId,
          candidate,
        });
        listenEvent("ice-candidates", (params) => {
          if (params.success) {
            addIceCandidate(pc, params.data["candidate"] as RTCIceCandidate);
          }
        });
      });
    }
  });
};
