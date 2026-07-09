import { useState } from "react";

export default function Reister({ goVip }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // ✅ สมัครสมาชิกใหม่
  const register = () => {
    if (!user.trim() || !pass.trim()) return;

    let accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

    // เช็คว่ามี username นี้แล้วหรือไม่
    if (accounts.find((acc) => acc.username === user)) {
      alert("⚠️ ชื่อนี้ถูกใช้แล้ว");
      return;
    }

    // ✅ บันทึกเพิ่มเข้า list
    accounts.push({ username: user, password: pass });
    localStorage.setItem("accounts", JSON.stringify(accounts));

    // ✅ ตั้งค่า account ที่ใช้งานอยู่ตอนนี้
    localStorage.setItem("account", JSON.stringify({ username: user }));
    localStorage.setItem("vip", ""); // ยังไม่ VIP

    goVip(); // → ไปหน้า VIP Code
  };

  // ✅ ล็อกอิน
  const login = () => {
    let accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

    const found = accounts.find(
      (acc) => acc.username === loginUser && acc.password === loginPass
    );

    if (!found) {
      alert("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    // ✅ ตั้งค่าผู้ใช้ที่กำลังใช้งาน
    localStorage.setItem("account", JSON.stringify({ username: found.username }));

    // ถ้าคนนี้เคย VIP แล้ว → เข้าหน้า APP ทันที
    if (localStorage.getItem("vip") === "yes") {
      window.location.reload();
    } else {
      goVip();
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col justify-center items-center text-white px-8">

      <h1 className="text-2xl font-bold mb-6">Create Account</h1>

      <input
        placeholder="Username"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        className="bg-[#111827] w-full border border-white/10 px-4 py-2 rounded-xl mb-3"
      />

      <input
        type="password"
        placeholder="Password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        className="bg-[#111827] w-full border border-white/10 px-4 py-2 rounded-xl mb-6"
      />

      <button
        onClick={register}
        className="w-full bg-emerald-500 py-3 rounded-xl font-semibold"
      >
        Register →
      </button>

      <button
        onClick={() => setShowLogin(true)}
        className="mt-6 text-emerald-300 text-sm"
      >
        Already have an account? Login
      </button>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center px-8">
          <div className="bg-[#111827] p-6 rounded-xl w-full max-w-sm">

            <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

            <input
              placeholder="Username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="w-full bg-[#0d1320] px-4 py-2 rounded-xl border border-white/10 mb-4"
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full bg-[#0d1320] px-4 py-2 rounded-xl border border-white/10 mb-6"
            />

            <button
              onClick={login}
              className="w-full bg-emerald-400 py-3 rounded-xl font-bold text-black"
            >
              Login →
            </button>

            <button
              onClick={() => setShowLogin(false)}
              className="text-gray-300 mt-4 w-full text-center text-sm"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </div>
  );
          }
