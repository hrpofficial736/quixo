import { poppins } from "@/app/fonts";
import { AiOutlineLoading } from "react-icons/ai";

export default function LoadingPage() {
  return (
    <div
      className={`w-screen h-screen bg-bgPrimary f-c-row text-textSecondary gap-3 text-xl ${poppins.className}`}
    >
      <AiOutlineLoading className="animate-spin" />
      Loading...
    </div>
  );
}
