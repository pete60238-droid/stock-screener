import { analyzeAI } from "@/utils/aiCore";

export default async function handler(req, res) {
  const { symbol } = req.query;
  try {
    const url=`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;
    const r=await fetch(url);const d=await r.json();
    const chart=d.chart?.result?.[0];
    if(!chart) return res.status(404).json({error:"no data"});

    const prices=chart.indicators.quote[0].close;
    const highs=chart.indicators.quote[0].high;
    const lows=chart.indicators.quote[0].low;
    const volumes=chart.indicators.quote[0].volume;

    // ดึงผล ML ล่าสุดจาก backend
    const ml = await fetch(`http://localhost:5000/predict?symbol=${symbol}`);
    const mlData = await ml.json();

    const result = await analyzeAI(prices,highs,lows,volumes,mlData.score);
    res.json({symbol,...result});
  } catch(err){res.status(500).json({error:err.message});}
}
