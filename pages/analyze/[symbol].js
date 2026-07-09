// ✅ /pages/analyze/[symbol].js — Visionary Analyzer (Advanced AI Deep Analysis Edition)
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../../components/Chart.js"), { ssr: false });
const fmt = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : "-");

export default function Analyze() {
  const { query } = useRouter();
  const symbol = (query.symbol || "").toString().toUpperCase();
  const [core, setCore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/visionary-infinite-core?symbol=${symbol}`).then(r => r.json());
        if (res && !res.error) {
          setCore(res);
        }
      } catch (e) {
        console.error("⚠️ Analyzer fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  const price = core?.price || core?.lastClose || 0;
  const hist = core?.chart?.timestamps
    ? core.chart.timestamps.map((t, i) => ({
        time: t,
        open: core.chart.open?.[i],
        high: core.chart.high?.[i],
        low: core.chart.low?.[i],
        close: core.chart.prices?.[i],
        volume: core.chart.volume?.[i],
      }))
    : [];

  const markers = useMemo(() => {
    if (!hist.length || !core) return [];
    const t = Math.floor((hist.at(-1)?.time || Date.now()) / 1000);
    if (core.signal.includes("Buy"))
      return [{ time: t, position: "belowBar", color: "#22c55e", shape: "arrowUp", text: "BUY" }];
    if (core.signal.includes("Sell"))
      return [{ time: t, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: "SELL" }];
    return [{ time: t, position: "inBar", color: "#eab308", shape: "circle", text: "HOLD" }];
  }, [core, hist.length]);

  if (loading) return <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-emerald-400 font-bold">AI Analyzing...</div>;

  return (
    <main className="min-h-screen bg-[#0b1220] text-white text-[13px] font-semibold">
      <div className="max-w-6xl mx-auto px-3 py-5 space-y-5">
        <div className="flex justify-between items-center">
          <button onClick={() => window.history.back()} className="text-[12px] bg-white/5 px-3 py-1 rounded border border-white/10 hover:bg-emerald-500/10">← Back</button>
          <div className="flex flex-col items-center">
             <h1 className="text-[16px] font-bold tracking-widest">{symbol}</h1>
             {core?.isSmallCap && <span className="text-[10px] text-pink-400 font-bold uppercase">Small-Cap Potential</span>}
          </div>
          <div className="text-emerald-400 font-bold text-[14px] border border-emerald-400/30 rounded px-3 py-1 bg-emerald-500/5">${fmt(price, 2)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0f172a] shadow-2xl shadow-black/50">
          <Chart candles={hist} markers={markers} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* AI Deep Analysis Section */}
           <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h2 className="text-[14px] font-bold text-emerald-400">AI Deep Analysis</h2>
                <div className="flex items-center gap-2">
                   <span className="text-[11px] text-gray-400 uppercase">AI Score</span>
                   <div className="text-[16px] font-black text-emerald-400">{core?.aiScore}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                 <AnalysisBox label="Signal" value={core?.signal} color={core?.signal.includes("Buy") ? "text-emerald-400" : "text-red-400"} />
                 <AnalysisBox label="Sentiment" value={core?.sentiment} color="text-blue-400" />
                 <AnalysisBox label="RSI" value={fmt(core?.rsi, 1)} color={core?.rsi < 40 ? "text-emerald-400" : core?.rsi > 70 ? "text-red-400" : "text-gray-300"} />
                 <AnalysisBox label="Volume Spike" value={core?.volSpike ? "YES" : "NO"} color={core?.volSpike ? "text-emerald-400" : "text-gray-500"} />
              </div>

              <div className="bg-[#0f172a] rounded-xl border border-white/5 p-3">
                 <div className="text-emerald-400 text-[11px] font-bold uppercase mb-1">AI Reasoning</div>
                 <p className="text-[12px] leading-relaxed text-gray-300">{core?.reason}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                 <SmallInfo label="Technical" value={core?.analysis?.technical} />
                 <SmallInfo label="Volume" value={core?.analysis?.volume} />
                 <SmallInfo label="Sentiment" value={core?.analysis?.news_sentiment} />
              </div>
           </section>

           {/* Market News Section */}
           <section className="rounded-2xl border border-white/10 bg-[#141b2d] p-4">
              <h2 className="text-[14px] font-bold text-blue-400 mb-3">Market Sentiment News</h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {core?.news?.map((n, i) => (
                  <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all">
                    <div className="text-[12px] font-medium leading-snug line-clamp-2">{n.title}</div>
                    <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                       <span>{n.source}</span>
                       <span>AI Impact: {n.title.toLowerCase().includes("growth") || n.title.toLowerCase().includes("buy") ? "Positive" : "Neutral"}</span>
                    </div>
                  </a>
                ))}
              </div>
           </section>
        </div>
      </div>
    </main>
  );
}

function AnalysisBox({ label, value, color }) {
  return (
    <div className="bg-[#1b2435] border border-white/5 rounded-xl p-2.5 text-center">
       <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">{label}</div>
       <div className={`text-[13px] font-black ${color || "text-white"}`}>{value}</div>
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="text-center">
       <div className="text-[9px] text-gray-500 uppercase mb-0.5">{label}</div>
       <div className="text-[10px] font-bold text-gray-300">{value}</div>
    </div>
  );
}
