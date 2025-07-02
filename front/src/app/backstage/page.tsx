"use client";

import { useEffect, useState } from "react";
import { StockData } from "@/types/stock";

const DASHBOARD_API = "http://localhost:4000/stocks";

export default function DashboardPage() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [editing, setEditing] = useState<Record<string, { target: number; remaining: number; stability: number }>>({});

  const fetchStocks = async () => {
    const res = await fetch(DASHBOARD_API);
    const data = await res.json();
    setStockData(data);
    const next: typeof editing = {};
    Object.keys(data.stocks).forEach((key) => {
      next[key] = {
        target: data.stocks[key].target,
        remaining: data.stocks[key].remaining,
        stability: data.stocks[key].stability,
      };
    });
    setEditing(next);
  };

  const updateStock = async (key: string) => {
    const payload = editing[key];
    await fetch(`${DASHBOARD_API}/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchStocks();
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  if (!stockData) return <div className="text-white p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">🛠️ Stock Control Dashboard</h1>
      <div className="space-y-6">
        {Object.entries(stockData.stocks).map(([key, meta]) => (
          <div key={key} className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow space-y-3">
            <h2 className="text-xl font-semibold">{key}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400">Target</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                  value={editing[key]?.target || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]: { ...editing[key], target: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Remaining Steps</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                  value={editing[key]?.remaining || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]: { ...editing[key], remaining: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Stability</label>
                <input
                  type="number"
                  step="0.001"
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                  value={editing[key]?.stability || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]: { ...editing[key], stability: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
            <button
              onClick={() => updateStock(key)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
