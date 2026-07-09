// ✅ /pages/api/visionary-infinite-core.js - Advanced AI Deep Analysis Engine
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
    const prices = quote.close.filter(x => x !== null);
    const volumes = quote.volume.filter(x => x !== null);
    const lastClose = prices.at(-1);

    // 2. ดึงข้อมูลพื้นฐาน (Fundamental) และข่าว
    const searchRes = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${s}`);
    const searchData = await searchRes.json();
    const news = searchData.news?.slice(0, 8) || [];

    // 3. AI Sentiment Analysis (วิเคราะห์ข่าวเบื้องต้น)
    let sentimentScore = 0;
    const positiveWords = ["growth", "beat", "buy", "bullish", "upgrade", "profit", "surge", "expansion", "partnership"];
    const negativeWords = ["loss", "miss", "sell", "bearish", "downgrade", "drop", "risk", "lawsuit", "debt"];

    news.forEach(n => {
      const title = n.title.toLowerCase();
      positiveWords.forEach(w => { if (title.includes(w)) sentimentScore += 15; });
      negativeWords.forEach(w => { if (title.includes(w)) sentimentScore -= 15; });
    });

    // 4. วิเคราะห์หุ้นขนาดเล็ก (Small-Cap / Multi-bagger Potential)
    // หุ้นที่มี Market Cap เล็ก (สมมติจากราคาและวอลุ่ม) และมีวอลุ่มเข้าผิดปกติ
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volSpike = volumes.at(-1) > avgVol * 2;
    const isSmallCapPotential = lastClose < 50; // หุ้นราคาไม่สูงมาก มักมีโอกาสโตหลายเท่ามากกว่า

    // 5. คำนวณ AI Score แบบครอบคลุม
    // RSI
    const gains = [], losses = [];
    for (let i = prices.length - 14; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains.push(diff); else losses.push(Math.abs(diff));
    }
    const rsi = 100 - (100 / (1 + (gains.reduce((a,b)=>a+b,0)/14) / (losses.reduce((a,b)=>a+b,0)/14 || 1)));

    let aiScore = 50;
    aiScore += sentimentScore; // จากข่าว
    aiScore += (rsi < 40 ? 15 : rsi > 70 ? -10 : 5); // จากเทคนิค
    aiScore += (volSpike ? 20 : 0); // จากวอลุ่มเข้า
    aiScore = Math.max(0, Math.min(100, aiScore));

    // 6. สร้างบทวิเคราะห์ AI
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
      analysis: {
        technical: rsi < 30 ? "Oversold (สะสม)" : rsi > 70 ? "Overbought (ระวัง)" : "Neutral",
        volume: volSpike ? "วอลุ่มเข้าผิดปกติ (Smart Money เข้า)" : "ปกติ",
        news_sentiment: sentimentScore > 0 ? "ข่าวเชิงบวกหนุน" : "ข่าวทั่วไป"
      },
      news: news.map(n => ({ title: n.title, link: n.link, source: n.publisher })),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
