"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TotalAssets {
  totalBalance: number;
  totalStockValue: number;
  totalRepayment: number;
  totalAssets: number;
}

export default function Home() {
  const [assetsData, setAssetsData] = useState<TotalAssets | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTotalAssets = async () => {
    try {
      const res = await fetch("http://localhost:4000/accounts/total-assets");
      const data = await res.json();
      console.log("Assets data received:", data);
      
      // Ensure all required fields exist with default values
      const safeData = {
        totalBalance: data.totalBalance || 0,
        totalStockValue: data.totalStockValue || 0,
        totalRepayment: data.totalRepayment || 0,
        totalAssets: data.totalAssets || 0
      };
      
      setAssetsData(safeData);
    } catch (error) {
      console.error("Failed to fetch total assets:", error);
      setAssetsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalAssets();
    const interval = setInterval(fetchTotalAssets, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
      <div className="w-full max-w-2xl p-10 bg-gray-850 rounded-2xl shadow-2xl ring-1 ring-gray-700/50 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-5">Bank Simulator</h1>

        {loading ? (
          <div className="mb-8 p-6 bg-gray-800 rounded-xl">
            <p className="text-gray-400">Loading assets data...</p>
          </div>
        ) : assetsData ? (
          <div className="mb-8 p-6 bg-gray-800 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Total Bank Assets</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                <p className="text-green-400 text-sm font-medium">Total Deposits</p>
                <p className="text-green-300 text-lg font-mono">${assetsData.totalBalance.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-blue-400 text-sm font-medium">Stock Value</p>
                <p className="text-blue-300 text-lg font-mono">${assetsData.totalStockValue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-500 text-sm font-medium">Loan Repayments</p>
                <p className="text-yellow-400 text-lg font-mono">${assetsData.totalRepayment.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-600/20 border border-gray-500/50 rounded-lg">
                <p className="text-gray-200 text-sm font-medium">Net Total Assets</p>
                <p className={`text-lg font-mono ${assetsData.totalAssets >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${assetsData.totalAssets.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-6 bg-red-900/20 border border-red-700/50 rounded-xl">
            <p className="text-red-400">Failed to load assets data</p>
          </div>
        )}

        <div className="flex flex-col space-y-5">
          <Link href="/login">
            <button className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition rounded-xl text-white font-medium shadow-md hover:shadow-lg">
              Login
            </button>
          </Link>
          <Link href="/backstage">
            <button className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 transition rounded-xl text-white font-medium shadow-md hover:shadow-lg">
              Backstage
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
