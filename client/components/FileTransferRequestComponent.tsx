import { setFileSize } from "@/lib/fileSize";
import { FileTransferMetaDataRequestInterface } from "@/types/fileTransferInterfaces";
import { FaFile } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { MdDone } from "react-icons/md";

export default function FileTransferRequestComponent({
  info,
  handler,
}: {
  info: FileTransferMetaDataRequestInterface;
  handler: (accepted: boolean) => void;
}) {
  return (
    <div
      className="bg-bgTertiary/10 rounded-xl w-full p-3 sm:p-4
                    flex flex-col sm:flex-row
                    gap-4 sm:gap-0
                    sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3 min-w-0">
        <FaFile className="text-textSecondary text-2xl sm:text-3xl shrink-0" />

        <div className="flex flex-col gap-1 min-w-0">
          <div
            className="text-xs sm:text-sm font-semibold text-textSecondary
                       break-all sm:break-words
                       truncate sm:truncate-none
                       max-w-[220px] sm:max-w-[320px] md:max-w-[420px]"
            title={info.name}
          >
            {info.name}
          </div>

          <div className="text-[10px] sm:text-xs text-textTertiary font-light">
            {setFileSize(info.size)}
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
        <button
          onClick={() => handler(true)}
          className="flex-1 sm:flex-none
                     bg-bgTertiary/10
                     text-success/80 font-semibold
                     text-xs sm:text-sm
                     px-3 py-2 rounded-md
                     cursor-pointer
                     flex items-center justify-center gap-1
                     active:scale-95 transition"
        >
          <MdDone className="text-success text-sm" />
          Accept
        </button>

        <button
          onClick={() => handler(false)}
          className="flex-1 sm:flex-none
                     bg-bgTertiary/10
                     text-error font-semibold
                     text-xs sm:text-sm
                     px-3 py-2 rounded-md
                     cursor-pointer
                     flex items-center justify-center gap-1
                     active:scale-95 transition"
        >
          <IoClose className="text-error text-sm" />
          Reject
        </button>
      </div>
    </div>
  );
}
