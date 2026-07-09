import { useState, useEffect } from "react";

// ✅ Domain map สำหรับหุ้นที่รู้จัก
const DOMAIN_MAP = {
  AAPL:"apple.com", MSFT:"microsoft.com", GOOGL:"google.com", GOOG:"google.com",
  AMZN:"amazon.com", META:"meta.com", TSLA:"tesla.com", NVDA:"nvidia.com",
  AMD:"amd.com", INTC:"intel.com", NFLX:"netflix.com", DIS:"disney.com",
  PYPL:"paypal.com", SQ:"squareup.com", COIN:"coinbase.com", PLTR:"palantir.com",
  SOFI:"sofi.com", UPST:"upstart.com", RIVN:"rivian.com", LCID:"lucidmotors.com",
  NKLA:"nikolamotor.com", PLUG:"plugpower.com", FSLR:"firstsolar.com",
  ENPH:"enphase.com", RUN:"sunrun.com", BLNK:"blinkcharging.com",
  CHPT:"chargepoint.com", QS:"quantumscape.com", SPWR:"sunpower.com",
  WULF:"terawulf.com", DNA:"ginkgobioworks.com", BYND:"beyondmeat.com",
  OSCR:"hioscar.com", BBAI:"bigbear.ai", ACHR:"archer.com", PATH:"uipath.com",
  MVIS:"microvision.com", SES:"ses.ai", KSCP:"knightscope.com",
  RKLB:"rocketlabusa.com", ASTS:"ast-science.com", CRSP:"crisprtx.com",
  SLDP:"solidpowerbattery.com", ENVX:"enovix.com", HASI:"hannonarmstrong.com",
  LWLG:"lightwavelogic.com", SOUN:"soundhound.com", AXTI:"axt.com",
  LAES:"sealsq.com", RXRX:"recursion.com", NRGV:"energyvault.com",
  IONQ:"ionq.com", MSTR:"microstrategy.com", RIOT:"riotplatforms.com",
  MARA:"marathondh.com", CLSK:"cleanspark.com", SMCI:"supermicro.com",
};

// ✅ สีพื้นหลัง fallback ตามตัวอักษรแรก
const COLORS = [
  "#1a56db","#0e9f6e","#e3a008","#f05252","#7e3af2",
  "#3f83f8","#31c48d","#ff5a1f","#e74694","#6875f5",
];

function getColor(sym) {
  const code = (sym || "A").charCodeAt(0) - 65;
  return COLORS[Math.abs(code) % COLORS.length];
}

export default function StockLogo({ symbol, size = 36, className = "" }) {
  const sym = (symbol || "").toUpperCase().replace(/[^A-Z]/g, "");
  const [stage, setStage] = useState(0); 
  const [imgSrc, setImgSrc] = useState(null);

  const domain = DOMAIN_MAP[sym];

  // ลำดับแหล่งข้อมูลที่เร็วและแม่นยำที่สุด
  const sources = [
    `https://assets.parqet.com/logos/symbol/${sym}?format=png`,
    domain ? `https://logo.clearbit.com/${domain}` : null,
    `https://financialmodelingprep.com/image-stock/${sym}.png`,
    `https://www.google.com/s2/favicons?domain=${(domain || sym.toLowerCase() + ".com")}&sz=128`
  ].filter(Boolean);

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

  const initials = sym.length >= 2 ? sym.slice(0, 2) : sym;
  const bg = getColor(sym);

  if (imgSrc === "fallback" || !sym) {
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-black shrink-0 border border-white/10 ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.33,
          background: `linear-gradient(135deg, ${bg}cc, ${bg}88)`,
          letterSpacing: "-0.5px",
        }}
      >
        {initials}
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
