export default function AiOnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-semibold">
          AI-Recommended Onboarding
        </h1>

        <p className="mt-4 text-slate-400">
          Answer a short set of questions. AI will generate a
          recommended analytics architecture for review.
        </p>

        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-sm text-slate-400">
            🚧 AI questionnaire and recommendation engine will appear here.
          </p>
        </div>

        <button
          disabled
          className="mt-8 rounded-md bg-slate-700 px-6 py-3 text-sm text-slate-300"
        >
          Generate (coming soon)
        </button>
      </div>
    </main>
  );
}
