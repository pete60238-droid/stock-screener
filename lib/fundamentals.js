import { fetchFundamentals } from '../../lib/fundamentals';
export default async function handler(req,res){
  const { symbol }=req.query; if(!symbol) return res.status(400).json({ error:'Missing symbol' });
  try{ const data=await fetchFundamentals(symbol); res.status(200).json(data); }catch(e){ res.status(500).json({ error:e.message||'fundamentals failed' }); }
}
