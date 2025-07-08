"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
    const interval = setInterval(fetchStocks, 5000);
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
    // Ensure keys are added in the exact order of stockKeys
    stockKeys.forEach((key) => {
      entry[key] = stocks[key].price[idx];
    });
    return entry;
  });

  // Dynamic interval based on data points
  const dataPointCount = chartData.length;

  // Custom tick formatter to always show the latest point
  const customTicks = () => {
    if (dataPointCount < 20) {
      return undefined; // Use default ticks
    } else {
      const ticks = [];
      // Add every 5th tick as strings to match dataKey format
      for (let i = 0; i < dataPointCount; i += 5) {
        ticks.push(i.toString());
      }
      // Add the last point if it's not already included, with exception for 100+ points
      const lastIndex = (dataPointCount - 1).toString();
      if (!ticks.includes(lastIndex)) {
        // If there are over 100 points and last index is adjacent to the last tick, don't add it
        if (dataPointCount > 100) {
          const lastTickIndex = parseInt(ticks[ticks.length - 1]);
          const actualLastIndex = dataPointCount - 1;
          if ((actualLastIndex - lastTickIndex) <= 2) {
            // Don't add the last index as it's adjacent to the last tick
            return ticks;
          }
        }
        ticks.push(lastIndex);
      }
      
      return ticks;
    }
  };

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

  const commonColors = ["#e3712c", "#9a9d6a", "#659ad2", "#f9a83a", "#ed181d"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-16 space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">📈 Stock Market Overview</h1>
        <p className="text-gray-400 text-sm">Real-time updates every 30 seconds</p>
      </div>

      <section className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {stockKeys.map((key, index) => (
          <div
            key={key}
            className="bg-gray-850 p-6 rounded-xl shadow-md ring-1 ring-gray-700/50 text-center transition hover:shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: commonColors[index % commonColors.length] }}>{key}</h2>
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
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="name" 
              stroke="#999" 
              interval={dataPointCount < 20 ? 0 : 0}
              ticks={customTicks()}
              tick={{ fontSize: 11 }}
              height={50}
            />
            <YAxis stroke="#999" domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} labelStyle={{ color: "#ccc" }} />
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

        {/* Custom Legend with explicit order */}
        <div className="flex justify-center items-center gap-8 mt-4 flex-wrap">
          {stockKeys.map((key, index) => (
            <div key={key} className="flex items-center gap-2">
              <div className="relative flex items-center">
                <div 
                  className="w-4 h-0.5"
                  style={{ backgroundColor: commonColors[index % commonColors.length] }}
                ></div>
                <div 
                  className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2"
                  style={{ 
                    borderColor: commonColors[index % commonColors.length],
                    backgroundColor: '#374151' // Match the chart background color
                  }}
                ></div>
              </div>
              <span 
                className="text-xl font-semibold"
                style={{ color: commonColors[index % commonColors.length] }}
              >
                {key}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 overflow-hidden shadow-lg border-t border-gray-700">
        <div
          className="whitespace-nowrap animate-marquee"
          style={{
            display: "inline-block",
            minWidth: "100%",
            animation: "marquee 20s linear infinite",
          }}
        >
          <span className={`mx-4 text-xl font-semibold text-white`}>{stockData.marquee}</span>
        </div>
        <style jsx global>{`
          @keyframes marquee {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </div>
    </main>
  );
}
