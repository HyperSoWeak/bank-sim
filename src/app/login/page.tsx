"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Account = {
  id: string;
  name: string;
  balance: number;
};

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/data/accounts.json")
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch(() => setAccounts([]));
  }, []);

  const handleLogin = () => {
    if (!/^\d{4}$/.test(userId)) {
      setError("Please enter a valid 4-digit User ID.");
      return;
    }

    const found = accounts.find((acc) => acc.id === userId);
    if (found) {
      setError("");
      router.push(`/account/${userId}`);
    } else {
      setError("Account not found.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold text-white mb-6 text-center">User Login</h1>

        <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-2">
          Enter your 4-digit User ID
        </label>
        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 0421"
          className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full mt-6 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Login
        </button>

        <Link href="/" className="block text-center mt-6 text-sm text-gray-400 hover:underline">
          Back to Main Page
        </Link>
      </div>
    </main>
  );
}
