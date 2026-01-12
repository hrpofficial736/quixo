import toast from "react-hot-toast";
import { create } from "zustand";
import { useUserStore } from "./useUserStore";

export const useConnectionStatusStore = create<{
  status: "CONNECTED" | "DISCONNECTED";
  setStatus: (status: "CONNECTED" | "DISCONNECTED") => void;
}>((set) => ({
  status: "DISCONNECTED",
  setStatus: (status) =>
    set(() => {
      if (status !== "CONNECTED") {
        toast.success(
          "Your device is connected with " +
            useUserStore.getState().otherDeviceName,
        );
      }
      return { status };
    }),
}));
