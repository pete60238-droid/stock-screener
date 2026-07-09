// ✅ components/MiniChart.js — Mini Sparkline Chart for Stock Cards
import { useState, useEffect } from "react";

export default function MiniChart({ symbol, height = 32, width = 80 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`)
      .then(r => r.json())
      .then(j => {
        const closes = j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(x => typeof x === "number") || [];
        setData(closes.slice(-20)); // Last 20 days
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading || data.length < 2) {
    return (
      <div className="bg-[#111827]/50 rounded" style={{ width, height }} />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const last = data[data.length - 1];
  const prev = data[0];
  const isUp = last >= prev;

  // SVG sparkline
  const points = data.map((price, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((price - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const color = isUp ? "#10b981" : "#ef4444";
  const fillColor = isUp ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)";

  return (
    <svg
      width={width}
      height={height}
      className="rounded"
      style={{ background: fillColor }}
    >
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Last point dot */}
      <circle
        cx={width}
        cy={height - ((last - min) / range) * height}
        r="1"
        fill={color}
      />
    </svg>
  );
}
