import { BsLightningChargeFill } from "react-icons/bs";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 bg-clip-text bg-linear-to-b from-textPrimary to-textPrimary/60 text-transparent font-bold">
      <BsLightningChargeFill className="text-textPrimary"/>
      <span className="text-xl font-semibold">Quixo</span>
    </div>
  );
}