import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">
        Zordrax Analytica Onboarding Wizard
      </h1>
      <p className="text-gray-600 mb-6">
        Start your AI-assisted onboarding or proceed manually.
      </p>
      <div className="space-x-4">
        <Link href="/wizard" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
          AI Flow
        </Link>
        <Link href="/review" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300">
          Manual Flow
        </Link>
      </div>
    </main>
  );
}
