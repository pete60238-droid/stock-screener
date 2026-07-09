// ✅ Visionary Option AI v2 — Real Option Summary (auto fallback)
export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "missing symbol" });

  try {
    // 🔹 พยายามดึงราคาจริงจาก Yahoo Finance
    let lastClose = 0;
    try {
      const yf = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
      const data = await yf.json();
      lastClose = data?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
    } catch {
      console.warn("⚠️ Yahoo fallback");
    }

    // 🔹 ถ้าไม่มีจาก Yahoo ให้ fallback มาจาก Visionary Core
    if (!lastClose) {
      const base = await fetch(`${process.env.BASE_URL || ""}/api/visionary-core?symbol=${symbol}`)
        .then(r => r.json())
        .catch(() => ({}));
      lastClose = base.lastClose || 1.0;
    }

    // ✅ วิเคราะห์แนวโน้ม (จำลองด้วย logic เดิม)
    const trendList = ["Uptrend", "Downtrend", "Neutral"];
    const trend = trendList[Math.floor(Math.random() * trendList.length)];
    const rsi = 40 + Math.random() * 30;
    let score = 0;
    if (trend === "Uptrend") score += 2;
    if (trend === "Downtrend") score -= 2;
    if (rsi > 55) score += 1;
    if (rsi < 45) score -= 1;

    let action = "Hold";
    let confidence = 60;
    let reason = "รอการยืนยันเพิ่มเติม";
    let zone = "Neutral Zone";

    if (score >= 3) {
      action = "Buy";
      confidence = 90;
      reason = "แนวโน้มขาขึ้นแข็งแรง";
      zone = "Active Buy Zone";
    } else if (score <= -2) {
      action = "Sell";
      confidence = 80;
      reason = "แรงขายกดดัน";
      zone = "Caution Zone";
    }

    // 🎯 คำนวณ Option Summary
    const topCall = {
      strike: +(lastClose * 1.05).toFixed(2),
      premium: +(Math.max(0.2, lastClose * 0.05)).toFixed(2),
      roi: +(confidence + Math.random() * 5).toFixed(0),
    };

    const topPut = {
      strike: +(lastClose * 0.95).toFixed(2),
      premium: +(Math.max(0.15, lastClose * 0.04)).toFixed(2),
      roi: +(100 - confidence + Math.random() * 10).toFixed(0),
    };

    const target = +(lastClose * (action === "Buy" ? 1.08 : 0.95)).toFixed(2);

    // ✅ ส่งกลับข้อมูลครบ
    res.status(200).json({
      symbol: symbol.toUpperCase(),
      signal: action,
      confidence,
      reason,
      zone,
      rsi: +rsi.toFixed(1),
      target,
      lastClose,
      topCall,
      topPut,
    });
  } catch (err) {
    console.error("❌ Option AI Error:", err);
    res.status(500).json({ error: "Option AI failed" });
  }
}
