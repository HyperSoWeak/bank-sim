import Link from "next/link";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-semibold text-white mb-4">Bank Simulator</h1>
        <p className="text-sm text-gray-400 mb-8">Choose an option to get started.</p>

        <div className="flex flex-col space-y-4">
          <Link href="/login">
            <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Login
            </button>
          </Link>
          <Link href="/backstage">
            <button className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
              Backstage
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
