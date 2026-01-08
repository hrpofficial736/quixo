import { create } from "zustand";

export type UserStore = {
  id: string;
  pairingId: string;
  deviceName: string;
  otherDeviceName: string;
  status: "WAITING" | "CONNECTED" | "OFFLINE";
  setUser: (info: Partial<UserStore>) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  id: "",
  pairingId: "",
  deviceName: "",
  otherDeviceName: "",
  status: "OFFLINE",
  setUser: (info) =>
    set((state) => ({
      ...state,
      ...info,
    })),
}));
