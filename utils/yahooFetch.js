// ✅ /utils/yahooFetch.js — Shared Yahoo Finance fetch helper
//
// ✅ แก้บั๊ก "ดึงข้อมูลช้า/ไม่สมบูรณ์": ทุกไฟล์ที่ยิง fetch ไปยัง Yahoo Finance
//   (visionary-core.js, visionary-infinite-core.js, visionary-batch.js, ฯลฯ)
//   เดิมไม่ได้ตั้งค่า header อะไรเลย ใช้ fetch เปล่าๆ ตรงๆ
//   Node fetch แบบไม่มี User-Agent มักโดน Yahoo บล็อก/จำกัด (rate-limit) บ่อยกว่าปกติมาก
//   โดยเฉพาะเวลายิงพร้อมกันหลายสิบ request ต่อวินาที (เช่นหน้า Scanner ที่ยิง 20 ตัวพร้อมกัน)
//   เมื่อโดนบล็อก จะได้ response ว่าง/error กลับมา → โค้ดฝั่งเราตกไปใช้ค่า default
//   (ราคา 0 → แสดง "-", RSI default 50, signal default Hold) ตรงกับอาการที่เจอในแอปจริง
//
// ✅ ทางแก้: ใส่ User-Agent แบบเบราว์เซอร์จริง + timeout กันค้าง + retry 1 ครั้งถ้าพลาด
//   ให้ทุก endpoint เรียกผ่านฟังก์ชันนี้แทน fetch ตรงๆ

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

export async function fetchYahoo(url, { timeoutMs = 8000, retries = 1 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetch(url, { headers: BROWSER_HEADERS, signal: controller.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      clearTimeout(timer);
      if (attempt === retries) throw e;
      // ✅ รอสั้นๆ ก่อน retry รอบสุดท้าย กัน request ชนกันซ้ำทันที
      await new Promise((res) => setTimeout(res, 250));
    }
  }
}
