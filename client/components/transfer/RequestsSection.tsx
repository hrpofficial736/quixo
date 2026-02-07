import FileTransferRequestComponent from "@/components/FileTransferRequestComponent";
import { FileTransferMetaDataRequestInterface } from "@/types/fileTransferInterfaces";

interface RequestsSectionProps {
  requests: FileTransferMetaDataRequestInterface[];
  onResponse: (res: boolean, id: string) => void;
}

export default function RequestsSection({
  requests,
  onResponse,
}: RequestsSectionProps) {
  return (
    <div className="flex flex-col gap-2 mt-10">
      <h1 className="font-semibold text-sm text-textTertiary">Requests</h1>
      {requests.length > 0 ? (
        <div className="f-c-col gap-2 w-full">
          {requests?.map((request, index) => {
            return (
              <FileTransferRequestComponent
                key={index}
                info={request}
                handler={onResponse}
              />
            );
          })}
        </div>
      ) : (
        <h1 className="text-xs w-full f-c-row mt-10 font-semibold text-textTertiary">
          No requests yet
        </h1>
      )}
    </div>
  );
}
