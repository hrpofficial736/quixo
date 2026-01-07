export default function rtcManager() {
  return {
    createNewRTCPeerConnection,
    listenForICECandidates,
    addIceCandidate,
    createOffer,
    createAnswer,
    setAnswer,
    createDataChannel,
  };
}

function createNewRTCPeerConnection() {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: process.env.NEXT_PUBLIC_GOOGLE_ICE_SERVER_URL! }],
  });
  pc.onconnectionstatechange = () => {
    console.log("connection state changed: ", pc.connectionState);
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
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
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
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  handler(answer);
}

async function setAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit,
) {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

function createDataChannel(pc: RTCPeerConnection) {
  const dataChannel = pc.createDataChannel("file-transfer");

  dataChannel.onopen = () => {
    console.log("data channel is open now!");
  };

  dataChannel.onmessage = (event) => {
    console.log("received data in data channel: ", event.data);
  };
}
