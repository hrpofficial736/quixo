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
        <div>
          <h1>Transfer window</h1>
        </div>
      )}
    </>
  );
}
