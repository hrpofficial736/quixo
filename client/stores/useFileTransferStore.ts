import { FileTransferMetaDataRequestInterface, TransferInterface } from "@/types/fileTransferInterfaces";
import { create } from "zustand";



interface FileState {
  id: string;
  meta: FileTransferMetaDataRequestInterface;
  progress: number;
  status: TransferInterface["current"];
  offset: number;
  error?: string;
}

interface FileTransferStore {
  files: Map<string, FileState>;
  
  // Actions
  addFile: (meta: FileTransferMetaDataRequestInterface) => void;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: TransferInterface["current"]) => void;
  setOffset: (id: string, offset: number) => void;
  removeFile: (id: string) => void;
  reset: () => void;
}

export const useFileTransferStore = create<FileTransferStore>((set) => ({
  files: new Map(),

  addFile: (meta) => set((state) => {
    if (!meta.id) return {};
    const newFiles = new Map(state.files);
    // Only add if not exists, or overwrite? Overwrite is safer for restarts.
    newFiles.set(meta.id, {
        id: meta.id,
        meta,
        progress: 0,
        status: "IN_PROGRESS", 
        offset: 0
    });
    return { files: newFiles };
  }),

  updateProgress: (id, progress) => set((state) => {
    const file = state.files.get(id);
    if (!file) return {}; // No-op if file doesn't exist
    
    // Optimization: Don't create new Map if progress hasn't changed significantly? 
    // React might need strict equality check on Map though. 
    // For now, simple immutable update.
    const newFiles = new Map(state.files);
    newFiles.set(id, { ...file, progress });
    return { files: newFiles };
  }),

  updateStatus: (id, status) => set((state) => {
    const file = state.files.get(id);
    if (!file) return {};
    const newFiles = new Map(state.files);
    newFiles.set(id, { ...file, status });
    return { files: newFiles };
  }),

  setOffset: (id, offset) => set((state) => {
    const file = state.files.get(id);
    if (!file) return {};
    const newFiles = new Map(state.files);
    newFiles.set(id, { ...file, offset });
    return { files: newFiles };
  }),

  removeFile: (id) => set((state) => {
    const newFiles = new Map(state.files);
    newFiles.delete(id);
    return { files: newFiles };
  }),

  reset: () => set({ files: new Map() })
}));
