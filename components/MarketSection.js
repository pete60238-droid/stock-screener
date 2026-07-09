// ✅ /components/MarketSection.js — Ultimate Hybrid Market View (Logo + Chart + TP/SL/AI Zone)
import { useState, useEffect } from "react";
import Link from "next/link";
import StockLogo from "./StockLogo";
import MiniChart from "./MiniChart";

const DEFAULT_SYMBOLS = [
  "WULF","DNA","BYND","OSCR","BBAI","ACHR","PATH","MVIS","SES","KSCP",
  "IONQ","RKLB","ASTS","CRSP","SLDP","ENVX","SOFI","HASI","LWLG","SOUN",
  "AXTI","LAES","RXRX","NRGV","RIVN"
];

const COMPANY_MAP = {
  WULF:"TeraWulf Inc.", DNA:"Ginkgo Bioworks Holdings Inc.", BYND:"Beyond Meat Inc.",
  OSCR:"Oscar Health Inc.", BBAI:"BigBear.ai Holdings Inc.", ACHR:"Archer Aviation Inc.",
  PATH:"UiPath Inc.", MVIS:"MicroVision Inc.", SES:"SES AI Corporation",
  KSCP:"Knightscope Inc.", RKLB:"Rocket Lab USA Inc.",
  ASTS:"AST SpaceMobile Inc.", CRSP:"CRISPR Therapeutics AG", SLDP:"Solid Power Inc.",
  ENVX:"Enovix Corporation", SOFI:"SoFi Technologies Inc.",
  HASI:"Hannon Armstrong Sustainable Infrastructure Capital Inc.",
  LWLG:"Lightwave Logic Inc.", SOUN:"SoundHound AI Inc.",
  AXTI:"AXT Inc.", LAES:"SEALSQ Corp", RXRX:"Recursion Pharmaceuticals Inc.",
  NRGV:"Energy Vault Holdings Inc.", RIVN:"Rivian Automotive Inc."
};

export default function MarketSection({ title, rows, loading: loadingProp, favorites = [], toggleFavorite }) {
  const usingParentData = Array.isArray(rows);
  const [data, setData] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (usingParentData) return;

    let cancelled = false;

    const cached = sessionStorage.getItem("originx-cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const bySymbol = {};
        parsed.forEach((r) => (bySymbol[r.symbol] = r));
        setData(bySymbol);
      } catch {}
    }

    async function loadSymbol(sym) {
      try {
        const res = await fetch(`/api/visionary-infinite-core?symbol=${sym}`, { cache: "no-store" });
        const json = await res.json();
        
        if (json.error) throw new Error(json.error);
        
        const price = json?.price ?? 0;
        const rsi = json?.rsi ?? 50;
        const signal = json?.signal || (rsi > 55 ? "Buy" : rsi < 45 ? "Sell" : "Hold");
        const aiScore = json?.aiScore || 50;
        const tp1 = json?.tp1 ?? price * 1.1;
        const tp2 = json?.tp2 ?? price * 1.2;
        const sl = json?.sl ?? price * 0.9;
        const aiZone = json?.aiZone || { support: price * 0.95, resistance: price * 1.05, midpoint: price };

        if (cancelled) return;
        setData((prev) => {
          const next = {
            ...prev,
            [sym]: {
              symbol: sym,
              company: COMPANY_MAP[sym],
              price,
              rsi,
              signal,
              aiScore,
              tp1,
              tp2,
              sl,
              aiZone,
            }
          };
          sessionStorage.setItem("originx-cache", JSON.stringify(Object.values(next)));
          return next;
        });
      } catch (err) {
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          [sym]: { ...(prev[sym] || { symbol: sym, company: COMPANY_MAP[sym] }), status: "error" },
        }));
      }
    }

    function loadAll() {
      DEFAULT_SYMBOLS.forEach((sym) => loadSymbol(sym));
    }

    loadAll();
    const timer = setInterval(loadAll, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [usingParentData]);

  const list = usingParentData
    ? rows.map((r) => ({
        symbol: r.symbol,
        company: r.companyName || COMPANY_MAP[r.symbol] || "",
        price: r.price ?? r.lastClose ?? 0,
        rsi: r.rsi ?? 50,
        signal: r.signal || (r.rsi > 55 ? "Buy" : r.rsi < 45 ? "Sell" : "Hold"),
        aiScore: r.aiScore ?? 50,
        tp1: r.tp1 ?? (r.price ?? 0) * 1.1,
        tp2: r.tp2 ?? (r.price ?? 0) * 1.2,
        sl: r.sl ?? (r.price ?? 0) * 0.9,
        aiZone: r.aiZone || { support: (r.price ?? 0) * 0.95, resistance: (r.price ?? 0) * 1.05, midpoint: r.price ?? 0 },
      }))
    : DEFAULT_SYMBOLS.map((sym) => data[sym]).filter(Boolean);

  const isLoading = usingParentData ? !!loadingProp : list.length === 0;

  return (
    <section className="w-full bg-[#0b1220] min-h-screen text-gray-100 px-3 pt-3 font-sans pb-24">
      <h2 className="text-[22px] font-extrabold text-white flex items-center gap-2 mb-4 tracking-tight">
        {title || "🚀 OriginX Picks"}
      </h2>

      {isLoading && list.length === 0 ? (
        <div className="text-center text-gray-400 py-10 italic">⏳ Loading data...</div>
      ) : (
        <div className="space-y-1">
          {list.map((r, i) => {
            const isFav = favorites.includes(r.symbol);
            const isExp = expanded === r.symbol;
            const profitPct = r.price > 0 ? (((r.tp1 - r.price) / r.price) * 100).toFixed(1) : 0;
            const lossPct = r.price > 0 ? (((r.price - r.sl) / r.price) * 100).toFixed(1) : 0;

            return (
              <div
                key={r.symbol + i}
                className="bg-[#0f172a]/40 border border-white/5 rounded-xl overflow-hidden hover:border-emerald-500/20 transition-all"
              >
                {/* Main Row */}
                <div
                  className="flex items-center justify-between py-3 px-3 cursor-pointer hover:bg-white/2"
                  onClick={() => setExpanded(isExp ? null : r.symbol)}
                >
                  {/* Left: Logo + Symbol + Company */}
                  <Link
                    href={`/analyze/${r.symbol}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 min-w-0 flex-1"
                  >
                    <StockLogo symbol={r.symbol} size={32} />
                    <div className="min-w-0">
                      <div className="text-white text-[13px] font-extrabold tracking-wide leading-tight">
                        {r.symbol}
                      </div>
                      <div className="text-gray-500 text-[9px] font-medium truncate max-w-[140px] leading-snug">
                        {r.status === "error" ? "โหลดล้มเหลว" : r.company}
                      </div>
                    </div>
                  </Link>

                  {/* Middle: Mini Chart */}
                  <div className="px-2">
                    <MiniChart symbol={r.symbol} width={60} height={24} />
                  </div>

                  {/* Right: Price + RSI + Signal + TP/SL */}
                  <div className="flex items-center gap-2">
                    <div className="text-right leading-tight font-mono min-w-[70px]">
                      <div className="text-[13px] text-white font-black">
                        {r.price ? `$${r.price.toFixed(2)}` : "-"}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          r.rsi > 70 ? "text-red-400" : r.rsi < 40 ? "text-blue-400" : "text-emerald-400"
                        }`}
                      >
                        RSI {r.rsi ? Math.round(r.rsi) : "-"}
                      </div>
                      <div
                        className={`text-[10px] font-extrabold ${
                          r.signal.includes("Buy")
                            ? "text-green-400"
                            : r.signal.includes("Sell")
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {r.signal}
                      </div>
                      <div className="text-[9px] text-purple-400 font-bold">
                        TP: +{profitPct}%
                      </div>
                    </div>

                    {/* Favorite + Expand */}
                    <div className="flex flex-col items-center gap-1 ml-1">
                      {toggleFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(r.symbol);
                          }}
                          className={`text-[14px] leading-none transition-colors ${
                            isFav ? "text-emerald-400" : "text-gray-600 hover:text-emerald-300"
                          }`}
                        >
                          {isFav ? "★" : "☆"}
                        </button>
                      )}
                      <span className="text-gray-600 text-[10px]">{isExp ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExp && (
                  <div className="px-3 pb-3 border-t border-white/5 pt-3 bg-[#0b1220]/50 space-y-2">
                    {/* TP/SL Section */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                        <div className="text-[9px] text-green-400 uppercase font-bold">TP1</div>
                        <div className="text-[12px] font-black text-green-400">${r.tp1.toFixed(2)}</div>
                        <div className="text-[8px] text-green-300">+{profitPct}%</div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                        <div className="text-[9px] text-red-400 uppercase font-bold">SL</div>
                        <div className="text-[12px] font-black text-red-400">${r.sl.toFixed(2)}</div>
                        <div className="text-[8px] text-red-300">-{lossPct}%</div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                        <div className="text-[9px] text-purple-400 uppercase font-bold">TP2</div>
                        <div className="text-[12px] font-black text-purple-400">${r.tp2.toFixed(2)}</div>
                        <div className="text-[8px] text-purple-300">+{((r.tp2 - r.price) / r.price * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* AI Zone */}
                    <div className="bg-[#1b2435] rounded-lg p-2 border border-white/5">
                      <div className="text-[9px] text-cyan-400 uppercase font-bold mb-1">🎯 AI Zone</div>
                      <div className="grid grid-cols-3 gap-1 text-[9px]">
                        <div>
                          <span className="text-gray-500">Support</span>
                          <div className="text-cyan-400 font-bold">${r.aiZone.support.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Midpoint</span>
                          <div className="text-yellow-400 font-bold">${r.aiZone.midpoint.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Resistance</span>
                          <div className="text-orange-400 font-bold">${r.aiZone.resistance.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {/* AI Score */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#1b2435] rounded-lg p-2">
                        <div className="text-[9px] text-gray-500 uppercase font-bold">AI Score</div>
                        <div className="text-[13px] font-black" style={{ color: r.aiScore >= 75 ? "#10b981" : r.aiScore >= 60 ? "#3b82f6" : "#f59e0b" }}>
                          {r.aiScore}
                        </div>
                      </div>
                      <div className="bg-[#1b2435] rounded-lg p-2">
                        <div className="text-[9px] text-gray-500 uppercase font-bold">Signal</div>
                        <div className={`text-[13px] font-black ${
                          r.signal.includes("Buy") ? "text-green-400" : r.signal.includes("Sell") ? "text-red-400" : "text-yellow-400"
                        }`}>{r.signal}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
