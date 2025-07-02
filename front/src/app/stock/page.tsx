"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { STOCK_UPDATE_INTERVAL_MS } from "@/shared/constants";

const STOCK_API = "http://localhost:4000/stocks";

export default function StockPage() {
  const [stockData, setStockData] = useState<any>(null);

  const fetchStocks: () => Promise<void> = async () => {
    const res = await fetch(STOCK_API);
    console.log("Fetching stock data from:", STOCK_API);
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Fetched stock data:", data);
    setStockData(data);
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, STOCK_UPDATE_INTERVAL_MS); // auto-refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (!stockData) return <div className="text-white p-6">Loading...</div>;

  const { AAPL, GOOG, TSLA } = stockData;

  const chartData = AAPL.map((_: any, idx: number) => ({
    name: `${idx}m`,
    AAPL: AAPL[idx],
    GOOG: GOOG[idx],
    TSLA: TSLA[idx],
  }));

  const current = {
    AAPL: AAPL[AAPL.length - 1],
    GOOG: GOOG[GOOG.length - 1],
    TSLA: TSLA[TSLA.length - 1],
  };

  const prev = {
    AAPL: AAPL[AAPL.length - 2] || AAPL[AAPL.length - 1],
    GOOG: GOOG[GOOG.length - 2] || GOOG[GOOG.length - 1],
    TSLA: TSLA[TSLA.length - 2] || TSLA[TSLA.length - 1],
  };

  const diff = {
    AAPL: (((current.AAPL - prev.AAPL) / prev.AAPL) * 100).toFixed(2),
    GOOG: (((current.GOOG - prev.GOOG) / prev.GOOG) * 100).toFixed(2),
    TSLA: (((current.TSLA - prev.TSLA) / prev.TSLA) * 100).toFixed(2),
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-4">📈 Stock Market Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        {["AAPL", "GOOG", "TSLA"].map((key) => (
          <div key={key} className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow text-center">
            <h2 className="text-lg font-semibold mb-2">{key}</h2>
            <p className="text-blue-400 text-xl font-mono">${current[key as keyof typeof current].toFixed(2)}</p>
            <p className={`mt-1 ${Number(diff[key as keyof typeof diff]) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {diff[key as keyof typeof diff]}%
            </p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="AAPL" stroke="#60a5fa" dot={false} />
          <Line type="monotone" dataKey="GOOG" stroke="#f87171" dot={false} />
          <Line type="monotone" dataKey="TSLA" stroke="#34d399" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </main>
  );
}
