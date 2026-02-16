import { create } from "zustand";

type WebRTCConnectionStoreProps = {
  pc: RTCPeerConnection | null;
  setPC: (pc: RTCPeerConnection | null) => void;
  controlDatachannel: RTCDataChannel | null;
  setControlDataChannel: (dc: RTCDataChannel | null) => void;
  fileDatachannels: RTCDataChannel[];
  setFileDataChannels: (dc: RTCDataChannel | null) => void;
  closeFileDataChannel: (label: string) => void;
  closePC: () => void;
};

export const useWebRTCConnectionStore = create<WebRTCConnectionStoreProps>(
  (set, get) => ({
    pc: null,
    setPC: (pc) => set({ pc }),
    controlDatachannel: null,
    setControlDataChannel: (dc) => {
      set({ controlDatachannel: dc });
    },
    closePC: () => {
      const pc = get().pc;
      pc?.close();
      set({ pc: null });
    },
    fileDatachannels: [],
    setFileDataChannels: (dc) => {
      const existingChannels = get().fileDatachannels || [];
      if (!dc) return;
      // Prevent duplicate entries for the same channel
      if (existingChannels.some((ch) => ch.label === dc.label)) return;
      set({ fileDatachannels: [...existingChannels, dc] });
    },
    closeFileDataChannel: (label) => {
      const fileDatachannels = get().fileDatachannels;
      const updatedChannels = fileDatachannels.filter(
        (channel) => channel.label !== label,
      );
      set({ fileDatachannels: updatedChannels });
    },
  }),
);
