type Props = {
  data: unknown;
};

export function RecommendationsCard({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700">AI Recommendations</h3>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

