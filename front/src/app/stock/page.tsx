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

  if (!stockData)
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">Loading stock data...</p>
      </main>
    );

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

  const commonColors = ["#00C49F", "#8884d8", "#FFBB28", "#FF8042", "#AF19FF", "#DE3163"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-16 space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">📈 Stock Market Overview</h1>
        <p className="text-gray-400 text-sm">Real-time updates every minute</p>
      </div>

      <section className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {stockKeys.map((key) => (
          <div
            key={key}
            className="bg-gray-850 p-6 rounded-xl shadow-md ring-1 ring-gray-700/50 text-center transition hover:shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-2">{key}</h2>
            <p className="text-blue-400 text-2xl font-mono">${current[key].toFixed(2)}</p>
            <p className={`mt-2 text-md font-medium ${Number(diff[key]) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {numberWithSign(Number(diff[key]))}%
            </p>
          </div>
        ))}
      </section>

      <section className="bg-gray-850 p-6 rounded-xl shadow-md ring-1 ring-gray-700/50">
        <h2 className="text-xl font-semibold mb-4">📊 Price Trends</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} labelStyle={{ color: "#ccc" }} />
            <Legend />
            {stockKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={commonColors[index % commonColors.length]}
                dot={false}
                strokeWidth={2}
                animationDuration={0}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}
