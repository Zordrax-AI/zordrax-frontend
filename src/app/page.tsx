"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <h2 className="text-sm uppercase tracking-wide text-blue-600 font-semibold mb-2">
        Zordrax Analytica
      </h2>

      <h1 className="text-4xl font-bold text-center mb-4">
        Deploy adaptive data infrastructure in minutes.
      </h1>

      <p className="text-gray-600 text-center max-w-xl mb-12">
        Choose between AI-guided orchestration or a manual run.
      </p>

      <div className="flex gap-8">
        {/* AI Card */}
        <Link href="/wizard/questions">
          <div className="cursor-pointer border rounded-xl p-6 w-80 bg-white shadow hover:shadow-md transition">
            <p className="text-xs text-blue-600 font-semibold">START HERE</p>
            <h3 className="text-xl font-bold mb-1">AI Deploy Architecture</h3>
            <p className="text-gray-600">
              Let the AI orchestrator provision the recommended architecture.
            </p>
          </div>
        </Link>

        {/* Manual Card */}
        <Link href="/wizard/deploy">
          <div className="cursor-pointer border rounded-xl p-6 w-80 bg-white shadow hover:shadow-md transition">
            <p className="text-xs text-blue-600 font-semibold">START HERE</p>
            <h3 className="text-xl font-bold mb-1">Manual Deploy</h3>
            <p className="text-gray-600">
              Trigger a manual deployment run with your curated configuration.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
