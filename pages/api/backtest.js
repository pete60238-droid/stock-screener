// ✅ /pages/api/backtest.js
// เดินกฎเดียวกับ pages/api/visionary-core.js ทีละวันบนข้อมูลราคาจริงย้อนหลัง
// ไม่มี lookahead bias: ทุก indicator ของวันที่ i คำนวณจากข้อมูลถึงวันที่ i เท่านั้น
// sentiment เป็น state สะสมแบบ path-dependent เหมือนกับ aiMemory ใน visionary-core.js
// (เริ่มที่ 50 แล้ววิ่งสะสมไปทีละวันตามลำดับเวลาจริง)
//
// ✅ อัปเดต: ตอนนี้ visionary-core.js เพิ่มเงื่อนไข MACD histogram เป็นตัวยืนยันสัญญาณ
// (import จริงจาก utils/indicators.js) — backtest นี้จำลองกฎเดียวกัน
// แต่คำนวณ EMA/RSI/MACD แบบ "incremental causal" ทีละวันในรอบเดียว (O(n) รวม)
// แทนที่จะเรียกฟังก์ชันแบบเดิมซ้ำทุกวันบน history ทั้งหมด (ซึ่งจะกลายเป็น O(n^3) และช้าเกินไป
// สำหรับช่วง 5 ปี) ผลลัพธ์ทางคณิตศาสตร์เทียบเท่ากันเพราะ EMA/RSI/MACD เป็น causal recurrence อยู่แล้ว
// (ค่า ณ วันที่ i ขึ้นกับข้อมูลถึงวันที่ i เท่านั้นไม่ว่าจะคำนวณแบบไหน)

const RANGE_MAP = { "1y": "1y", "2y": "2y", "5y": "5y" };

// คืน array ความยาวเท่า closes โดย index ที่ยังไม่มีค่า (ข้อมูลไม่พอ) จะเป็น null
function causalEMA(closes, period) {
  const out = new Array(closes.length).fill(null);
  if (closes.length < period) return out;
  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += closes[i];
  seed /= period;
  out[period - 1] = seed;
  let prevEma = seed;
  for (let i = period; i < closes.length; i++) {
    prevEma = closes[i] * k + prevEma * (1 - k);
    out[i] = prevEma;
  }
  return out;
}

// Wilder's RSI แบบ causal (ตรงกับสูตรใน utils/indicators.js)
function causalRSI(closes, period = 14) {
  const out = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return out;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period || 0.001;
  out[period] = 100 - 100 / (1 + avgGain / (avgLoss || 1));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    const rs = avgGain / (avgLoss || 0.001);
    out[i] = Math.min(100, Math.max(0, 100 - 100 / (1 + rs)));
  }
  return out;
}

// MACD แบบ causal: คืน { macdLine[], signalLine[], histogram[] } ความยาวเท่า closes
function causalMACD(closes, short = 12, long = 26, signalPeriod = 9) {
  const emaShort = causalEMA(closes, short);
  const emaLong = causalEMA(closes, long);
  const macdLine = closes.map((_, i) =>
    emaShort[i] != null && emaLong[i] != null ? emaShort[i] - emaLong[i] : null
  );

  // ดึงเฉพาะช่วงที่ macdLine มีค่าจริง มาคำนวณ signal line (EMA ของ macd line)
  const validStart = macdLine.findIndex((v) => v != null);
  const signalLine = new Array(closes.length).fill(null);
  const histogram = new Array(closes.length).fill(null);

  if (validStart !== -1) {
    const macdValid = macdLine.slice(validStart);
    const signalValid = causalEMA(macdValid, signalPeriod);
    for (let i = 0; i < signalValid.length; i++) {
      if (signalValid[i] != null) {
        const idx = validStart + i;
        signalLine[idx] = signalValid[i];
        histogram[idx] = macdLine[idx] - signalValid[i];
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

export default async function handler(req, res) {
  const { symbol = "AAPL", range = "2y" } = req.query;
  const yrange = RANGE_MAP[range] || "2y";

  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  try {
    const api = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${yrange}&interval=1d`;
    const r = await fetch(api);
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    if (!result) throw new Error("No chart data for symbol");

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const closesRaw = quote.close || [];

    // ✅ กรองวันที่ไม่มีราคา (null) ออก พร้อม timestamp คู่กัน
    const days = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closesRaw[i] != null) {
        days.push({ t: timestamps[i] * 1000, close: closesRaw[i] });
      }
    }

    // ต้องมีข้อมูลพอสำหรับ EMA200 อย่างน้อย + สำรองสำหรับ warm-up
    if (days.length < 210) {
      throw new Error("Not enough historical data to run EMA200-based rules (need 200+ trading days)");
    }

    let sentiment = 50; // ✅ state เดียวกับ aiMemory เริ่มต้นใน visionary-core.js
    const trades = [];
    let position = null; // { entryIdx, entryPrice, entryDate, target, stopLoss }
    const equityCurve = [];
    let cash = 10000;
    let shares = 0;

    // ✅ คำนวณ indicator ทั้งชุดล่วงหน้าครั้งเดียว (causal, ไม่มี lookahead)
    // ค่าที่ index i ขึ้นกับ closes[0..i] เท่านั้น ตรงตามนิยามของ EMA/RSI/MACD recurrence
    const closes = days.map((d) => d.close);
    const ema20Arr = causalEMA(closes, 20);
    const ema50Arr = causalEMA(closes, 50);
    const ema200Arr = causalEMA(closes, 200);
    const rsiArr = causalRSI(closes, 14);
    const { histogram: macdHistArr } = causalMACD(closes, 12, 26, 9);

    // เริ่มเดินตั้งแต่วันที่มีข้อมูลพอสำหรับ EMA200 (index 200 เป็นต้นไป)
    for (let i = 200; i < days.length; i++) {
      const price = closes[i];
      const prev = closes[i - 1] || price;

      const ema20 = ema20Arr[i];
      const ema50 = ema50Arr[i];
      const ema200 = ema200Arr[i];
      const rsi = rsiArr[i];
      const macdHist = macdHistArr[i]; // อาจเป็น null ถ้ายังไม่ครบ warm-up ของ MACD (ปกติครบตั้งแต่ i~34)

      const trend =
        ema20 > ema50 && ema50 > ema200
          ? "Uptrend"
          : ema20 < ema50 && ema50 < ema200
          ? "Downtrend"
          : "Sideway";

      const change = ((price - prev) / prev) * 100;

      // ✅ sentiment สะสมทีละวัน เหมือน aiMemory ใน visionary-core.js
      sentiment += trend === "Uptrend" ? 10 : trend === "Downtrend" ? -10 : 0;
      sentiment += change > 1 ? 5 : change < -1 ? -5 : 0;
      sentiment = Math.max(0, Math.min(100, sentiment));

      let aiScore =
        (rsi > 45 && rsi < 70 ? 60 : 40) +
        (trend === "Uptrend" ? 20 : 0) +
        (sentiment > 60 ? 20 : 0);
      aiScore = Math.min(100, aiScore);

      // ✅ ใหม่: เพิ่มเงื่อนไข MACD histogram ยืนยันสัญญาณ เหมือนกับ visionary-core.js เวอร์ชันล่าสุด
      let signal = "Hold";
      if (aiScore > 80 && trend === "Uptrend" && rsi < 75 && macdHist != null && macdHist > 0) signal = "Buy";
      if (aiScore < 40 && trend === "Downtrend" && rsi > 55 && macdHist != null && macdHist < 0) signal = "Sell";

      const date = new Date(days[i].t).toISOString().slice(0, 10);

      // === จำลองการเทรด (long-only, all-in/all-out ตาม signal เดียวกับระบบจริง) ===
      if (!position && signal === "Buy") {
        shares = cash / price;
        position = {
          entryIdx: i,
          entryPrice: price,
          entryDate: date,
          target: price * 1.15,
          stopLoss: price * 0.92,
        };
        cash = 0;
      } else if (position) {
        // เช็ค exit: signal Sell, หรือชน target/stopLoss (เทียบกับราคาปิดวันนั้น)
        const hitTarget = price >= position.target;
        const hitStop = price <= position.stopLoss;
        if (signal === "Sell" || hitTarget || hitStop) {
          const exitPrice = price;
          cash = shares * exitPrice;
          const pnlPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
          trades.push({
            entryDate: position.entryDate,
            entryPrice: Number(position.entryPrice.toFixed(2)),
            exitDate: date,
            exitPrice: Number(exitPrice.toFixed(2)),
            pnlPct: Number(pnlPct.toFixed(2)),
            reason: signal === "Sell" ? "Sell signal" : hitTarget ? "Take-profit" : "Stop-loss",
          });
          shares = 0;
          position = null;
        }
      }

      const equity = position ? shares * price : cash;
      equityCurve.push({ date, equity: Number(equity.toFixed(2)), price });
    }

    // ✅ ปิดโพซิชันค้างท้ายช่วง (mark-to-market ที่ราคาสุดท้าย)
    if (position) {
      const lastPrice = days.at(-1).close;
      cash = shares * lastPrice;
      const pnlPct = ((lastPrice - position.entryPrice) / position.entryPrice) * 100;
      trades.push({
        entryDate: position.entryDate,
        entryPrice: Number(position.entryPrice.toFixed(2)),
        exitDate: new Date(days.at(-1).t).toISOString().slice(0, 10),
        exitPrice: Number(lastPrice.toFixed(2)),
        pnlPct: Number(pnlPct.toFixed(2)),
        reason: "End of backtest (open position marked-to-market)",
      });
      shares = 0;
      position = null;
    }

    const finalEquity = cash;
    const totalReturnPct = ((finalEquity - 10000) / 10000) * 100;

    const wins = trades.filter((t) => t.pnlPct > 0).length;
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;

    // === Max Drawdown บน equity curve ===
    let peak = -Infinity;
    let maxDrawdownPct = 0;
    for (const pt of equityCurve) {
      peak = Math.max(peak, pt.equity);
      const dd = ((pt.equity - peak) / peak) * 100;
      maxDrawdownPct = Math.min(maxDrawdownPct, dd);
    }

    // === Buy & Hold benchmark (ซื้อวันแรกของช่วง backtest ถือจนวันสุดท้าย) ===
    const firstBacktestPrice = days[200].close;
    const lastPrice = days.at(-1).close;
    const buyHoldReturnPct = ((lastPrice - firstBacktestPrice) / firstBacktestPrice) * 100;

    res.status(200).json({
      symbol,
      range: yrange,
      startDate: new Date(days[200].t).toISOString().slice(0, 10),
      endDate: new Date(days.at(-1).t).toISOString().slice(0, 10),
      totalTrades: trades.length,
      winRate: Number(winRate.toFixed(1)),
      totalReturnPct: Number(totalReturnPct.toFixed(2)),
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
      buyHoldReturnPct: Number(buyHoldReturnPct.toFixed(2)),
      beatsBuyHold: totalReturnPct > buyHoldReturnPct,
      finalEquity: Number(finalEquity.toFixed(2)),
      trades,
      equityCurve,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
