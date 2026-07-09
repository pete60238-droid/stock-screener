import { useState, useEffect } from "react";
import ScannerSection from "./ScannerSection";
import OptionXSection from "./OptionXSection";

export default function ScannerSwitcher() {
  const [mode, setMode] = useState("originx");

  useEffect(() => {
    const saved = localStorage.getItem("scannerMode");
    if (saved) setMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("scannerMode", mode);
  }, [mode]);

  const switchMode = () => setMode(mode === "originx" ? "optionx" : "originx");

  return (
    <>
      <div className="flex justify-between items-center px-3 pt-2 pb-1 border-b border-gray-800/40">
        <h1
          className={`text-[18px] font-extrabold ${
            mode === "originx" ? "text-emerald-400" : "text-pink-400"
          }`}
        >
          {mode === "originx"
            ? "🧠 OriginX — AI Stock Scanner"
            : "💹 OptionX — AI Option Scanner"}
        </h1>

        <button
          onClick={switchMode}
          className={`px-3 py-[6px] rounded-md text-sm font-bold border transition ${
            mode === "originx"
              ? "border-emerald-400 text-emerald-300 hover:bg-emerald-500/20"
              : "border-pink-400 text-pink-300 hover:bg-pink-500/20"
          }`}
        >
          {mode === "originx" ? "Switch → OptionX" : "Switch → OriginX"}
        </button>
      </div>

      {mode === "originx" ? <ScannerSection /> : <OptionXSection />}
    </>
  );
}
