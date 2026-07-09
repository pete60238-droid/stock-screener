// ✅ components/VipPae.js
import { useState } from "react";

export default function VipPae({ onVIP }) {
  const [code, setCode] = useState("");

  // ✅ รหัส VIP ที่คุณจะเป็นคนบอกลูกค้า
  const realCode = "P254303";

  const verify = () => {
    if (code.trim() === realCode) {
      localStorage.setItem("vip", "yes"); // ✅ ตัวนี้สำคัญสุด!
      onVIP(); // ✅ เด้งเข้าหน้าแอป
    } else {
      alert("❌ รหัสผิด");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center px-8 text-white">

      <h1 className="text-2xl font-extrabold mb-6">VIP ACCESS</h1>

      <input
        placeholder="Enter VIP Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full max-w-sm bg-[#111827] border border-white/10 px-4 py-3 rounded-xl outline-none mb-6 text-center"
      />

      <button
        onClick={verify}
        className="w-full max-w-sm bg-emerald-400 hover:bg-emerald-300 transition-all py-3 rounded-xl font-bold text-black"
      >
        Confirm
      </button>

    </div>
  );
}
