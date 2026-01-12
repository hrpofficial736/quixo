import { create } from "zustand";

type WebRTCConnectionStoreProps = {
  pc: RTCPeerConnection | null;
  setPC: (pc: RTCPeerConnection | null) => void;
  datachannel: RTCDataChannel | null;
  setDataChannel: (dc: RTCDataChannel | null) => void;
  closePC: () => void;
};

export const useWebRTCConnectionStore = create<WebRTCConnectionStoreProps>(
  (set, get) => ({
    pc: null,
    setPC: (pc) => set({ pc }),
    datachannel: null,
    setDataChannel: (dc) => {
      set({ datachannel: dc });
    },
    closePC: () => {
      const pc = get().pc;
      pc?.close();
      set({ pc: null });
    },
  }),
);
