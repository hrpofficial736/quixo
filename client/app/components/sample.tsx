// import FileTransferProgressComponent from "@/components/FileTransferProgressComponent";
// import FileTransferRequestComponent from "@/components/FileTransferRequestComponent";
// import Window from "@/components/Window";
// import { useAppSocket } from "@/context/SocketContext";
// import useHandleFileTransfer from "@/hooks/useHandleFileTransfer";
// import socketManager from "@/services/socketManager";
// import { useFileTransferStore } from "@/stores/useFileTransferStore";
// import { useUserStore } from "@/stores/useUserStore";
// import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";
// import {
//   FileTransferMetaDataRequestInterface,
//   TransferInterface,
// } from "@/types/fileTransferInterfaces";
// import { useEffect, useRef, useState } from "react";
// import toast from "react-hot-toast";
// import { IoIosSend } from "react-icons/io";

// export default function TransferWindow({
//   isOpen,
//   onClose,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
// }) {
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const { emitEvent } = socketManager();
//   const socket = useAppSocket();
//   const { datachannel, closePC } = useWebRTCConnectionStore();
//   const [requests, setRequests] = useState<
//     FileTransferMetaDataRequestInterface[]
//   >([]);
//   const { sendFile, sendExtraInfo, listenForExtraInfo, listenForFile } =
//     useHandleFileTransfer();

//   const filesRef = useRef<Map<string, File> | null>(null);

//   const [transfers, setTransfers] = useState<TransferInterface[]>([]);

//   const transferQueue = useRef<TransferInterface[]>([]);
//   const activeTransferId = useRef<string | null>(null);

//   const handleResponse = (res: boolean, id: string) => {
//     sendExtraInfo(datachannel!, {
//       name: "METADATA-ACK",
//       id,
//       res: res ? "ACC" : "REJ",
//     });
//     console.log(requests);
//     setRequests((prev) => {
//       console.log(prev.filter((request) => request.id !== id));
//       return prev.filter((request) => request.id !== id);
//     });
//     if (res) {
//       const fileInfo = requests.filter((request) => request.id === id)[0];
//       useFileTransferStore.getState().setFileMetadata(fileInfo);
//       transferQueue.current.push({ fileInfo });
//     }
//   };

//   const handleFileChange = () => {
//     if (!fileInputRef.current || !fileInputRef.current.files) return;
//     console.log(fileInputRef.current.files);
//     for (const file of fileInputRef.current.files) {
//       const fileInfo = {
//         name: "META",
//         id: crypto.randomUUID(),
//         fileName: file.name,
//         size: file.size,
//         mime: file.type,
//         chunkSize: 16384,
//       };

//       if (!filesRef.current) {
//         filesRef.current = new Map();
//       }
//       filesRef.current.set(fileInfo.id, file);
//       console.log("file info going in META is: ", fileInfo);
//       setTransfers((prev) => [
//         ...prev,
//         {
//           id: fileInfo.id,
//           name: fileInfo.fileName,
//           size: fileInfo.size,
//           chunkSize: fileInfo.chunkSize,
//           mime: fileInfo.mime,
//           current: "STOP",
//         },
//       ]);
//       console.log(transfers);
//       sendExtraInfo(datachannel!, fileInfo);
//     }
//   };

//   // Event for listening file metadata on receiver end
//   useEffect(() => {
//     const cleanup = listenForExtraInfo(datachannel!, "META", (info) => {
//       console.log("info coming in META is: ", info);
//       const data = info as FileTransferMetaDataRequestInterface;
//       console.log(info, data);
//       if (requests.length === 0) {
//         setRequests((prev) => [
//           ...prev,
//           {
//             id: data.id,
//             name: data.name,
//             size: data.size,
//             chunkSize: 16384,
//             mime: data.mime,
//           },
//         ]);
//       }
//     });
//     console.log(requests);
//     return cleanup;
//   }, [datachannel, requests]);

//   useEffect(() => {
//     const initiateNextTransfer = () => {
//       for (const transfer of transfers) {
//         if (transfer.current === "WAIT") {
//           transfer.current = "START";
//           break;
//         }
//       }
//     };

//     if (!isCurrentTransferring) initiateNextTransfer();
//   }, [transfers]);

//   // Event for listening file metadata acknowledgement on sender end
//   useEffect(() => {
//     const cleanup = listenForExtraInfo(datachannel!, "METADATA-ACK", (data) => {
//       console.log(data);
//       if (!data || !("res" in data) || !data.id) return;
//       if (!filesRef.current || transfers.length === 0) return;
//       const file = filesRef.current.get(data.id);
//       if (!file) return;
//       console.log("data coming in METADATA-ACK response is: ", data);
//       if (!datachannel) return;
//       if (data.res) {
//         console.log("yes response is true for this file!");
//         console.log(transfers);
//         const fileMetadata = transfers.filter(
//           (transfer) => transfer.id === data.id,
//         )[0];
//         console.log("target file metadata is: ", fileMetadata);
//         sendFile(datachannel, file, () => {
//           setTransfers((prev) =>
//             prev.filter((transfer) => transfer.id !== data.id),
//           );
//           isCurrentTransferring = false;
//         });
//         const fileInfo = {
//           id: fileMetadata.id,
//           name: fileMetadata.name as string,
//           size: fileMetadata.size as number,
//           mime: fileMetadata.mime as string,
//           chunkSize: 16384,
//         };
//         useFileTransferStore.getState().setFileMetadata(fileInfo);
//         setTransfers((prev) => {
//           prev.map((transfer) => {
//             if (transfer.id === data.id) {
//               if (!isCurrentTransferring) {
//                 transfer.current = "START";
//                 isCurrentTransferring = true;
//               } else {
//                 transfer.current = "WAIT";
//               }
//             }
//           });
//           console.log("transfers now are: ", prev);
//           return prev;
//         });
//       } else {
//         setTransfers((prev) => {
//           return prev.filter((transfer) => transfer.id !== data.id);
//         });
//         toast.error("File transfer request rejected by the receiver!");
//       }
//     });
//     return cleanup;
//   }, [datachannel, transfers]);

//   // Event for listening completion of file transfer on receiver end
//   useEffect(() => {
//     const cleanup = listenForExtraInfo(datachannel!, "FILE_SENT", (data) => {
//       if (!data) return;
//       if (!("res" in data)) return;
//       console.log("inside file transfer completion listener!");

//       if (data.res) {
//         toast.success("File received successfully!");
//         setTransfers((prev) =>
//           prev.filter((transfer) => transfer.id !== data.id),
//         );
//       } else {
//         toast.error("Error sending full file!");
//       }
//     });
//     return cleanup;
//   }, [datachannel]);

//   useEffect(() => {
//     if (!datachannel) return;
//     const cleanup = listenForFile(datachannel);
//     return cleanup;
//   }, [datachannel]);

//   return (
//     <div className="w-full h-full">
//       {isOpen && (
//         <Window
//           header="File Transfer"
//           extraClass="w-full h-full"
//           onClose={onClose}
//         >
//           <div className="text-textSecondary w-full h-[90%] mt-10 flex flex-col gap-2 overflow-y-scroll">
//             {/*Connected Devices*/}
//             <div className="flex flex-col gap-4 w-full">
//               <h1 className="font-semibold text-sm text-textTertiary">
//                 Connected Devices
//               </h1>
//               <div className="flex justify-between items-center bg-bgTertiary/10 rounded-xl w-full p-4">
//                 <div className="text-textTertiary text-sm font-semibold">
//                   {useUserStore.getState().otherDeviceName}
//                 </div>

//                 <button
//                   onClick={() => {
//                     datachannel?.close();
//                     closePC();
//                     emitEvent(socket!, "delete_room", {
//                       pairingId: useUserStore.getState().pairingId,
//                     });
//                   }}
//                   className="bg-linear-to-b from-error to-error/50 text-textPrimary rounded-lg text-sm px-3 py-2 font-semibold cursor-pointer"
//                 >
//                   Disconnect
//                 </button>
//               </div>
//             </div>

//             {/*Send Files*/}
//             <div className="flex flex-col gap-2 mt-10">
//               <div className="flex justify-between items-center">
//                 <h1 className="font-semibold text-sm text-textTertiary">
//                   Send Files
//                 </h1>
//                 <button
//                   onClick={() => {
//                     fileInputRef.current?.click();
//                   }}
//                   className="rounded-md px-2 py-1 text-sm f-c-row gap-2 max-w-60 bg-linear-to-b from-textSecondary to-textSecondary/80 text-bgSecondary font-semibold cursor-pointer"
//                 >
//                   <IoIosSend />
//                   Send Files
//                 </button>
//               </div>
//               <input
//                 ref={fileInputRef}
//                 className="hidden"
//                 type="file"
//                 multiple
//                 onChange={handleFileChange}
//               />
//               {transfers.map((transfer, index) => {
//                 return (
//                   <FileTransferProgressComponent
//                     key={index}
//                     fileInfo={transfer}
//                   />
//                 );
//               })}
//               <h1 className="text-xs w-full f-c-row mt-10 font-semibold text-textTertiary">
//                 No ongoing transfers
//               </h1>
//             </div>

//             {/*Transfer Requests*/}
//             <div className="flex flex-col gap-2 mt-10">
//               <h1 className="font-semibold text-sm text-textTertiary">
//                 Requests
//               </h1>
//               {requests.length > 0 ? (
//                 <div className="f-c-col gap-2 w-full">
//                   {requests?.map((request, index) => {
//                     return (
//                       <FileTransferRequestComponent
//                         key={index}
//                         info={request}
//                         handler={handleResponse}
//                       />
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <h1 className="text-xs w-full f-c-row mt-10 font-semibold text-textTertiary">
//                   No requests yet
//                 </h1>
//               )}
//             </div>
//           </div>
//         </Window>
//       )}
//     </div>
//   );
// }
