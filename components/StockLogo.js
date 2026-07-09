import { useState, useEffect } from "react";

export default function StockLogo({ symbol, size = 36, className = "" }) {
  const sym = (symbol || "").toUpperCase();
  const [stage, setStage] = useState(0); 
  const [imgSrc, setImgSrc] = useState(null);

  // ลำดับแหล่งข้อมูลที่เร็วและแม่นยำที่สุด
  const sources = [
    `https://assets.parqet.com/logos/symbol/${sym}?format=png`,
    `https://finnhub.io/api/logo?symbol=${sym}`,
    `https://logo.clearbit.com/${sym.toLowerCase()}.com`,
    `https://www.google.com/s2/favicons?domain=${sym.toLowerCase()}.com&sz=128`
  ];

  useEffect(() => {
    setImgSrc(sources[0]);
    setStage(0);
  }, [sym]);

  const handleError = () => {
    if (stage < sources.length - 1) {
      setImgSrc(sources[stage + 1]);
      setStage(stage + 1);
    } else {
      setImgSrc("fallback");
    }
  };

  if (imgSrc === "fallback" || !sym) {
    return (
      <div
        className={`rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-white font-bold shrink-0 border border-white/10 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {sym.slice(0, 2)}
      </div>
    );
  }

  return (
    <div 
      className={`relative flex-shrink-0 bg-white rounded-full overflow-hidden border border-white/20 p-[1px] ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt={sym}
        className="w-full h-full object-contain block"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}
