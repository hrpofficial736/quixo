const dataChannels = new WeakMap<RTCPeerConnection, RTCDataChannel>();

const candidateQueues = new WeakMap<RTCPeerConnection, RTCIceCandidate[]>();

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
  };
}

function createNewRTCPeerConnection() {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: process.env.NEXT_PUBLIC_GOOGLE_ICE_SERVER_URL! }],
  });

  pc.onconnectionstatechange = () => {
    console.log("connection state changed: ", pc.connectionState);
  };
  pc.oniceconnectionstatechange = () => {
    console.log("ICE:", pc.iceConnectionState);
  };
  pc.onicegatheringstatechange = () => {
    console.log("ICE gathering:", pc.iceGatheringState);
  };

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
    console.log("End of candidates (null candidate)");
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
  console.log("offer created: ", offer);
  handler(offer);
}

async function createAnswer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit,
  handler: (answer: RTCSessionDescriptionInit) => void,
) {
  console.log(offer);
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
  console.log("answer created: ", answer);
  await pc.setLocalDescription(answer);
  handler(answer);
}

async function setAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit,
) {
  try {
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
  } catch (error) {
    console.error("Error setting remote answer", answer);
    throw error;
  }
}

function createDataChannel(pc: RTCPeerConnection, handler: () => void) {
  const dataChannel = pc.createDataChannel("file-transfer");

  dataChannels.set(pc, dataChannel);

  dataChannel.onopen = () => {
    console.log("data channel is open now!");
    if (handler) handler();
  };

  dataChannel.onmessage = (event) => {
    console.log("received data in data channel: ", event.data);
  };
}

function listenForDataChannel(pc: RTCPeerConnection, handler: () => void) {
  pc.ondatachannel = (event) => {
    const channel = event.channel;
    channel.onopen = () => {
      console.log("data channel is open now!");
      handler();
    };
    channel.onmessage = (event) => {
      console.log("received: ", event.data);
    };
  };
}
