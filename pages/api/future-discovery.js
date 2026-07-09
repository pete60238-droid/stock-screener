// ✅ /pages/api/future-discovery.js — Future Stock Analysis (สำหรับหน้า Analyze)
export default async function handler(req, res) {
  const { symbol = "NVDA" } = req.query;
  const s = symbol.toUpperCase();

  try {
    // ดึงข้อมูล 6 เดือนจาก Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s}?range=6mo&interval=1d`;
    const data = await fetch(url).then(r => r.json());
    const chart = data.chart?.result?.[0];
    if (!chart) throw new Error("Symbol not found");

    const quote = chart.indicators?.quote?.[0];
    const closes = quote.close.filter(x => typeof x === "number" && x > 0);
    const volumes = quote.volume.filter(x => typeof x === "number" && x > 0);

    if (closes.length < 20) throw new Error("Insufficient data");

    // Technical Indicators
    const EMA = (arr, p) => {
      if (!arr || arr.length < 2) return null;
      const k = 2 / (p + 1);
      let e = arr[0];
      for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
      return e;
    };

    const RSI = (arr, n = 14) => {
      if (!arr || arr.length < n + 1) return 50;
      let g = 0, l = 0;
      for (let i = arr.length - n; i < arr.length; i++) {
        const d = arr[i] - arr[i - 1];
        if (d >= 0) g += d; else l -= d;
      }
      const rs = g / (l || 1);
      return 100 - 100 / (1 + rs);
    };

    const MACD = (arr) => {
      const ema12 = EMA(arr, 12);
      const ema26 = EMA(arr, 26);
      return ema12 - ema26;
    };

    const lastClose = closes.at(-1);
    const prev5d = closes.at(-6) ?? closes[0];
    const change5d = ((lastClose - prev5d) / prev5d) * 100;

    const rsi = RSI(closes, 14);
    const macd = MACD(closes);
    const ema20 = EMA(closes, 20);
    const ema50 = EMA(closes, 50);

    // Volume Analysis
    const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);
    const volSpike = volumes.at(-1) > avgVol20 * 1.5;

    // Trend
    let trend = "Side";
    if (lastClose > ema20 && ema20 > ema50) trend = "Strong Up";
    else if (lastClose > ema20) trend = "Up";
    else if (lastClose < ema20 && ema20 < ema50) trend = "Strong Down";
    else if (lastClose < ema20) trend = "Down";

    // Future Score (0-100)
    let futureScore = 50;
    if (trend === "Strong Up") futureScore += 20;
    else if (trend === "Up") futureScore += 12;
    else if (trend === "Down") futureScore -= 10;
    else if (trend === "Strong Down") futureScore -= 18;

    if (rsi < 35) futureScore += 15;
    else if (rsi < 45) futureScore += 8;
    else if (rsi > 75) futureScore -= 12;
    else if (rsi > 65) futureScore -= 5;

    if (macd > 0) futureScore += 8;
    else futureScore -= 5;

    if (volSpike) futureScore += 12;
    if (change5d > 5) futureScore += 10;
    else if (change5d > 2) futureScore += 5;
    else if (change5d < -5) futureScore -= 8;

    futureScore = Math.max(0, Math.min(100, futureScore));

    // Signal
    const signal = futureScore >= 75 ? "Strong Buy" : futureScore >= 60 ? "Buy" : futureScore <= 30 ? "Sell" : "Hold";

    // Potential
    const potential = futureScore >= 80 ? "🚀 High Potential" : futureScore >= 65 ? "⭐ Good Potential" : futureScore >= 50 ? "📊 Moderate" : "⚠️ Caution";

    res.status(200).json({
      symbol: s,
      futureScore,
      potential,
      signal,
      trend,
      rsi: Number(rsi.toFixed(1)),
      macd: Number(macd.toFixed(3)),
      ema20: Number(ema20.toFixed(2)),
      ema50: Number(ema50.toFixed(2)),
      volume: volumes.at(-1),
      avgVol20: Math.round(avgVol20),
      volSpike,
      change5d: Number(change5d.toFixed(2)),
      analysis: {
        trend_strength: trend.includes("Strong") ? "Very Strong" : trend.includes("Up") || trend.includes("Down") ? "Strong" : "Neutral",
        rsi_level: rsi < 30 ? "Oversold" : rsi > 70 ? "Overbought" : "Normal",
        volume_status: volSpike ? "Spike Detected" : "Normal",
        macd_signal: macd > 0 ? "Bullish" : "Bearish",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
