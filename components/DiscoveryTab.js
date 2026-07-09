// ✅ components/DiscoveryTab.js — Future Stock Discovery Tab
import { useState, useEffect } from "react";
import Link from "next/link";
import StockLogo from "./StockLogo";

const CATEGORIES = [
  { id: "all", label: "🌐 All" },
  { id: "ai_tech", label: "🤖 AI & Tech" },
  { id: "clean_energy", label: "🔋 Energy" },
  { id: "biotech", label: "🧬 Biotech" },
  { id: "small_cap", label: "🚀 Small Cap" },
  { id: "fintech", label: "💰 Fintech" },
];

const STOCK_UNIVERSE = {
  ai_tech: ["BBAI", "SOUN", "IONQ", "PATH", "PLTR", "RXRX", "KSCP", "ACHR", "RKLB", "ASTS", "NVDA", "AMD", "SMCI", "CRWD", "NET"],
  clean_energy: ["TSLA", "RIVN", "LCID", "NKLA", "PLUG", "FSLR", "ENPH", "RUN", "BLNK", "CHPT", "QS", "SLDP", "SPWR"],
  biotech: ["CRSP", "RXRX", "DNA", "OSCR", "HIMS", "TDOC", "ACCD", "ONEM", "DOCS", "PHVS"],
  small_cap: ["WULF", "MVIS", "SES", "LAES", "AXTI", "NRGV", "ENVX", "LWLG", "HASI", "BBAI"],
  fintech: ["SQ", "SOFI", "UPST", "AFRM", "HOOD", "COIN", "MSTR", "RIOT", "MARA", "CLSK"],
  metaverse: ["META", "RBLX", "U", "SNAP", "COIN", "MSTR"],
};

export default function DiscoveryTab() {
  const [category, setCategory] = useState("all");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const ALL_SYMBOLS = [...new Set(Object.values(STOCK_UNIVERSE).flat())];
  const symbols = category === "all" ? ALL_SYMBOLS : (STOCK_UNIVERSE[category] || ALL_SYMBOLS);

  useEffect(() => {
    setLoading(true);
    const loadSymbols = async () => {
      const results = [];
      for (const sym of symbols.slice(0, 15)) {
        try {
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1d&interval=1d`);
          const j = await res.json();
          const quote = j?.chart?.result?.[0]?.indicators?.quote?.[0];
          const close = quote?.close?.[0];
          const prev = quote?.close?.[1];
          if (close && prev) {
            results.push({
              symbol: sym,
              price: close,
              change: ((close - prev) / prev) * 100,
            });
          }
        } catch {}
        await new Promise(r => setTimeout(r, 100));
      }
      setData(results.sort((a, b) => b.change - a.change));
      setLoading(false);
    };
    loadSymbols();
  }, [category]);

  return (
    <section className="w-full text-gray-100 font-sans">
      <h2 className="text-[18px] font-extrabold text-white tracking-tight mb-3">🔭 Future Stock Discovery</h2>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              category === c.id
                ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                : "bg-white/5 text-gray-400 border-white/10"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-gray-500 py-6 text-[12px]">🔄 Loading future stocks...</div>
      )}

      {/* Stock List */}
      {!loading && (
        <div className="space-y-2">
          {data.map(r => (
            <Link
              key={r.symbol}
              href={`/analyze/${r.symbol}`}
              className="flex items-center gap-3 p-3 bg-[#0f172a]/50 hover:bg-[#0f172a] border border-white/5 rounded-xl transition-all"
            >
              <StockLogo symbol={r.symbol} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-white text-[13px] font-extrabold">{r.symbol}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white text-[13px] font-bold font-mono">${r.price.toFixed(2)}</div>
                <div className={`text-[11px] font-bold ${r.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {r.change >= 0 ? "▲" : "▼"} {Math.abs(r.change).toFixed(2)}%
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
