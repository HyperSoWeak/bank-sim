"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StockData } from "@/types/stock";
import { STOCK_UPDATE_INTERVAL_MS } from "@/shared/constants";

const DASHBOARD_API = "http://localhost:4000/stocks";

export default function DashboardPage() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [editing, setEditing] = useState<Record<string, { target?: number; remaining?: number; stability?: number }>>(
    {}
  );

  const fetchStocks = async () => {
    const res = await fetch(DASHBOARD_API);
    const data = await res.json();
    setStockData(data);
  };

  const updateStock = async (key: string) => {
    const payload = editing[key];
    const currentMeta = stockData?.stocks[key];
    if (!payload || !currentMeta) return;
    payload.target = payload.target ?? currentMeta.target;
    payload.remaining = payload.remaining ?? currentMeta.remaining;
    payload.stability = payload.stability ?? currentMeta.stability;

    await fetch(`${DASHBOARD_API}/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchStocks();
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, STOCK_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!stockData)
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-16 space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Loading dashboard...</h1>
        </div>
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
        <h1 className="text-4xl font-bold tracking-tight mb-2">🛠️ Stock Control Dashboard</h1>
        <p className="text-gray-400 text-sm">Manage live market parameters in real time</p>
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

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(stocks).map(([key, meta]) => (
          <div key={key} className="bg-gray-850 p-6 rounded-xl shadow-md ring-1 ring-gray-700/50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{key}</h3>
              <div className="text-sm text-gray-400 text-right">
                <div>
                  ${meta.price.at(-1)?.toFixed(2)} → {meta.target}
                </div>
                <div>
                  {meta.remaining} steps / s = {meta.stability}
                </div>
              </div>
            </div>

            {["target", "remaining", "stability"].map((field) => (
              <div key={field} className="flex items-center gap-3">
                <label className="w-24 capitalize text-gray-400">{field}</label>
                <input
                  type="number"
                  step={field === "stability" ? "0.001" : "1"}
                  className="flex-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editing[key]?.[field as keyof typeof meta] ?? ""}
                  placeholder={meta[field as keyof typeof meta]?.toString()}
                  onChange={(e) =>
                    setEditing((prev) => ({
                      ...prev,
                      [key]: {
                        ...prev[key],
                        [field]:
                          e.target.value === ""
                            ? undefined
                            : field === "stability"
                            ? parseFloat(e.target.value)
                            : parseInt(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            ))}

            <button
              onClick={() => updateStock(key)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
            >
              Apply Changes
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
