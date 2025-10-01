import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ฟังก์ชันเก็บค่าใน localStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    }
    return initialValue;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);
  return [value, setValue];
}

// Mock Data หุ้น
const mockStocks = [
  { symbol: "PTT", name: "PTT Public Co.", sector: "Energy", price: 34.5, pe: 12.5, marketcap: 120000 },
  { symbol: "AOT", name: "Airports of Thailand", sector: "Transport", price: 72.3, pe: 25.2, marketcap: 90000 },
  { symbol: "SCB", name: "Siam Commercial Bank", sector: "Banking", price: 101.0, pe: 10.8, marketcap: 120000 },
  { symbol: "CPALL", name: "CP All", sector: "Retail", price: 62.0, pe: 18.3, marketcap: 60000 },
];

export default function StockScreener() {
  const [watchlist, setWatchlist] = useLocalStorage("watchlist", []);
  const [sector, setSector] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockStocks.filter(
      (s) =>
        (!sector || s.sector === sector) &&
        (s.symbol.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [sector, search]);

  return (
    <div className="p-6 grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>📊 Stock Screener</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="ค้นหาหุ้น..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="เลือก Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Energy">Energy</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Banking">Banking</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4">
            {filtered.map((s) => (
              <Card key={s.symbol}>
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle>{s.symbol} - {s.name}</CardTitle>
                  <Button
                    onClick={() =>
                      setWatchlist([...watchlist, s.symbol])
                    }
                  >
                    + Watchlist
                  </Button>
                </CardHeader>
                <CardContent>
                  <p>ราคา: {s.price} บาท</p>
                  <p>P/E: {s.pe}</p>
                  <p>มูลค่าตลาด: {s.marketcap.toLocaleString()} ล้านบาท</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
    }
