// ✅ Visionary Batch Scanner — v∞.60 (Super Growth & Small-Cap Discovery)
export default async function handler(req, res) {
  const { batch = "1" } = req.query;

  // ✅ รายชื่อหุ้นเป้าหมาย (หุ้นขนาดเล็กและหุ้นเทคโนโลยีที่มีศักยภาพ)
  const TARGET_SYMBOLS = [
    "WULF", "DNA", "BYND", "OSCR", "BBAI", "ACHR", "PATH", "MVIS", "SES", "KSCP",
    "IONQ", "RKLB", "ASTS", "CRSP", "SLDP", "ENVX", "SOFI", "HASI", "LWLG", "SOUN",
    "AXTI", "LAES", "RXRX", "NRGV", "RIVN", "PLTR", "COIN", "RIOT", "MARA", "CLSK",
    "MSTR", "SQ", "UPST", "SMCI", "NVDA", "AMD", "TSLA", "AAPL", "MSFT", "GOOGL",
    "PLUG", "BLNK", "CHPT", "QS", "LCID", "NKLA", "RUN", "SPWR", "FSLR", "ENPH"
  ];

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
      if (d >= 0) g += d;
      else l -= d;
    }
    const rs = g / (l || 1);
    return 100 - 100 / (1 + rs);
  };

  const getYahoo = async (sym) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
      const r = await fetch(url);
      const j = await r.json();
      return j?.chart?.result?.[0] || null;
    } catch {
      return null;
    }
  };

  try {
    const batchSize = 15;
    const startIdx = (Number(batch) - 1) * batchSize;
    const endIdx = startIdx + batchSize;
    const symbols = TARGET_SYMBOLS.slice(startIdx, endIdx);

    const results = [];
    for (const s of symbols) {
      try {
        const d = await getYahoo(s);
        const q = d?.indicators?.quote?.[0];
        const closes = q?.close?.filter((x) => typeof x === "number");
        const vols = q?.volume?.filter((x) => typeof x === "number");
        if (!closes?.length || !vols?.length) continue;

        const last = closes.at(-1);
        const prev = closes.at(-2) ?? last;
        const change = ((last - prev) / prev) * 100;
        const ema20 = EMA(closes, 20);
        const ema50 = EMA(closes, 50);
        const rsi = RSI(closes, 14);

        const volNow = vols.at(-1);
        const avgVol10 = vols.slice(-10).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(10, vols.length));
        const volSpike = volNow > avgVol10 * 1.5;

        const trend = last > ema20 && ema20 > ema50 ? "Up" : last < ema20 && ema20 < ema50 ? "Down" : "Side";

        let aiScore = 50;
        aiScore += trend === "Up" ? 20 : trend === "Down" ? -20 : 0;
        aiScore += change > 1 ? 10 : change < -1 ? -10 : 0;
        aiScore += rsi < 40 ? 8 : rsi > 70 ? -12 : 0;
        aiScore += volSpike ? 10 : 0;
        aiScore = Math.max(0, Math.min(100, aiScore));

        // ✅ กรองหุ้นขนาดเล็กที่มีศักยภาพ (ราคา < $50)
        if (last <= 50) {
          results.push({
            symbol: s,
            price: Number(last.toFixed(2)),
            last: Number(last.toFixed(2)),
            rsi: Number(rsi.toFixed(1)),
            ema20: Number(ema20?.toFixed(2)),
            ema50: Number(ema50?.toFixed(2)),
            vol: volNow,
            aiScore,
            trend,
            signal: aiScore >= 70 ? "Strong Buy" : aiScore >= 60 ? "Buy" : "Hold",
            change: Number(change.toFixed(2)),
            volSpike,
          });
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 50));
    }

    const totalBatches = Math.ceil(TARGET_SYMBOLS.length / batchSize);
    const done = endIdx >= TARGET_SYMBOLS.length;

    res.status(200).json({
      success: true,
      message: done ? "✅ Completed all batches!" : `✅ Finished Batch ${batch}/${totalBatches}`,
      nextBatch: done ? null : Number(batch) + 1,
      totalSymbols: TARGET_SYMBOLS.length,
      scanned: symbols.length,
      passedFilter: results.length,
      results: results.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
