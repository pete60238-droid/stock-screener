// ✅ /pages/api/visionary-infinite-core.js — Advanced AI Stock Analysis with TP/SL/AI Zone
export default async function handler(req, res) {
  try {
    const { symbol = "NVDA" } = req.query;
    const s = symbol.toUpperCase();

    // 1. ดึงข้อมูลกราฟและราคาจาก Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${s}?range=1y&interval=1d`;
    const data = await fetch(url).then(r => r.json());
    const chart = data.chart?.result?.[0];
    if (!chart) throw new Error("Symbol not found");

    const meta = chart.meta;
    const quote = chart.indicators?.quote?.[0];
    const prices = quote.close.filter(x => x !== null && typeof x === "number");
    const volumes = quote.volume.filter(x => x !== null && typeof x === "number");
    const highs = quote.high?.filter(x => x !== null && typeof x === "number") || prices;
    const lows = quote.low?.filter(x => x !== null && typeof x === "number") || prices;
    
    if (prices.length === 0) throw new Error("No price data");
    
    const lastClose = prices.at(-1);
    const lastHigh = highs.at(-1);
    const lastLow = lows.at(-1);

    // 2. ดึงข้อมูลพื้นฐาน (Fundamental) และข่าว
    const searchRes = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${s}`);
    const searchData = await searchRes.json();
    const news = searchData.news?.slice(0, 8) || [];

    // 3. AI Sentiment Analysis
    let sentimentScore = 0;
    const positiveWords = ["growth", "beat", "buy", "bullish", "upgrade", "profit", "surge", "expansion", "partnership"];
    const negativeWords = ["loss", "miss", "sell", "bearish", "downgrade", "drop", "risk", "lawsuit", "debt"];

    news.forEach(n => {
      const title = n.title.toLowerCase();
      positiveWords.forEach(w => { if (title.includes(w)) sentimentScore += 15; });
      negativeWords.forEach(w => { if (title.includes(w)) sentimentScore -= 15; });
    });

    // 4. วิเคราะห์หุ้นขนาดเล็ก
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volSpike = volumes.at(-1) > avgVol * 2;
    const isSmallCapPotential = lastClose < 50;

    // 5. คำนวณ AI Score
    const gains = [], losses = [];
    for (let i = Math.max(0, prices.length - 14); i < prices.length; i++) {
      const diff = prices[i] - (prices[i - 1] || prices[i]);
      if (diff > 0) gains.push(diff); else losses.push(Math.abs(diff));
    }
    const avgGain = gains.reduce((a,b)=>a+b,0) / (gains.length || 1);
    const avgLoss = losses.reduce((a,b)=>a+b,0) / (losses.length || 1);
    const rs = avgGain / (avgLoss || 1);
    const rsi = 100 - (100 / (1 + rs));

    let aiScore = 50;
    aiScore += sentimentScore;
    aiScore += (rsi < 40 ? 15 : rsi > 70 ? -10 : 5);
    aiScore += (volSpike ? 20 : 0);
    aiScore = Math.max(0, Math.min(100, aiScore));

    // 6. คำนวณ TP (Take Profit) และ SL (Stop Loss)
    const atr = calculateATR(highs, lows, prices);
    const tp1 = Number((lastClose + atr * 1.5).toFixed(2));
    const tp2 = Number((lastClose + atr * 2.5).toFixed(2));
    const sl = Number((lastClose - atr * 1.0).toFixed(2));

    // 7. คำนวณ AI Zone (ระดับสนับสนุนและแนวต้าน)
    const support = Number((Math.min(...prices.slice(-50)) + (lastClose - Math.min(...prices.slice(-50))) * 0.382).toFixed(2));
    const resistance = Number((Math.max(...prices.slice(-50)) - (Math.max(...prices.slice(-50)) - lastClose) * 0.618).toFixed(2));
    const aiZone = {
      support,
      resistance,
      midpoint: Number(((support + resistance) / 2).toFixed(2)),
    };

    // 8. สร้างบทวิเคราะห์ AI
    let reason = "หุ้นมีการเคลื่อนไหวปกติ";
    if (aiScore > 75) reason = "🌟 หุ้นศักยภาพสูง: มีแรงซื้อหนาแน่นพร้อมข่าวบวกเด่นชัด มีโอกาสเป็นหุ้นเติบโตสูง";
    else if (aiScore > 60) reason = "✅ แนวโน้มขาขึ้น: สัญญาณเทคนิคเป็นบวกและข่าวสนับสนุนการเติบโต";
    else if (aiScore < 40) reason = "⚠️ ระมัดระวัง: มีแรงขายกดดันและข่าวเชิงลบกระทบความเชื่อมั่น";

    res.status(200).json({
      symbol: s,
      price: lastClose,
      rsi: Number(rsi.toFixed(2)),
      aiScore,
      sentiment: sentimentScore > 20 ? "Very Positive" : sentimentScore > 0 ? "Positive" : sentimentScore < -20 ? "Very Negative" : "Neutral",
      volSpike,
      isSmallCap: isSmallCapPotential,
      signal: aiScore > 70 ? "Strong Buy" : aiScore > 55 ? "Buy" : aiScore < 35 ? "Sell" : "Hold",
      reason,
      // ✅ TP/SL
      tp1,
      tp2,
      sl,
      // ✅ AI Zone
      aiZone,
      analysis: {
        technical: rsi < 30 ? "Oversold (สะสม)" : rsi > 70 ? "Overbought (ระวัง)" : "Neutral",
        volume: volSpike ? "วอลุ่มเข้าผิดปกติ (Smart Money เข้า)" : "ปกติ",
        news_sentiment: sentimentScore > 0 ? "ข่าวเชิงบวกหนุน" : "ข่าวทั่วไป"
      },
      news: news.map(n => ({ title: n.title, link: n.link, source: n.publisher })),
      chart: {
        timestamps: chart.timestamp || [],
        prices: prices,
        open: quote.open?.filter(x => x !== null) || [],
        high: highs,
        low: lows,
        volume: volumes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ✅ คำนวณ ATR (Average True Range)
function calculateATR(highs, lows, closes, period = 14) {
  const tr = [];
  for (let i = 1; i < Math.min(closes.length, highs.length, lows.length); i++) {
    const h = highs[i];
    const l = lows[i];
    const c = closes[i - 1];
    const tr1 = h - l;
    const tr2 = Math.abs(h - c);
    const tr3 = Math.abs(l - c);
    tr.push(Math.max(tr1, tr2, tr3));
  }
  
  if (tr.length < period) return tr.reduce((a, b) => a + b, 0) / tr.length;
  
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
  }
  return atr;
}
