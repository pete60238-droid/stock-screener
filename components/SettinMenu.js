import { useState, useEffect } from "react";

export default function SettinMenu() {
const [theme, setTheme] = useState("dark");
const [autoScan, setAutoScan] = useState(false);

useEffect(() => {
const savedTheme = localStorage.getItem("theme") || "dark";
const savedAuto = localStorage.getItem("autoScan") === "true";
setTheme(savedTheme);
setAutoScan(savedAuto);
}, []);

const toggleTheme = (val) => {
setTheme(val);
localStorage.setItem("theme", val);
};

const toggleAutoScan = () => {
const val = !autoScan;
setAutoScan(val);
localStorage.setItem("autoScan", val);
};

const resetData = () => {
localStorage.clear();
window.location.reload();
};

const logout = () => {
localStorage.removeItem("logged");
localStorage.removeItem("username");
window.location.reload();
};

return (
<div className="min-h-screen bg-[#0b1220] text-white px-6 py-10">

<h1 className="text-[20px] font-semibold mb-8 text-emerald-400 flex items-center gap-2">  
    ⚙️ OriginX Settings  
  </h1>  

  {/* Theme */}  
  <div className="mb-6">  
    <label className="block text-gray-300 text-sm mb-2">Interface Theme</label>  
    <select  
      value={theme}  
      onChange={(e) => toggleTheme(e.target.value)}  
      className="bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-sm w-full"  
    >  
      <option value="dark">Dark</option>  
      <option value="light">Light</option>  
    </select>  
  </div>  

  {/* Auto Scan */}  
  <div className="mb-6 flex justify-between items-center">  
    <span className="text-gray-300 text-sm">Auto Scan on Load</span>  
    <button  
      onClick={toggleAutoScan}  
      className={`px-4 py-1 rounded-xl text-sm border border-white/10 ${  
        autoScan ? "bg-emerald-500 text-black" : "bg-[#111827] text-gray-400"  
      }`}  
    >  
      {autoScan ? "ON" : "OFF"}  
    </button>  
  </div>  

  {/* Reset */}  
  <button  
    onClick={resetData}  
    className="w-full bg-red-500/90 hover:bg-red-600 transition-all py-3 rounded-xl text-white font-semibold mb-10"  
  >  
    Reset All Data  
  </button>  

  {/* Logout */}  
  <button  
    onClick={logout}  
    className="w-full border border-red-400 text-red-400 hover:bg-red-500 hover:text-white transition-all py-3 rounded-xl font-semibold"  
  >  
    Logout  
  </button>  

</div>

);
}
