"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function DeviceNamePrompt({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState<string>("");

  return (
    <div className="f-c-col w-full py-7 px-4 mt-10 overflow-hidden">
      <h1 className="text-sm sm:text-lg font-semibold text-textTertiary">
        Give your device a display name
      </h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="sm:text-lg bg-white/5 text-textTertiary mt-3 max-w-full font-normal focus:outline-none rounded-full px-3 py-2"
        placeholder="E.g. Samsung S23"
      />
      <button
        onClick={() => {
          if (name.trim() == "") {
            toast.error("Please enter your device name first!");
            return;
          }
          onSubmit(name);
        }}
        className="px-7 py-3 active:scale-[0.98] transition-all bg-textSecondary mt-7 cursor-pointer rounded-full text-sm sm:text-lg font-semibold f-c-row mt-5"
      >
        Proceed
      </button>
    </div>
  );
}
