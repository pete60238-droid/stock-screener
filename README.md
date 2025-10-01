import React, { useMemo, useState, useEffect } from "react"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"; import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; import { Badge } from "@/components/ui/badge"; import { Slider } from "@/components/ui/slider"; import { Switch } from "@/components/ui/switch"; import { Label } from "@/components/ui/label"; import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts"; import { Star, Search, BarChart2, Filter, ChevronLeft, ChevronRight, Plus, Trash2, RefreshCw } from "lucide-react";

// --- Mock Data --- // const MOCK_STOCKS = [ // TH (SET) { ticker: "PTT", name: "PTT Pcl", market: "TH", sector: "Energy", price: 35.50, change: 0.8, vol: 22_300_000, pe: 9.2, dy: 4.1, mcap: 1_000_000_000_000, rsi: 48, week52low: 30, week52high: 42 }, { ticker: "CPALL", name: "CP All", market: "TH", sector: "Consumer", price: 62.75, change: -0.6, vol: 10_200_000, pe: 24.5, dy: 2.0, mcap: 700_000_000_000, rsi: 53, week52low: 53, week52high: 69 }, { ticker: "KBANK", name: "Kasikornbank", market: "TH", sector: "Financials", price: 126.0, change: 1.2, vol: 6_400_000, pe: 7.4, dy: 3.8, mcap: 300_000_000_000, rsi: 61, week52low: 95, week52high: 135 }, { ticker: "AOT", name: "Airports of Thailand", market: "TH", sector: "Industrials", price: 69.25, change: -0.2, vol: 8_900_000, pe: 38.0, dy: 1.1, mcap: 1_040_000_000_000, rsi: 58, week52low: 58, week52high: 75 }, { ticker: "ADVANC", name: "Advanced Info Service", market: "TH", sector: "Communication", price: 240.0, change: 0.4, vol: 3_200_000, pe: 19.5, dy: 3.0, mcap: 700_000_000_000, rsi: 55, week52low: 195, week52high: 247 }, { ticker: "DELTA", name: "Delta Electronics TH", market: "TH", sector: "Technology", price: 72.0, change: -1.1, vol: 15_000_000, pe: 42.0, dy: 0.6, mcap: 890_000_000_000, rsi: 40, week52low: 62, week52high: 108 }, { ticker: "GULF", name: "Gulf Energy Development", market: "TH", sector: "Utilities", price: 33.25, change: 0.2, vol: 7_500_000, pe: 35.0, dy: 1.4, mcap: 370_000_000_000, rsi: 50, week52low: 26, week52high: 35 }, // US (NYSE/Nasdaq) { ticker: "AAPL", name: "Apple Inc.", market: "US", sector: "Technology", price: 228.5, change: 0.9, vol: 54_000_000, pe: 29.2, dy: 0.5, mcap: 3_400_000_000_000, rsi: 59, week52low: 164, week52high: 233 }, { ticker: "MSFT", name: "Microsoft", market: "US", sector: "Technology", price: 426.3, change: -0.3, vol: 28_000_000, pe: 35.0, dy: 0.7, mcap: 3_300_000_000_000, rsi: 57, week52low: 310, week52high: 441 }, { ticker: "NVDA", name: "NVIDIA", market: "US", sector: "Technology", price: 122.7, change: 1.8, vol: 80_000_000, pe: 42.0, dy: 0.0, mcap: 2_900_000_000_000, rsi: 63, week52low: 50, week52high: 140 }, { ticker: "AMZN", name: "Amazon", market: "US", sector: "Consumer", price: 185.2, change: -0.9, vol: 60_000_000, pe: 55.0, dy: 0.0, mcap: 1_900_000_000_000, rsi: 52, week52low: 118, week52high: 201 }, { ticker: "TSLA", name: "Tesla", market: "US", sector: "Automotive", price: 250.4, change: 2.1, vol: 120_000_000, pe: 58.0, dy: 0.0, mcap: 800_000_000_000, rsi: 45, week52low: 138, week52high: 299 }, { ticker: "JNJ", name: "Johnson & Johnson", market: "US", sector: "Healthcare", price: 159.0, change: 0.2, vol: 8_000_000, pe: 15.0, dy: 3.1, mcap: 380_000_000_000, rsi: 48, week52low: 143, week52high: 171 }, { ticker: "KO", name: "Coca-Cola", market: "US", sector: "Consumer", price: 62.8, change: 0.1, vol: 12_000_000, pe: 24.0, dy: 3.0, mcap: 270_000_000_000, rsi: 51, week52low: 54, week52high: 65 }, ];

// generate mock price series for the chart function seriesFromPrice(price) { const days = 120; let p = price; const out = []; for (let i = days; i >= 0; i--) { // random walk const drift = (Math.random() - 0.5) * (price * 0.01); p = Math.max(price * 0.4, p + drift); out.push({ day: ${i}d, price: +p.toFixed(2) }); } return out.reverse(); }

const NumberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }); const BahtFmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

function useLocalStorage(key, initial) { const [state, setState] = useState(() => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; } }); useEffect(() => { localStorage.setItem(key, JSON.stringify(state)); }, [key, state]); return [state, setState]; }

export default function StockScreenerApp() { const [query, setQuery] = useState(""); const [market, setMarket] = useState("ALL"); const [sector, setSector] = useState("ALL"); const [sortBy, setSortBy] = useState("ticker"); const [sortDir, setSortDir] = useState("asc"); const [priceRange, setPriceRange] = useState([0, 500]); const [peMax, setPeMax] = useState(60); const [dyMin, setDyMin] = useState(0); const [rsiRange, setRsiRange] = useState([30, 70]); const [onlyNear52Low, setOnlyNear52Low] = useState(false); const [page, setPage] = useState(1); const pageSize = 8;

const [watchlist, setWatchlist] = useLocalStorage("watchlist", []); const [selected, setSelected] = useState(null);

const sectors = useMemo(() => ["ALL", ...Array.from(new Set(MOCK_STOCKS.map(s => s.sector)))], []);

const filtered = useMemo(() => { let rows = MOCK_STOCKS.filter(s => (market === "ALL" || s.market === market) && (sector === "ALL" || s.sector === sector) && s.price >= priceRange[0] && s.price <= priceRange[1] && s.pe <= peMax && s.dy >= dyMin && s.rsi >= rsiRange[0] && s.rsi <= rsiRange[1] && (!onlyNear52Low || s.price <= s.week52low * 1.15) && (query.trim() === "" || s.ticker.toLowerCase().includes(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase())) );

rows = rows.sort((a, b) => {
  const dir = sortDir === "asc" ? 1 : -1;
  if (sortBy === "ticker") return a.ticker.localeCompare(b.ticker) * dir;
  return (a[sortBy] - b[sortBy]) * dir;
});

return rows;

}, [market, sector, priceRange, peMax, dyMin, rsiRange, onlyNear52Low, query, sortBy, sortDir]);

const paged = useMemo(() => { const start = (page - 1) * pageSize; return filtered.slice(start, start + pageSize); }, [filtered, page]);

useEffect(() => { setPage(1); }, [market, sector, priceRange, peMax, dyMin, rsiRange, onlyNear52Low, query]);

function toggleWatch(ticker) { setWatchlist(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]); }

function clearFilters() { setQuery(""); setMarket("ALL"); setSector("ALL"); setSortBy("ticker"); setSortDir("asc"); setPriceRange([0, 500]); setPeMax(60); setDyMin(0); setRsiRange([30, 70]); setOnlyNear52Low(false); }

return ( <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-4 sm:p-8"> <div className="mx-auto max-w-7xl space-y-6"> {/* Header */} <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"> <div> <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ระบบคัดกรองหุ้น & เทรด (เวอร์ชันเริ่มต้น)</h1> <p className="text-slate-500">ไทย/อเมริกา • ตัวกรองพื้นฐาน • รายชื่อเฝ้าดู • กราฟราคา • บันทึกบนเบราเซอร์</p> </div> <div className="flex items-center gap-2"> <Button variant="outline" onClick={clearFilters}><RefreshCw className="w-4 h-4 mr-2"/>ล้างตัวกรอง</Button> <Sheet> <SheetTrigger asChild> <Button><Plus className="w-4 h-4 mr-2"/>วิธีต่อ API ภายหลัง</Button> </SheetTrigger> <SheetContent className="w-[420px] sm:w-[560px] overflow-y-auto"> <SheetHeader> <SheetTitle>แนวทางเชื่อมต่อข้อมูลจริง</SheetTitle> </SheetHeader> <ol className="list-decimal ml-5 mt-4 space-y-2 text-sm text-slate-700"> <li>สมัคร/ใช้ API จากโบรกเกอร์หรือผู้ให้ข้อมูล (เช่น Finnhub, Alpha Vantage, SETSmart/Streaming เชิงพาณิชย์)</li> <li>สร้างฟังก์ชัน fetchStocks() ให้คืนข้อมูลฟิลด์: ticker, name, market, sector, price, change, vol, pe, dy, mcap, rsi, week52low, week52high</li> <li>แทนที่ <Badge variant="secondary">MOCK_STOCKS</Badge> ด้วยข้อมูลสด และเพิ่มกลไกอัปเดตทุก X วินาที</li> <li>เพิ่มการยืนยันตัวตน (OAuth/JWT) และบันทึกพอร์ต/คำสั่งซื้อในฐานข้อมูล (เช่น Supabase, Firebase, Postgres)</li> <li>รองรับสูตรคัดกรองแบบบันทึกได้ (สตอเรจผู้ใช้) และแชร์ลิงก์พรีเซ็ต</li> <li>เพิ่มระบบออเดอร์ (จำลอง/จริง) พร้อมกรอบความเสี่ยง: ขนาดสถานะ, Stop, Take Profit</li> </ol> </SheetContent> </Sheet> </div> </header>

{/* Filters */}
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/>ตัวกรอง</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>ค้นหา</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-3 text-slate-400"/>
              <Input placeholder="เช่น AOT, Apple, พลังงาน" className="pl-8" value={query} onChange={e=>setQuery(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ตลาด</Label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="TH">ไทย (SET)</SelectItem>
                <SelectItem value="US">อเมริกา (NYSE/Nasdaq)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>อุตสาหกรรม</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>เรียงตาม</Label>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticker">สัญลักษณ์</SelectItem>
                  <SelectItem value="price">ราคา</SelectItem>
                  <SelectItem value="pe">P/E</SelectItem>
                  <SelectItem value="dy">เงินปันผล %</SelectItem>
                  <SelectItem value="rsi">RSI</SelectItem>
                  <SelectItem value="vol">ปริมาณ</SelectItem>
                  <SelectItem value="mcap">มาร์เก็ตแคป</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortDir} onValueChange={setSortDir}>
                <SelectTrigger className="w-28"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">น้อย→มาก</SelectItem>
                  <SelectItem value="desc">มาก→น้อย</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2"><Label>ช่วงราคา</Label><span className="text-sm text-slate-500">{NumberFmt.format(priceRange[0])} - {NumberFmt.format(priceRange[1])}</span></div>
            <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={500} step={1}/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><Label>P/E สูงสุด</Label><span className="text-sm text-slate-500">≤ {peMax}</span></div>
            <Slider value={[peMax]} onValueChange={v=>setPeMax(v[0])} min={1} max={80} step={1}/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><Label>เงินปันผลขั้นต่ำ (%)</Label><span className="text-sm text-slate-500">≥ {dyMin}</span></div>
            <Slider value={[dyMin]} onValueChange={v=>setDyMin(v[0])} min={0} max={10} step={0.5}/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><Label>RSI</Label><span className="text-sm text-slate-500">{rsiRange[0]} - {rsiRange[1]}</span></div>
            <Slider value={rsiRange} onValueChange={setRsiRange} min={0} max={100} step={1}/>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="near52" checked={onlyNear52Low} onCheckedChange={setOnlyNear52Low}/>
            <Label htmlFor="near52">ใกล้ 52W Low (≤15%)</Label>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary">คำแนะนำสไตล์</Badge>
              </TooltipTrigger>
              <TooltipContent>เริ่มจากหุ้นพื้นฐานดี P/E ต่ำ, DY สูง, RSI 40-60</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>

    {/* Results & Watchlist */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>ผลลัพธ์ ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>สัญลักษณ์</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ตลาด</TableHead>
                  <TableHead className="text-right">ราคา</TableHead>
                  <TableHead className="text-right">เปลี่ยนแปลง</TableHead>
                  <TableHead className="text-right">P/E</TableHead>
                  <TableHead className="text-right">DY%</TableHead>
                  <TableHead className="text-right">Vol</TableHead>
                  <TableHead className="text-right">RSI</TableHead>
                  <TableHead className="text-right">52W</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(row => (
                  <TableRow key={row.ticker} className="hover:bg-slate-50">
                    <TableCell className="w-8">
                      <button onClick={()=>toggleWatch(row.ticker)} className="p-1">
                        <Star className={`w-4 h-4 ${watchlist.includes(row.ticker) ? 'fill-yellow-400 text-yellow-500' : 'text-slate-400'}`}/>
                      </button>
                    </TableCell>
                    <TableCell className="font-semibold">{row.ticker}</TableCell>
                    <TableCell className="text-slate-600">{row.name}</TableCell>
                    <TableCell><Badge variant="outline">{row.market}</Badge></TableCell>
                    <TableCell className="text-right">{NumberFmt.format(row.price)}</TableCell>
                    <TableCell className={`text-right ${row.change>=0? 'text-emerald-600':'text-rose-600'}`}>{row.change>=0?'+':''}{row.change}%</TableCell>
                    <TableCell className="text-right">{row.pe}</TableCell>
                    <TableCell className="text-right">{row.dy}</TableCell>
                    <TableCell className="text-right">{NumberFmt.format(row.vol)}</TableCell>
                    <TableCell className="text-right">{row.rsi}</TableCell>
                    <TableCell className="text-right text-slate-500">{NumberFmt.format(row.week52low)}–{NumberFmt.format(row.week52high)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="gap-2"><BarChart2 className="w-4 h-4"/>กราฟ</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{row.ticker} • {row.name}</DialogTitle>
                          </DialogHeader>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={seriesFromPrice(row.price)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" hide/>
                                <YAxis domain={[0, 'dataMax + 20']} />
                                <RTooltip />
                                <Line type="monotone" dataKey="price" dot={false} strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <Stat label="P/E" value={row.pe}/>
                            <Stat label="DY%" value={row.dy}/>
                            <Stat label="RSI" value={row.rsi}/>
                            <Stat label="52W Low/High" value={`${row.week52low} / ${row.week52high}`}/>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-10 text-slate-500">ไม่พบหุ้นตามเงื่อนไข ลองปรับตัวกรอง</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-500">หน้า {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft className="w-4 h-4"/></Button>
              <Button variant="outline" disabled={page>=Math.ceil(filtered.length / pageSize)} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4"/></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>Watchlist</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {watchlist.length === 0 && <p className="text-sm text-slate-500">กดรูปดาว ⭐ เพื่อบันทึกหุ้นที่สนใจ</p>}
          <ul className="space-y-2">
            {watchlist.map(tk => {
              const s = MOCK_STOCKS.find(x => x.ticker === tk);
              if (!s) return null;
              return (
                <li key={tk} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="font-semibold">{s.ticker} <span className="text-slate-500 font-normal">{s.name}</span></div>
                    <div className="text-xs text-slate-500">ราคา {NumberFmt.format(s.price)} • RSI {s.rsi} • P/E {s.pe}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
   
