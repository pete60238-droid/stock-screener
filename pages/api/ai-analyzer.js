// ✅ /pages/api/ai-analyzer.js
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "public", "market-snapshot.json");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Snapshot not found" });
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const buys = data.filter(x => x.signal === "Buy").sort((a,b)=>b.aiConfidence - a.aiConfidence).slice(0,20);
  const holds = data.filter(x => x.signal === "Hold").sort((a,b)=>b.rsi - a.rsi).slice(0,20);
  const sells = data.filter(x => x.signal === "Sell").sort((a,b)=>b.rsi - a.rsi).slice(0,20);

  res.status(200).json({ updated: new Date(), buys, holds, sells });
}
