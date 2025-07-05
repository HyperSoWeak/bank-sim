"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!/^\d{4}$/.test(userId)) {
      setError("Please enter a valid 4-digit User ID.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/accounts/${userId}`);
      if (!res.ok) {
        setError("Account not found.");
        return;
      }

      localStorage.setItem("banksim-login-time", Date.now().toString());
      setError("");
      router.push(`/account/${userId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md p-10 bg-gray-850 rounded-2xl shadow-2xl ring-1 ring-gray-700/50">
        <h1 className="text-3xl font-bold text-white text-center mb-8 tracking-tight">🔐 User Login</h1>

        <div className="mb-6">
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
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition rounded-xl text-white font-medium shadow-md hover:shadow-lg"
        >
          Login
        </button>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
