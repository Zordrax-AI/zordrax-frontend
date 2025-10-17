import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center space-y-6">
      <h1 className="text-3xl font-bold text-blue-700">
        Zordrax Analytica Onboarding Wizard
      </h1>
      <p className="text-gray-600">
        Start your onboarding journey with AI assistance or manual setup.
      </p>
      <div className="space-x-4">
        <Link
          href="/wizard"
          className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          AI Flow
        </Link>
        <Link
          href="/manual"
          className="bg-gray-200 text-gray-900 px-5 py-2 rounded-xl hover:bg-gray-300 transition"
        >
          Manual Flow
        </Link>
      </div>
    </main>
  );
}
