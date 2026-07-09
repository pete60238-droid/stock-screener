import OpenAI from 'openai';
import { basicSentimentFromTitles } from './newsAnalyzer';

function heuristic({ price, ema20, rsi14, macdHist, atr14 }){
  let action='Hold';
  if(price>ema20 && macdHist>0 && rsi14>50 && rsi14<70) action='Buy';
  if(price<ema20 || macdHist<0 || rsi14>75 || rsi14<40) action='Sell';
  const entry = price && atr14 ? `${(price-0.5*atr14).toFixed(2)} - ${(price-0.1*atr14).toFixed(2)}`:null;
  const target= price && atr14 ? (price+1.0*atr14).toFixed(2):null;
  const stop  = price && atr14 ? (price-1.2*atr14).toFixed(2):null;
  return { action, entry_zone:entry, target, stop_loss:stop, confidence: action==='Hold'?60:72 };
}

export async function aiTrade({ symbol, indicators, fundamentals, news }){
  const base = heuristic({ price:indicators?.lastClose, ema20:indicators?.ema20, rsi14:indicators?.rsi14, macdHist:indicators?.macd?.hist, atr14:indicators?.atr14 });
  const titles = (news||[]).map(n=>n.title);
  const sent = basicSentimentFromTitles(titles);
  const growth = (fundamentals?.metrics?.revCAGR5y || 0) * 100;
  base.confidence = Math.max(0, Math.min(100, base.confidence + sent*5 + growth));

  if(!process.env.OPENAI_API_KEY) return { symbol, ...base, reason:'Heuristic mode (add OPENAI_API_KEY for AI reasoning)' };

  try{
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Return JSON with keys: action, entry_zone, target, stop_loss, confidence, reason.\nSymbol: ${symbol}\nIndicators: ${JSON.stringify(indicators)}\nFundamentals: ${JSON.stringify(fundamentals)}\nNewsTitles: ${titles.join(' ; ')}`;
    const r = await client.chat.completions.create({ model:'gpt-4o-mini', messages:[{role:'user', content:prompt}], temperature:0.2 });
    const text = r.choices?.[0]?.message?.content || '';
    const json = JSON.parse(text.trim().match(/\{[\s\S]*\}/)?.[0] || '{}');
    return { symbol, ...base, ...json };
  }catch{ return { symbol, ...base, reason:'AI fallback (parse error), using heuristic' } }
}
