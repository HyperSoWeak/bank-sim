"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StockData, StockMeta } from "@/types/stock";
import { STOCK_UPDATE_INTERVAL_MS } from "@/shared/constants"
import { Princess_Sofia } from "next/font/google";

type Account = {
  id: string;
  name: string;
  balance: number;
  lastAction: string | null;
  lastTransaction: string | null;
  loanTime: string | null;
  stockNetWorth: number;
  stocks: {
    [company: string]: number;
  };
};

const MS_PER_MIN = 60 * 1000;
const STOCK_API = "http://localhost:4000/stocks";

function calculateCompoundInterest(balance: number, mins: number) {
  const tier1 = Math.min(mins, 30);
  const tier2 = Math.min(Math.max(mins - 30, 0), 30);
  const tier3 = Math.max(mins - 60, 0);
  return Math.floor(balance * Math.pow(1.01, tier1) * Math.pow(1.02, tier2) * Math.pow(1.03, tier3));
}

export default function AccountPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [account, setAccount] = useState<Account | null>(null);
  const [original, setOriginal] = useState<Account | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [showPopup, setShowPopup] = useState(0);
  const [selectedCompanyMeta, setSelectedCompanyMeta] = useState<StockMeta | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");
  const [inputValue, setInputValue] = useState<number | "">("");

  const handleSubmit = async () => {
    const num = Number(inputValue);
    if (!inputValue || num <= 0 || !account) return;
    const price = selectedCompanyMeta?.price[selectedCompanyMeta?.price.length - 1];
    if (!price) {
      setShowPopup(0);
      return;
    } 
    const shares = account.stocks?.[selectedCompanyName] || 0;
    const newShare = num / price;
    const updated = {
      ...account,
      stockNetWorth: showPopup == 1 ? account.stockNetWorth - num : account.stockNetWorth + num,
      stocks: {
        ...account.stocks,
        [selectedCompanyName]: showPopup == 1 ? shares + newShare : shares - newShare,
      },
      lastAction: new Date().toISOString(),
    };
    await save(updated);
    setShowPopup(0);
    setInputValue("");
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`http://localhost:4000/accounts/${id}`);
      const acc = await res.json();
      setAccount(acc);
      setOriginal(acc);
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      const stockRes = await fetch(STOCK_API);
      const data = await stockRes.json();
      setStockData(data);
    }
    const interval = setInterval(() => fetchData(), STOCK_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [id]);

  const save = async (updated: Account) => {
    await fetch(`http://localhost:4000/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setAccount(updated);
  };

  function trimTo2Decimals(num: number): number {
    return Math.trunc(num * 100) / 100;
  } 

  const logout = () => {
    router.push("/login");
  };

  const revert = () => {
    if (original) save(original);
  };

  const lastActionTime = account?.lastAction ? new Date(account.lastAction).getTime() : 0;
  const loginTime = Number(localStorage.getItem("banksim-login-time") || 0);
  const block = loginTime - lastActionTime < 5 * MS_PER_MIN;

  const interestInfo = () => {
    if (!account?.lastTransaction) return { rate: 0, total: account?.balance || 0, mins: 0 };
    const last = new Date(account.lastTransaction).getTime();
    const mins = Math.floor((now - last) / MS_PER_MIN);
    const rate = mins >= 60 ? 0.03 : mins >= 30 ? 0.02 : 0.01;
    const total = calculateCompoundInterest(account.balance, mins);
    return { rate, total, mins };
  };

  const deposit = async () => {
    const input = prompt("Enter deposit amount:");
    const amount = Number(input);
    if (!amount || amount <= 0 || !account) return;
    const { total } = interestInfo();
    const updated = {
      ...account,
      balance: total + amount,
      lastTransaction: new Date().toISOString(),
      lastAction: new Date().toISOString(),
    };
    await save(updated);
  };

  const withdraw = async () => {
    const input = prompt("Enter withdraw amount:");
    const amount = Number(input);
    const { total } = interestInfo();
    if (!amount || amount <= 0 || !account || amount > total) return;
    const updated = {
      ...account,
      balance: total - amount,
      lastTransaction: new Date().toISOString(),
      lastAction: new Date().toISOString(),
    };
    await save(updated);
  };

  const loan = async () => {
    if (!account || account.loanTime) return;
    const updated = {
      ...account,
      loanTime: new Date().toISOString(),
      lastAction: new Date().toISOString(),
    };
    await save(updated);
  };

  const repay = async () => {
    if (!account?.loanTime) return;
    const loanStart = new Date(account.loanTime).getTime();
    const overdue = (now - loanStart) / MS_PER_MIN > 20;
    const required = overdue ? 1500 : 500;
    const updated = {
      ...account,
      loanTime: null,
      lastAction: new Date().toISOString(),
    };
    alert(`Repayment of $${required} confirmed.`);
    await save(updated);
  };

  if (loading || !account) return <div className="text-white p-6">Loading...</div>;

  const { rate, total, mins } = interestInfo();

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      {showPopup ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-md w-100">
            <h2 className="text-lg font-semibold mb-4">{
              `${showPopup == 1 ? "Buy how much worth of shares" : "Sell how much worth of shares"} of ${selectedCompanyName}`  
            }</h2>
            <input
              type="number"
              className="w-full border px-3 py-2 rounded mb-4"
              value={inputValue}
              onChange={(e) =>
                setInputValue(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
            <div className="flex justify-between">
              <button
                className="bg-red-600 px-3 py-1 rounded"
                onClick={() => setShowPopup(0)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : <></>}
      <header className="flex items-center justify-between border-b border-gray-700 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {account.name} <span className="text-gray-400 text-base">({account.id})</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Last Action: {account.lastAction ? new Date(account.lastAction).toLocaleString() : "Never"}
          </p>
          <p className="text-sm mt-1">
            Status:{" "}
            {block ? <span className="text-red-400">Blocked</span> : <span className="text-green-400">Allowed</span>}
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-gray-700 text-sm text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* Balance Card */}
          <section className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">💰 Balance</h2>
            <p className="text-xl font-mono text-blue-400 mb-2">${total}</p>
            <p className="text-sm text-gray-400 mb-1">
              Interest Rate: {(rate * 100).toFixed(0)}%/min — {mins} minutes since last transaction
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Last Transaction: {account.lastTransaction ? new Date(account.lastTransaction).toLocaleString() : "Never"}
            </p>
            <div className="flex gap-4">
              <button
                onClick={deposit}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-white font-medium"
              >
                Deposit
              </button>
              <button
                onClick={withdraw}
                className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded text-white font-medium"
              >
                Withdraw
              </button>
            </div>
          </section>

          {/* Loan Card */}
          <section className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">📄 Loan</h2>
            {account.loanTime ? (
              <>
                <p className="text-gray-300 mb-1">
                  Status: <span className="text-yellow-400">Loaning</span>
                </p>
                <p className="text-sm text-gray-400 mb-1">Loan Start: {new Date(account.loanTime).toLocaleString()}</p>
                <p className="text-sm text-gray-400 mb-4">
                  Repay Amount: {(now - new Date(account.loanTime).getTime()) / MS_PER_MIN > 20 ? "$1500" : "$500"}
                </p>
                <button
                  onClick={repay}
                  className="bg-yellow-500 hover:bg-yellow-600 px-5 py-2 rounded text-black font-semibold"
                >
                  Repay
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-300 mb-4">
                  Status: <span className="text-green-400">Not Loaning</span>
                </p>
                <button
                  onClick={loan}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white font-medium"
                >
                  Loan $500
                </button>
              </>
            )}
          </section>

          <div className="text-right">
            <button onClick={revert} className="text-sm text-blue-300 hover:text-blue-400 underline">
              Revert Last Action
            </button>
          </div>
        </div>

        {/* Right Panel - Stock */}
        <div>
          <section className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-2xl font-semibold mb-2">📈 Stock</h2>
            <div className="mb-4 flex gap-1">
              <p className="text-gray-300">Stock Net Worth: </p><p className="font-mono text-blue-400">${account.stockNetWorth}</p>
            </div>
            <div className="space-y-4">
              {Object.entries(stockData?.stocks || {} as {[company: string]: StockMeta}).map(([company, meta]) => {
                const shares = account.stocks?.[company] || 0;
                const price = meta.price[meta.price.length - 1];
                return (
                  <div
                    key={company}
                    className="flex items-center justify-between border p-3 rounded-lg shadow-sm bg-gray-800"
                  >
                    <div>
                      <div className="text-lg font-semibold">{company}</div>
                      <div className="text-sm text-gray-400">Price: ${price}</div>
                      <div className="text-sm text-gray-400">You own: ${trimTo2Decimals(shares * price)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCompanyMeta(meta);
                          setSelectedCompanyName(company);
                          setShowPopup(1);
                        }}
                        className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-white text-sm"
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCompanyMeta(meta);
                          setSelectedCompanyName(company);
                          setShowPopup(2);
                        }}
                        className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-white text-sm"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
