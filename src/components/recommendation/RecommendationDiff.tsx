type Props = {
  ai: Record<string, string>;
  final: Record<string, string>;
};

export function RecommendationDiff({ ai, final }: Props) {
  return (
    <div className="space-y-2">
      {Object.keys(ai).map((k) => {
        const changed = ai[k] !== final[k];

        return (
          <div
            key={k}
            className={`grid grid-cols-3 gap-4 rounded p-2 ${
              changed ? "bg-amber-500/10" : ""
            }`}
          >
            <div className="text-xs text-slate-400">{k}</div>
            <div className="font-mono text-xs text-slate-300">{ai[k]}</div>
            <div className="font-mono text-xs text-white">{final[k]}</div>
          </div>
        );
      })}
    </div>
  );
}
