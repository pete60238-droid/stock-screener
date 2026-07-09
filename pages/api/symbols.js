// ✅ /pages/api/symbols.js — v∞.48 (Full U.S. Stock Universe + Smart Cache + AMEX)
let cached = { time: 0, data: [] };

export default async function handler(req, res) {
  try {
    // ✅ ใช้ cache 5 นาที ป้องกันโหลดซ้ำ
    const now = Date.now();
    if (cached.data.length && now - cached.time < 5 * 60 * 1000) {
      return res.status(200).json({
        total: cached.data.length,
        symbols: cached.data.slice(0, 7000),
        cache: true,
      });
    }

    const urls = [
      // NASDAQ
      "https://pkgstore.datahub.io/core/nasdaq-listings/nasdaq-listed_json/data/9ffb9c43a7a5f7c6a19e9a9a06b66bfc/nasdaq-listed_json.json",
      // NYSE
      "https://pkgstore.datahub.io/core/nyse-other-listings/nyse-listed_json/data/5cdd9b55f8e844e1b83c364a7eae98f3/nyse-listed_json.json",
      // AMEX (สำรอง)
      "https://pkgstore.datahub.io/core/amex-listings/r/amex-listed.json",
    ];

    // ✅ โหลดพร้อม timeout 10 วินาที
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const responses = await Promise.allSettled(
      urls.map((u) => fetch(u, { signal: controller.signal }).then((r) => r.json()))
    );
    clearTimeout(timer);

    // ✅ รวม NASDAQ + NYSE + AMEX
    const nasdaq = responses[0]?.value?.map((x) => x.Symbol) || [];
    const nyse = responses[1]?.value?.map((x) => x.ACTSymbol) || [];
    const amex =
      responses[2]?.value?.map((x) => x.Symbol || x.ACTSymbol || x.symbol) || [];

    const symbols = Array.from(new Set([...nasdaq, ...nyse, ...amex])).filter((s) =>
      /^[A-Z.]{1,6}$/.test(s)
    );

    // ✅ แคชไว้ 5 นาที
    cached = { time: now, data: symbols };

    res.status(200).json({
      total: symbols.length,
      symbols: symbols.slice(0, 7000),
      cache: false,
    });
  } catch (e) {
    console.error("❌ Symbol load error:", e.message);
    res.status(500).json({
      error: e.message,
      symbols: ["AAPL", "TSLA", "NVDA", "PLTR", "SOFI", "PATH", "CRSP"],
    });
  }
}
