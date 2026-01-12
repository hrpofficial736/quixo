import { useAppSocket } from "@/context/SocketContext";
import rtcManager from "@/services/rtcManager";
import socketManager from "@/services/socketManager";
import { useConnectionStatusStore } from "@/stores/useConnectionStatusStore";
import { useFileTransferStore } from "@/stores/useFileTransferStore";
import { useUserStore } from "@/stores/useUserStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import { QRCodeDataInterface } from "@/types/socketResponses";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import toast from "react-hot-toast";

export default function useInitializeConnection() {
  const socket = useAppSocket();
  const router = useRouter();
  const [readyToPair, setReadyToPair] = useState<string>("WAITING");
  const [connected, setConnected] = useState<boolean>(false);
  const execute = (data: QRCodeDataInterface) =>
    handleNameSubmit(data, socket!, setReadyToPair, setConnected, router);

  return { execute, readyToPair, connected };
}

const handleNameSubmit = (
  data: QRCodeDataInterface,
  socket: WebSocket,
  readyToPairSetter: Dispatch<SetStateAction<string>>,
  connectionStatusSetter: Dispatch<SetStateAction<boolean>>,
  router: AppRouterInstance,
) => {
  const {
    createNewRTCPeerConnection,
    listenForICECandidates,
    addIceCandidate,
    createOffer,
    createDataChannel,
    setAnswer,
  } = rtcManager();

  const { emitEvent, listenEvent } = socketManager();

  emitEvent(socket, "ready_to_pair", {
    thisDeviceName: data.deviceName,
    redirectUrl: data.redirectUrl,
    pairingId: data.pairingId,
  });

  listenEvent("ready_to_pair", (params) => {
    console.log("event listened: ", params);
    if (params.success) {
      readyToPairSetter("READY_TO_PAIR");
      useUserStore.getState().setUser({
        id: params.data["id"] as string,
        pairingId: data.pairingId,
        status: "WAITING",
      });
      console.log("ready to pair");
    } else {
      readyToPairSetter("FAILED");
    }
  });

  listenEvent("room_ready", (params) => {
    if (!params.success) return;
    useUserStore.getState().setUser({
      otherDeviceName: params.data["otherDeviceName"] as string,
    });
    const pc = createNewRTCPeerConnection(() => {
      toast.success("Disconnected with " + params.data["otherDeviceName"]);
      useUserStore.setState(useUserStore.getInitialState());
      useWebRTCConnectionStore.setState(
        useWebRTCConnectionStore.getInitialState(),
      );
      useFileTransferStore.setState(useFileTransferStore.getInitialState());
      useConnectionStatusStore.setState(
        useConnectionStatusStore.getInitialState(),
      );
      toast.success(
        "Disconnected with " + useUserStore.getState().otherDeviceName,
      );
      emitEvent(socket, "delete_room", { pairingId: data.pairingId });
      router.push("/");
    });
    const outgoingCandidateQueue: (RTCIceCandidate | null)[] = [];
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
        console.log("Queueing ICE candidate (waiting for remote description)");
        outgoingCandidateQueue.push(candidate);
      }
    });
    createDataChannel(pc, () => {
      console.log("incoming data channel opened, connection ready!");
      connectionStatusSetter(true);
    });

    createOffer(pc, (offer) => {
      const clientId = useUserStore.getState().id;
      const pairingId = useUserStore.getState().pairingId;

      emitEvent(socket, "offer", {
        clientId,
        pairingId,
        sd: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });
    });
    listenEvent("answer", (params) => {
      if (!params.success) {
        console.error("answer event failed:", params.message);
        return;
      }
      setAnswer(pc, params.data["sd"] as RTCSessionDescriptionInit);
      remoteDescriptionSet = true;

      setTimeout(() => {
        for (const candidate of outgoingCandidateQueue) {
          sendIceCandidate(candidate);
        }
        outgoingCandidateQueue.length = 0;
      }, 100);
    });

    listenEvent("ice-candidates", (params) => {
      if (!params.success) {
        console.error("ice-candidates event failed!", params.message);
        return;
      }
      const candidate = params.data["candidate"] as RTCIceCandidate | null;
      if (candidate) {
        addIceCandidate(pc, candidate);
      }
    });
  });
};
