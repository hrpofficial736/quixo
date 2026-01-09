import Window from "@/components/Window";

export default function TransferWindow({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {isOpen && (
        <Window
          header="File Transfer"
          extraClass="w-[80%] h-[600px]"
          onClose={onClose}
        >
          <div className="text-textSecondary w-full h-[90%] f-c-row">
            Upload files
          </div>
        </Window>
      )}
    </>
  );
}
