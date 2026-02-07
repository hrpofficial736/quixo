import { useAppSocket } from "@/context/SocketContext";
import socketManager from "@/services/socketManager";
import { useUserStore } from "@/stores/useUserStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";

export default function ConnectedDevicesSection() {
  const { emitEvent } = socketManager();
  const socket = useAppSocket();
  const {
    controlDatachannel,
    setFileDataChannels,
    closePC,
  } = useWebRTCConnectionStore();

  return (
    <div className="flex flex-col gap-4 w-full">
      <h1 className="font-semibold text-sm text-textTertiary">
        Connected Devices
      </h1>
      <div className="flex justify-between items-center bg-bgTertiary/10 rounded-xl w-full p-4">
        <div className="text-textTertiary text-sm font-semibold">
          {useUserStore.getState().otherDeviceName}
        </div>

        <button
          onClick={() => {
            useWebRTCConnectionStore
              .getState()
              .fileDatachannels.forEach((channel) => channel.close());
            setFileDataChannels(null);
            controlDatachannel?.close();
            closePC();
            emitEvent(socket!, "delete_room", {
              pairingId: useUserStore.getState().pairingId,
            });
          }}
          className="bg-linear-to-b from-error to-error/50 text-textPrimary rounded-lg text-sm px-3 py-2 font-semibold cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
