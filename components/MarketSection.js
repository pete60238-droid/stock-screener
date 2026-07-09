// ✅ /components/MarketSection.js — Original UI with Logo Enhancement
import { useState, useEffect } from "react";
import Link from "next/link";
import StockLogo from "./StockLogo";

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
  // Two modes:
  //  - "rows" mode: parent (index.js) already fetched data (e.g. AI Discovery
  //    batch) and passed it down — just render it, don't fetch again.
  //  - "self-fetch" mode (no rows given): fetch a fixed watchlist ourselves,
  //    same as the original default view.
  const usingParentData = Array.isArray(rows);
  const [data, setData] = useState({}); // symbol -> row, only used in self-fetch mode

  // ✅ โหลดหุ้นทีละตัวแบบแยกอิสระ — ตัวหนึ่ง error ไม่ทำให้ตัวอื่นหายไปด้วย,
  // และแสดงผลได้ทันทีที่แต่ละตัวโหลดเสร็จ (progressive) แทนที่จะรอครบ 25 ตัว
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
        // ✅ พังแค่ตัวนี้ตัวเดียว ไม่กระทบตัวอื่น — เก็บ status ไว้เผื่อโชว์ retry
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
        price: r.lastClose ?? r.price ?? 0,
        rsi: r.rsi ?? 50,
        signal: r.signal || (r.rsi > 55 ? "Buy" : r.rsi < 45 ? "Sell" : "Hold"),
      }))
    : DEFAULT_SYMBOLS.map((sym) => data[sym]).filter(Boolean);

  const isLoading = usingParentData ? !!loadingProp : list.length === 0;

  return (
    <section className="w-full bg-[#0b1220] min-h-screen text-gray-100 px-3 pt-3 font-sans">
      <h2 className="text-[22px] font-extrabold text-white flex items-center gap-2 mb-4 tracking-tight">
        {title || "🚀 OriginX Picks"}
      </h2>

      {isLoading && list.length === 0 ? (
        <div className="text-center text-gray-400 py-10 italic">⏳ Loading data...</div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-800/50">
          {list.map((r, i) => {
            const isFav = favorites.includes(r.symbol);
            return (
              <div
                key={r.symbol + i}
                className="flex items-center justify-between py-[10px] hover:bg-[#111827]/40 transition-all"
              >
                <Link
                  href={`/analyze/${r.symbol}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <StockLogo symbol={r.symbol} size={36} />
                  <div className="min-w-0">
                    <div className="text-white text-[15px] font-extrabold tracking-wide leading-tight">
                      {r.symbol}
                    </div>
                    <div className="text-gray-400 text-[11px] font-medium truncate max-w-[160px] leading-snug">
                      {r.status === "error" ? "โหลดล้มเหลว" : r.company}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <div className="text-right leading-tight font-mono min-w-[75px]">
                    <div className="text-[15px] text-white font-black">
                      {r.price ? `$${r.price.toFixed(2)}` : "-"}
                    </div>
                    <div
                      className={`text-[13px] font-bold ${
                        r.rsi > 70 ? "text-red-400" : r.rsi < 40 ? "text-blue-400" : "text-emerald-400"
                      }`}
                    >
                      {r.rsi ? Math.round(r.rsi) : "-"}
                    </div>
                    <div
                      className={`text-[13px] font-extrabold ${
                        r.signal.includes("Buy")
                          ? "text-green-400"
                          : r.signal.includes("Sell")
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal}
                    </div>
                    {r.aiScore && (
                      <div className="text-[10px] text-emerald-400/80 font-bold">
                        AI: {r.aiScore}
                      </div>
                    )}
                  </div>

                  {toggleFavorite && (
                    <button
                      onClick={() => toggleFavorite(r.symbol)}
                      aria-label={isFav ? `Remove ${r.symbol} from favorites` : `Add ${r.symbol} to favorites`}
                      className={`text-lg leading-none px-1 transition-colors ${
                        isFav ? "text-emerald-400" : "text-gray-600 hover:text-emerald-300"
                      }`}
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
