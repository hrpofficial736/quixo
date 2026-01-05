import { IoClose } from "react-icons/io5";

export default function Window({
  children,
  extraClass,
  header,
  onClose,
}: {
  children: React.ReactNode;
  extraClass: string;
  header: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`bg-bgSecondary rounded-2xl px-5 py-3 max-w-200 ${extraClass} z-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="text-2xl text-textTertiary font-semibold">{header}</div>

        <div
          onClick={onClose}
          className="p-1 cursor-pointer rounded-full text-textPrimary bg-error"
        >
          <IoClose />
        </div>
      </div>
      {children}
    </div>
  );
}
