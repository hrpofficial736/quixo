/**
 * Returns a descriptive file type label and a color class based on mime type.
 */
export function getFileTypeInfo(mime: string): { label: string; color: string } {
  if (mime.startsWith("image/")) return { label: "Image", color: "text-purple-400" };
  if (mime.startsWith("video/")) return { label: "Video", color: "text-blue-400" };
  if (mime.startsWith("audio/")) return { label: "Audio", color: "text-pink-400" };
  if (mime.includes("pdf")) return { label: "PDF", color: "text-red-400" };
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar") || mime.includes("gzip"))
    return { label: "Archive", color: "text-yellow-400" };
  if (mime.includes("text") || mime.includes("document") || mime.includes("word"))
    return { label: "Document", color: "text-cyan-400" };
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv"))
    return { label: "Spreadsheet", color: "text-green-400" };
  return { label: "File", color: "text-zinc-400" };
}
