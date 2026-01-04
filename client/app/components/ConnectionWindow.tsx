import Window from "@/components/Window";
import QRCode from "react-qr-code";

export default function ConnectionWindow({
  isOpen,
  onTrigger,
}: {
  isOpen: boolean;
  onTrigger: () => void;
}) {
  return (
    <>
      {isOpen && (
        <Window
          onClose={onTrigger}
          header="Connect"
          extraClass="w-[80%] h-[600px]"
        >
          <div className="flex justify-between mt-10 w-full h-[80%]">
            {/*QR and code display*/}
            <div className="f-c-col gap-5 p-4">
              <h1 className="text-textTertiary text-lg font-semibold">
                Scan this QR code
              </h1>
              <QRCode
                value="Harshit"
                className="p-4 w-fit bg-white rounded-[20px]"
              />

              <div className="text-bgTertiary">or</div>

              <h1 className="text-textTertiary text-[14px] font-semibold">
                Enter this code manually in other device
              </h1>
              <div className="text-3xl font-bold text-textSecondary tracking-widest">
                736786
              </div>
            </div>

            <div className="h-full w-0.5 bg-white/5" />

            <div className="f-c-col gap-5 p-4">
              <h1 className="text-textTertiary text-lg font-semibold">
                Enter a code
              </h1>
              <input
                type="text"
                className="bg-white/5 rounded-[15px] focus:outline-none p-3 text-textPrimary"
                placeholder="Enter the code"
              />
            </div>
          </div>
        </Window>
      )}
    </>
  );
}
