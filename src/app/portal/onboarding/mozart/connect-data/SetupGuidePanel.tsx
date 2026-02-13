import { Card } from "@/components/ui/Card";

export function SetupGuidePanel() {
  const steps = [
    { label: "Connect your data", href: "#" },
    { label: "Explore your data", href: "#" },
    { label: "Transform your data", href: "#" },
    { label: "Use your data", href: "#" },
  ];

  return (
    <Card className="p-4 space-y-4 sticky top-6 border border-slate-200 shadow-sm bg-white">
      <div className="text-sm font-semibold text-slate-900">Company Setup Guide</div>
      <div className="space-y-2">
        {steps.map((s, idx) => (
          <a
            key={s.label}
            href={s.href}
            className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 transition"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs">
              {idx + 1}
            </span>
            <span>{s.label}</span>
          </a>
        ))}
      </div>
      <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold">Useful Links</summary>
        <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-slate-600">
          <li>
            <a href="#" className="hover:underline">
              Documentation
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Support
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Status page
            </a>
          </li>
        </ul>
      </details>
    </Card>
  );
}
