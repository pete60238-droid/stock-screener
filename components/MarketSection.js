// ✅ /components/MarketSection.js — Hybrid Market View (Old + New Features)
import { useState, useEffect } from "react";
import Link from "next/link";
import StockLogo from "./StockLogo";
import MiniChart from "./MiniChart";

const DEFAULT_SYMBOLS = [
  "WULF","DNA","BYND","OSCR","BBAI","ACHR","PATH","MVIS","SES","KSCP",
  "IONQ","RKLB","ASTS","CRSP","SLDP","ENVX","SOFI","HASI","LWLG","SOUN",
  "AXTI","LAES","RXRX","NRGV","RIVN"
];

const LOGO_MAP = {
  WULF:"terawulf.com", DNA:"ginkgobioworks.com", BYND:"beyondmeat.com",
  OSCR:"hioscar.com", BBAI:"bigbear.ai", ACHR:"archer.com", PATH:"uipath.com",
  MVIS:"microvision.com", SES:"ses.ai", KSCP:"knightscope.com",
  RKLB:"rocketlabusa.com", ASTS:"ast-science.com", CRSP:"crisprtx.com", SLDP:"solidpowerbattery.com",
  ENVX:"enovix.com", SOFI:"sofi.com", HASI:"hannonarmstrong.com", LWLG:"lightwavelogic.com",
  SOUN:"soundhound.com", AXTI:"axt.com", LAES:"sealsq.com", RXRX:"recursion.com",
  NRGV:"energyvault.com", RIVN:"rivian.com"
};

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
  const [data, setData] = useState({}); // symbol -> row
  const [futureData, setFutureData] = useState({}); // symbol -> future analysis
  const [expanded, setExpanded] = useState(null); // which symbol is expanded

  // ✅ โหลดหุ้นทีละตัวแบบแยกอิสระ
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
        const price = json?.price ?? json?.lastClose ?? 0;
        const rsi = json?.rsi ?? 50;
        const signal = json?.signal || (rsi > 55 ? "Buy" : rsi < 45 ? "Sell" : "Hold");
        const aiScore = json?.aiScore || 50;

        if (cancelled) return;
        setData((prev) => {
          const next = { ...prev, [sym]: { symbol: sym, company: COMPANY_MAP[sym], price, rsi, signal, aiScore } };
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

  // ✅ โหลด Future Analysis เมื่อ expand
  useEffect(() => {
    if (!expanded) return;
    
    const loadFuture = async () => {
      try {
        const res = await fetch(`/api/future-discovery?symbol=${expanded}`);
        const json = await res.json();
        if (!json.error) {
          setFutureData((prev) => ({ ...prev, [expanded]: json }));
        }
      } catch (e) {
        console.error("Future analysis error:", e);
      }
    };
    
    loadFuture();
  }, [expanded]);

  const list = usingParentData
    ? rows.map((r) => ({
        symbol: r.symbol,
        company: r.companyName || COMPANY_MAP[r.symbol] || "",
        price: r.lastClose ?? r.price ?? 0,
        rsi: r.rsi ?? 50,
        signal: r.signal || (r.rsi > 55 ? "Buy" : r.rsi < 45 ? "Sell" : "Hold"),
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
            const future = futureData[r.symbol];

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

                  {/* Right: Price + RSI + Signal + AI Score */}
                  <div className="flex items-center gap-2">
                    <div className="text-right leading-tight font-mono min-w-[65px]">
                      <div className="text-[13px] text-white font-black">
                        {r.price ? `$${r.price.toFixed(2)}` : "-"}
                      </div>
                      <div
                        className={`text-[11px] font-bold ${
                          r.rsi > 70 ? "text-red-400" : r.rsi < 40 ? "text-blue-400" : "text-emerald-400"
                        }`}
                      >
                        RSI {r.rsi ? Math.round(r.rsi) : "-"}
                      </div>
                      <div
                        className={`text-[11px] font-extrabold ${
                          r.signal.includes("Buy")
                            ? "text-green-400"
                            : r.signal.includes("Sell")
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {r.signal}
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
                    {/* AI Analysis */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#1b2435] rounded-lg p-2">
                        <div className="text-[9px] text-gray-500 uppercase font-bold">AI Score</div>
                        <div className="text-[13px] font-black text-emerald-400">{r.aiScore || "-"}</div>
                      </div>
                      <div className="bg-[#1b2435] rounded-lg p-2">
                        <div className="text-[9px] text-gray-500 uppercase font-bold">Signal</div>
                        <div className={`text-[13px] font-black ${
                          r.signal.includes("Buy") ? "text-green-400" : r.signal.includes("Sell") ? "text-red-400" : "text-yellow-400"
                        }`}>{r.signal}</div>
                      </div>
                    </div>

                    {/* Future Analysis */}
                    {future && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#1b2435] rounded-lg p-2">
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Future Score</div>
                            <div className="text-[13px] font-black" style={{ color: future.futureScore >= 75 ? "#10b981" : future.futureScore >= 60 ? "#3b82f6" : "#f59e0b" }}>
                              {future.futureScore}
                            </div>
                          </div>
                          <div className="bg-[#1b2435] rounded-lg p-2">
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Trend</div>
                            <div className={`text-[13px] font-black ${
                              future.trend.includes("Up") ? "text-emerald-400" : future.trend.includes("Down") ? "text-red-400" : "text-yellow-400"
                            }`}>{future.trend}</div>
                          </div>
                          <div className="bg-[#1b2435] rounded-lg p-2">
                            <div className="text-[9px] text-gray-500 uppercase font-bold">RSI</div>
                            <div className="text-[13px] font-black text-blue-400">{future.rsi.toFixed(1)}</div>
                          </div>
                          <div className="bg-[#1b2435] rounded-lg p-2">
                            <div className="text-[9px] text-gray-500 uppercase font-bold">5D Change</div>
                            <div className={`text-[13px] font-black ${future.change5d > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {future.change5d > 0 ? "+" : ""}{future.change5d.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#0f172a] rounded-lg p-2 text-[10px] text-gray-300 space-y-1">
                          <div>📊 {future.analysis?.trend_strength}</div>
                          <div>📈 {future.analysis?.rsi_level}</div>
                          <div>📦 {future.analysis?.volume_status}</div>
                          <div>🔄 {future.analysis?.macd_signal}</div>
                        </div>
                      </div>
                    )}
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
