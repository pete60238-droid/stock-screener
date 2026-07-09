// ✅ Eternal AI Super Investor v∞.100 — Quantum Fusion Upgrade
import { rsi, ema, macd, adx } from "./indicators";

export function analyzeAI(prices, highs, lows, volumes, fundamentals = {}) {
  if (!prices?.length) return { signal: "HOLD", aiScore: 0 };

  // ====== Core Data ======
  const last = prices.at(-1);
  const prev = prices.at(-2) || last;
  const change = ((last - prev) / prev) * 100;
  const vol = volumes.at(-1) || 0;
  const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

  // ====== Indicators ======
  const rsiVal = rsi(prices, 14);
  const ema20 = ema(prices, 20);
  const ema50 = ema(prices, 50);
  const macdVal = macd(prices);
  const adxVal = adx(highs, lows, prices, 14);

  // ====== Fundamental ======
  const mcap = fundamentals.marketCap || 0;
  const growth = fundamentals.revenueGrowth || 0;
  const margin = fundamentals.profitMargin || 0;
  const sector = (fundamentals.sector || "").toLowerCase();

  // ====== Core Scores ======
  let techScore = 50;
  if (ema20 > ema50) techScore += 10;
  if (macdVal.histogram > 0) techScore += 10;
  if (rsiVal < 40) techScore += 5;
  if (adxVal > 25) techScore += 5;
  if (vol > avgVol * 1.5) techScore += 10;
  if (change > 2) techScore += 5;

  let fundScore = 0;
  if (growth > 10) fundScore += 15;
  if (margin > 5) fundScore += 10;
  if (mcap > 5_000_000_000) fundScore += 10;
  if (["ai", "semiconductor", "energy", "battery", "ev", "space"].some(s => sector.includes(s)))
    fundScore += 20;

  // ====== Predictive Layer ======
  const momentum =
    ema20 > ema50 && macdVal.histogram > 0 && rsiVal < 65 && change > 0 ? 1 : 0;
  const predictiveBoost = momentum ? 15 : 0;

  // ====== Fusion ======
  let aiScore =
    techScore * 0.4 +
    fundScore * 0.3 +
    predictiveBoost +
    (change > 0 ? 5 : -5);

  aiScore = Math.max(0, Math.min(100, aiScore));

  // ====== Decision Engine ======
  let signal = "HOLD";
  let reason = "ตลาดยังไม่ชัดเจน";

  if (aiScore >= 75 && rsiVal < 65 && ema20 > ema50) {
    signal = "BUY";
    reason = "AI พบ momentum ขาขึ้น + พื้นฐานแข็งแรง + แนวโน้มอนาคตดี";
  } else if (aiScore <= 30 || (rsiVal > 70 && change < 0)) {
    signal = "SELL";
    reason = "แนวโน้มอ่อนแรง + ความเสี่ยงสูง";
  }

  return {
    signal,
    aiScore: Math.round(aiScore),
    rsi: Math.round(rsiVal),
    adx: Math.round(adxVal),
    macd: macdVal.histogram.toFixed(2),
    change: change.toFixed(2),
    reason,
  };
    }
