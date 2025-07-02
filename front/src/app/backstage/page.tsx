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
    <main className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      <h1 className="text-3xl font-bold">🛠️ Stock Control Dashboard</h1>

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

      <div className="flex flex-wrap gap-6">
        {Object.entries(stockData.stocks).map(([key, meta]) => (
          <div key={key} className="bg-gray-900 p-5 rounded-lg border border-gray-800 shadow-sm text-base w-[340px]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">{key}</h2>
              <div className="text-gray-400 text-sm text-right leading-snug">
                <div>
                  ${meta.price.at(-1)?.toFixed(2)} -&gt; {meta.target}
                </div>
                <div>
                  {meta.remaining} steps / s = {meta.stability}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-20 text-gray-400">Target</label>
                <input
                  type="number"
                  className="flex-1 px-3 py-1 rounded bg-gray-800 text-white border border-gray-700"
                  value={editing[key]?.target ?? ""}
                  placeholder={meta.target.toString()}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]: {
                        ...editing[key],
                        target: e.target.value === "" ? undefined : parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-gray-400">Steps</label>
                <input
                  type="number"
                  className="flex-1 px-3 py-1 rounded bg-gray-800 text-white border border-gray-700"
                  value={editing[key]?.remaining ?? ""}
                  placeholder={meta.remaining.toString()}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]: {
                        ...editing[key],
                        remaining: e.target.value === "" ? undefined : parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-gray-400">Stability</label>
                <input
                  type="number"
                  step="0.001"
                  className="flex-1 px-3 py-1 rounded bg-gray-800 text-white border border-gray-700"
                  value={editing[key]?.stability ?? ""}
                  placeholder={meta.stability.toString()}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]: {
                        ...editing[key],
                        stability: e.target.value === "" ? undefined : parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <button
              onClick={() => updateStock(key)}
              className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-base"
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
