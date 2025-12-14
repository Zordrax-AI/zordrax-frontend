export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-semibold">Contact</h1>

      <p className="mt-6 text-slate-400">
        For platform access, partnerships, or enterprise enquiries:
      </p>

      <div className="mt-10 space-y-4 text-slate-300">
        <p>
          📧 <span className="font-medium">Email:</span>{" "}
          contact@zordrax.ai
        </p>

        <p>
          🧠 <span className="font-medium">Focus:</span>{" "}
          Analytics automation, AI onboarding, governed data platforms
        </p>
      </div>
    </main>
  );
}
