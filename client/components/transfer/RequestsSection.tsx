import FileTransferRequestComponent from "@/components/FileTransferRequestComponent";
import { FileTransferMetaDataRequestInterface } from "@/types/fileTransferInterfaces";
import { LuInbox } from "react-icons/lu";

export default function RequestsSection({
  requests,
  onResponse,
}: {
  requests: FileTransferMetaDataRequestInterface[];
  onResponse: (res: boolean, id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-textTertiary uppercase tracking-wider">
        Incoming Requests
      </h2>
      {requests.length === 0 ? (
        <div className="glass py-8 flex flex-col items-center gap-2">
          <LuInbox className="text-2xl text-textTertiary" />
          <p className="text-xs text-textTertiary">No incoming requests</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((request) => (
            <FileTransferRequestComponent
              key={request.id}
              fileInfo={request}
              onResponse={onResponse}
            />
          ))}
        </div>
      )}
    </div>
  );
}
