// ✅ /pages/api/news.js — Market News Aggregator
//
// ✅ เดิมไม่มีไฟล์นี้อยู่เลยในโปรเจกต์ แต่ components/NewsFeedPro.js เรียก
//   fetch("/api/news?limit=80") อยู่ → ได้ 404 เสมอ ทำให้ฟีเจอร์ข่าวใช้งานไม่ได้เลย
//   ไฟล์นี้เติม endpoint ที่ขาดหายไป โดยดึงข่าวจริงจาก Yahoo Finance search API
//   (เอนจินเดียวกับที่ pages/api/visionary-infinite-core.js ใช้ดึงข่าวรายตัว)
//   รวมข่าวจากหุ้นชุดเดียวกับที่หน้า OriginX ใช้ (components/MarketSection.js)
//   เพื่อให้ "หุ้นที่เห็นในแอป" กับ "ข่าวที่แสดง" เป็นชุดเดียวกัน ไม่ใช่คนละจักรวาล
//
// รูปแบบผลลัพธ์ตรงกับที่ NewsFeedPro.js คาดหวัง:
//   { results: [{ title, source, date, url }, ...] }

const NEWS_SYMBOLS = [
  "WULF", "DNA", "BYND", "OSCR", "BBAI", "ACHR", "PATH", "MVIS", "SES", "KSCP",
  "IONQ", "RKLB", "ASTS", "CRSP", "SLDP", "ENVX", "SOFI", "HASI", "LWLG", "SOUN",
  "AXTI", "LAES", "RXRX", "NRGV", "RIVN",
];

const CONCURRENCY = 8;

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await worker(items[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  return results;
}

async function fetchNewsForSymbol(sym) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${sym}`);
    const j = await r.json();
    return (j.news || []).map((n) => ({
      title: n.title,
      source: n.publisher || "Yahoo Finance",
      date: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      url: n.link,
      symbol: sym,
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  const { limit = "80" } = req.query;
  const max = Math.min(Math.max(Number(limit) || 80, 1), 200);

  try {
    const perSymbol = await runPool(NEWS_SYMBOLS, fetchNewsForSymbol, CONCURRENCY);

    // ✅ รวม + กันซ้ำ (ข่าวเดียวกันอาจโผล่จากหลาย symbol) + เรียงใหม่สุดก่อน
    const seen = new Set();
    const merged = [];
    for (const list of perSymbol) {
      for (const item of list) {
        if (!item.title || !item.url) continue;
        const key = item.url;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    }
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      results: merged.slice(0, max),
      total: merged.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, results: [] });
  }
}
