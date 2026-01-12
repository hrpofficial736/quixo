import { FileTransferMetaDataRequestInterface } from "@/types/fileTransferInterfaces";
import { create } from "zustand";

type FileTransferStore = {
  progress: number;
  setProgress: (newProgress: number) => void;
  fileMetadata: FileTransferMetaDataRequestInterface | null;
  setFileMetadata: (data: FileTransferMetaDataRequestInterface) => void;
};

export const useFileTransferStore = create<FileTransferStore>((set) => ({
  progress: 0,
  fileMetadata: null,
  setProgress: (newProgress) => {
    set({ progress: newProgress });
  },
  setFileMetadata: (data) => {
    set({ fileMetadata: data });
  },
}));
