"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { STOCK_UPDATE_INTERVAL_MS } from "@/shared/constants";
import { StockData } from "@/types/stock";

const STOCK_API = "http://localhost:4000/stocks";

export default function StockPage() {
  const [stockData, setStockData] = useState<StockData | null>(null);

  const fetchStocks = async () => {
    const res = await fetch(STOCK_API);
    const data = await res.json();
    setStockData(data);
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, STOCK_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!stockData) return <div className="text-white p-6">Loading...</div>;

  const { stocks } = stockData;
  const stockKeys = Object.keys(stocks);

  const chartData = stocks[stockKeys[0]].price.map((_: any, idx: number) => {
    const entry: any = { name: `${idx}` };
    stockKeys.forEach((key) => {
      entry[key] = stocks[key].price[idx];
    });
    return entry;
  });

  const current: Record<string, number> = {};
  const prev: Record<string, number> = {};
  const diff: Record<string, string> = {};

  stockKeys.forEach((key) => {
    const prices = stocks[key].price;
    const latest = prices[prices.length - 1];
    const before = prices[prices.length - 2] || latest;
    current[key] = latest;
    prev[key] = before;
    diff[key] = (((latest - before) / before) * 100).toFixed(2);
  });

  const numberWithSign = (num: number) => {
    return num >= 0 ? `+${num}` : num;
  };

  const commonColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#DE3163",
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-4">📈 Stock Market Overview</h1>

      <div
        className="grid gap-6 text-sm"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {stockKeys.map((key) => (
          <div key={key} className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow text-center">
            <h2 className="text-lg font-semibold mb-2">{key}</h2>
            <p className="text-blue-400 text-xl font-mono">${current[key].toFixed(2)}</p>
            <p className={`mt-1 ${Number(diff[key]) >= 0 ? "text-red-400" : "text-green-400"}`}>
              {numberWithSign(Number(diff[key]))}%
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
          {stockKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              dot={false}
              stroke={commonColors[index % commonColors.length]}
              animationDuration={0}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </main>
  );
}
