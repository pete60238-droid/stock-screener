import { useState, useEffect } from "react";
import Link from "next/link";
import StockLogo from "./StockLogo";

export default function ScannerSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("aiScanResults");
    if (saved) setResults(JSON.parse(saved));
  }, []);

  async function prepareScanner() {
    const res = await fetch("/api/symbols");
    const j = await res.json();
    const total = j.total || 7000;
    const perBatch = 300;
    return Math.ceil(total / perBatch);
  }

  async function runSingleBatch(batchNo) {
    try {
      const res = await fetch(`/api/visionary-batch?batch=${batchNo}`, { cache: "no-store" });
      const j = await res.json();
      return j?.results || [];
    } catch {
      return [];
    }
  }

  async function runFullScan() {
    setLoading(true);
    setProgress(0);
    setResults([]);
    const batches = await prepareScanner();
    let all = [];
    const delay = 200;

    for (let i = 1; i <= batches; i++) {
      const r = await runSingleBatch(i);
      if (r?.length) all.push(...r);
      setProgress(Math.round((i / batches) * 100));
      await new Promise((res) => setTimeout(res, delay));
    }

    const top = all
      .filter((x) => x.signal === "Buy")
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 20);

    setResults(top);
    localStorage.setItem("aiScanResults", JSON.stringify(top));
    setLoading(false);
    setProgress(100);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white pb-16">
      <div className="max-w-6xl mx-auto px-3 pt-2 relative">
        {/* หัวข้อ + ปุ่ม SCAN */}
        <div className="flex justify-between items-center mb-2 relative">
          <h1 className="text-[19px] font-extrabold text-white tracking-wide">
            Quant Terminal
          </h1>

          <button
            onClick={runFullScan}
            disabled={loading}
            className={`absolute right-0 top-0 px-5 py-[6px] rounded-md text-[13px] font-extrabold border border-gray-600 bg-transparent hover:bg-[#1f2937]/40 transition-all ${
              loading ? "text-gray-500" : "text-white hover:text-emerald-400"
            }`}
            style={{ minWidth: "88px" }}
          >
            {loading ? `${progress}%` : "SCAN"}
          </button>
        </div>

        {/* รายการหุ้น */}
        <section className="p-1">
          {results.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-800/50">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/analyze/${r.symbol}`}
                  className="flex justify-between items-center py-[10px] hover:bg-[#111827]/30 transition-all"
                >
                  {/* ซ้าย: โลโก้ + ชื่อหุ้น */}
                  <div className="flex items-center gap-2 min-w-[35%]">
                    <StockLogo symbol={r.symbol} domain={r.domain} size={32} />
                    <div className="leading-tight">
                      <div className="font-extrabold text-[13.5px] text-white">
                        {r.symbol}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {r.companyName || "AI Discovery"}
                      </div>
                    </div>
                  </div>

                  {/* ขวา: ราคา / RSI / Signal / AI */}
                  <div className="text-right font-mono leading-tight min-w-[75px] space-y-[2px]">
                    <div className="text-[14px] font-extrabold text-white">
                      {r.last ? `$${r.last.toFixed(2)}` : "-"}
                    </div>
                    <div
                      className={`text-[12px] font-bold ${
                        r.rsi > 70
                          ? "text-red-400"
                          : r.rsi < 40
                          ? "text-blue-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {r.rsi ? Math.round(r.rsi) : "-"}
                    </div>
                    <div
                      className={`text-[12px] font-extrabold ${
                        r.signal === "Buy"
                          ? "text-green-400"
                          : r.signal === "Sell"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {r.signal || "-"}
                    </div>
                    <div className="text-[9px] text-gray-400 font-semibold">
                      AI {r.aiScore ? Math.round(r.aiScore) : 0}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="text-center text-gray-500 italic py-6">
                กด "SCAN" เพื่อเริ่มการสแกนตลาด
              </p>
            )
          )}
        </section>
      </div>
    </main>
  );
}
