// ✅ indicators.js — Stable Version (AI Fusion Core Compatible)
export function ema(data, period) {
  const k = 2 / (period + 1);
  let emaPrev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    emaPrev = data[i] * k + emaPrev * (1 - k);
  }
  return emaPrev;
}

export function rsi(data, period = 14) {
  if (data.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period || 0.001;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }

  const rs = avgGain / avgLoss;
  return Math.min(100, Math.max(0, 100 - 100 / (1 + rs)));
}

export function macd(data, short = 12, long = 26, signal = 9) {
  const emaShort = ema(data, short);
  const emaLong = ema(data, long);
  const macdLine = emaShort - emaLong;

  // คำนวณ signal line จาก macd line history
  const macdHistory = [];
  for (let i = long; i < data.length; i++) {
    const s = ema(data.slice(0, i), short);
    const l = ema(data.slice(0, i), long);
    macdHistory.push(s - l);
  }

  const signalLine = ema(macdHistory, signal);
  const histogram = macdLine - signalLine;

  return { macdLine, signalLine, histogram };
}

export function adx(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return 20;
  let tr = [];
  for (let i = 1; i < closes.length; i++) {
    const range = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    tr.push(range);
  }
  const atr = tr.slice(-period).reduce((a, b) => a + b, 0) / period;
  return Math.min(100, (atr / closes.at(-1)) * 100);
}
