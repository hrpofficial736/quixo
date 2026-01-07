import Window from "@/components/Window";

export default function TransferWindow({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <>{isOpen && <div></div>}</>;
}
