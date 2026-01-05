"use client";

import { useState } from "react";

export default function DeviceNamePrompt({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState<string>("");

  return (
    <div className="f-c-col w-full h-full gap-5">
      <h1 className="text-lg font-semibold text-textSecondary">
        Enter a name for your device to be displayed
      </h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-lg bg-white/5 text-textTertiary font-normal focus:outline-none rounded-2xl px-3 py-2"
        placeholder="E.g. Samsung S23"
      />
      <button
        onClick={() => {
          if (name.trim() == "") {
            alert("Please enter a device name first!");
            return;
          }
          onSubmit(name);
        }}
        className="px-4 py-3 bg-textSecondary cursor-pointer rounded-2xl text-lg font-semibold f-c-row"
      >
        Next
      </button>
    </div>
  );
}
