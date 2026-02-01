import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";

let candidateQueues = new WeakMap<RTCPeerConnection, RTCIceCandidate[]>();

export default function rtcManager() {
  return {
    createNewRTCPeerConnection,
    listenForICECandidates,
    addIceCandidate,
    createOffer,
    createAnswer,
    setAnswer,
    createDataChannel,
    listenForDataChannel,
    listenForDataChannelMessage,
  };
}

function createNewRTCPeerConnection(onCloseHandler: () => void) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: process.env.NEXT_PUBLIC_GOOGLE_ICE_SERVER_URL! }],
  });

  pc.onconnectionstatechange = () => {
    if (
      pc.connectionState === "disconnected" ||
      pc.connectionState === "closed"
    ) {
      if (onCloseHandler) {
        onCloseHandler();
      }

      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.ondatachannel = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.close();

      candidateQueues = new WeakMap<RTCPeerConnection, RTCIceCandidate[]>();
    }
  };

  useWebRTCConnectionStore.getState().setPC(pc);

  return pc;
}

function listenForICECandidates(
  pc: RTCPeerConnection,
  handler: (candidate: RTCIceCandidate) => void,
) {
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      handler(event.candidate);
    }
  };
}

async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidate,
) {
  if (!candidate) {
    return;
  }

  try {
    if (pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));

      const queue = candidateQueues.get(pc);
      if (queue && queue.length > 0) {
        const candidatesToProcess = queue.splice(0);
        for (const queuedCandidate of candidatesToProcess) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
          } catch (error) {
            console.error("Error adding queued ICE candidates:", error);
          }
        }
        candidateQueues.delete(pc);
      }
    } else {
      if (!candidateQueues.has(pc)) {
        candidateQueues.set(pc, []);
      }
      candidateQueues.get(pc)!.push(candidate);
    }
  } catch (error) {
    console.error("Error adding ICE candidates: ", error, candidate);
  }
}

async function createOffer(
  pc: RTCPeerConnection,
  handler: (offer: RTCSessionDescriptionInit) => void,
) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  handler(offer);
}

async function createAnswer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit,
  handler: (answer: RTCSessionDescriptionInit) => void,
) {
  if (!pc || pc.signalingState !== "stable") return;
  await pc.setRemoteDescription(offer);
  const queue = candidateQueues.get(pc);
  if (queue && queue.length > 0) {
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding queued ICE candidates: ", error);
      }
    }
    candidateQueues.delete(pc);
  }

  const answer = await pc.createAnswer();
  if (pc.signalingState === "stable") {
    return;
  }
  await pc.setLocalDescription(answer);
  handler(answer);
}

async function setAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit,
) {
  try {
    if (pc.signalingState !== "stable") {
      await pc.setRemoteDescription(answer);
      const queue = candidateQueues.get(pc);
      if (queue && queue.length > 0) {
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error("Error adding queued ICE candidates", error);
          }
        }
        candidateQueues.delete(pc);
      }
    }
  } catch (error) {
    console.error("Error setting remote answer", answer);
    throw error;
  }
}

function createDataChannel(
  pc: RTCPeerConnection,
  channelName: string,
  handler?: () => void,
) {
  const dataChannel = pc.createDataChannel(channelName);
  dataChannel.onopen = () => {
    if (channelName === "control") {
      useWebRTCConnectionStore.getState().setControlDataChannel(dataChannel);
    } else {
      useWebRTCConnectionStore.getState().setFileDataChannels(dataChannel);
    }
    if (handler) handler();
  };
}

function listenForDataChannel(pc: RTCPeerConnection, handler: () => void) {
  pc.ondatachannel = (event) => {
    const channel = event.channel;
    channel.onopen = () => {
      if (channel.label === "control") {
        useWebRTCConnectionStore.getState().setControlDataChannel(channel);
      } else {
        useWebRTCConnectionStore.getState().setFileDataChannels(channel);
      }
      handler();
    };
  };
}

function listenForDataChannelMessage(
  dc: RTCDataChannel,
  handler: (event: MessageEvent) => void,
) {
  if (!dc) return;
  dc.addEventListener("message", handler);

  return () => {
    dc.removeEventListener("message", handler);
  };
}
