"use client";

export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
