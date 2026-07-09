// components/NewsFeedPro.js
import { useEffect, useState, useMemo } from "react";

// === Utility ===
const POS = ["surge","soar","jump","beat","record","rally","gain","grow","upgrade","approve","profit","tops","bullish","expansion","buy"];
const NEG = ["plunge","drop","fall","miss","slash","downgrade","loss","lawsuit","ban","shortfall","cut","layoff","decline","bearish","bankrupt"];

const SentimentPill = ({ s }) => {
  const map = {
    Bullish: "text-emerald-300 bg-emerald-500/10 border-emerald-400/30",
    Bearish: "text-red-300 bg-red-500/10 border-red-400/30",
    Neutral: "text-yellow-300 bg-yellow-500/10 border-yellow-400/30",
  };
  return (
    <span className={`px-2 py-[2px] rounded border text-[11px] font-semibold ${map[s] || map.Neutral}`}>
      {s || "Neutral"}
    </span>
  );
};

const SourceChip = ({ name }) => (
  <span className="px-2 py-[2px] rounded bg-white/5 border border-white/10 text-[11px] text-gray-300">{name}</span>
);

const timeAgo = (iso) => {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const map = [[31536000,"y"],[2592000,"mo"],[604800,"w"],[86400,"d"],[3600,"h"],[60,"m"],[1,"s"]];
  for (const [sec, unit] of map) if (diff >= sec) return `${Math.floor(diff/sec)}${unit}`;
  return "now";
};

// === AI Analyzer ===
function analyzeAI(title="") {
  const lower = title.toLowerCase();
  let score = 0;
  POS.forEach(w=>{ if (lower.includes(w)) score += 1; });
  NEG.forEach(w=>{ if (lower.includes(w)) score -= 1; });

  let sentiment = "Neutral";
  if (score > 1) sentiment = "Bullish";
  else if (score < -1) sentiment = "Bearish";

  // หาคำสำคัญ (keywords)
  const keywords = [];
  [...POS, ...NEG].forEach(w => {
    if (lower.includes(w)) keywords.push(w);
  });

  // Confidence จากจำนวน keyword
  const conf = Math.min(100, Math.abs(score) * 15 + keywords.length * 5);

  // คอมเมนต์ AI
  let comment = "ตลาดยังไม่ชัดเจน";
  if (sentiment === "Bullish") comment = "ข่าวนี้หนุนราคาหุ้นขึ้น 📈";
  if (sentiment === "Bearish") comment = "ข่าวนี้อาจกดดันราคาหุ้นลง 📉";

  return { sentiment, confidence: conf, keywords, comment };
}

// === Component ===
export default function NewsFeedPro() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const j = await fetch("/api/news?limit=80").then(r => r.json());
        setItems(Array.isArray(j.results) ? j.results : []);
      } catch (e) {
        setErr("โหลดข่าวไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(x => x.title.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  if (loading)
    return <div className="text-gray-400 animate-pulse p-4">🛰 กำลังโหลดข่าวตลาดทั่วจักรวาล...</div>;
  if (err)
    return <div className="text-red-400 p-4">{err}</div>;

  return (
    <section className="bg-[#101827]/70 rounded-2xl p-4 border border-purple-400/30">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-purple-400 text-xl font-semibold">🧠 AI Market News — Galaxy Edition</h2>
        <input
          className="bg-[#141b2d] px-3 py-1 rounded text-sm text-gray-200 border border-white/10"
          placeholder="🔍 ค้นข่าวหรือหุ้น"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && <div className="text-gray-400 text-center py-10">ไม่มีข่าวที่ตรงกับคำค้น</div>}

      {filtered.map((n, i) => {
        const key = `${n.source}|${i}`;
        const ai = analyzeAI(n.title);
        return (
          <article key={key} className="border border-white/10 bg-[#0e1628]/80 rounded-2xl p-4 mb-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 mb-2">
              <SourceChip name={n.source} />
              <span>•</span>
              <span>{timeAgo(n.date)} ago</span>
              <span className="ml-auto"><SentimentPill s={ai.sentiment} /></span>
            </div>

            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[15px] font-medium text-emerald-300 hover:text-emerald-200"
            >
              {n.title}
            </a>

            <div className="mt-2 text-[13px] text-gray-300">
              {ai.comment}{" "}
              <span className="text-gray-400">
                (ความมั่นใจ {ai.confidence.toFixed(0)}%)
              </span>
            </div>

            {ai.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {ai.keywords.map(k=>(
                  <span key={k} className="px-2 py-[1px] rounded bg-white/5 border border-white/10 text-[11px] text-gray-400">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
                                                             }
