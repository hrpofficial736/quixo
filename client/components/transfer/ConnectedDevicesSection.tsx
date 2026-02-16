import socketManager from "@/services/socketManager";
import { useUserStore } from "@/stores/useUserStore";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
import { useAppSocket } from "@/context/SocketContext";

export default function ConnectedDevicesSection() {
  const { emitEvent } = socketManager();
  const socket = useAppSocket();
  const { controlDatachannel, setFileDataChannels, closePC } =
    useWebRTCConnectionStore();

  return (
    <div className="flex items-center gap-3">
      {/* Peer info */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="text-sm text-textPrimary font-medium">
          {useUserStore.getState().otherDeviceName}
        </span>
        <span className="text-xs text-textTertiary">•</span>
        <span className="text-xs text-textTertiary font-medium">Connected</span>
      </div>

      {/* Disconnect */}
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
        className="text-xs text-error/80 hover:text-error font-medium px-2 py-1 rounded-md hover:bg-error/10 transition-all cursor-pointer"
      >
        Disconnect
      </button>
    </div>
  );
}
