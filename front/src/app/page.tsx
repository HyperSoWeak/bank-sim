import Link from "next/link";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md p-10 bg-gray-850 rounded-2xl shadow-2xl ring-1 ring-gray-700/50 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-5">🏦 Bank Simulator</h1>
        <p className="text-base text-gray-400 mb-10">Start your financial journey below.</p>

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
