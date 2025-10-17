type Props = {
  title: string;
  details: Record<string, string>;
};

export default function RecommendationCard({ title, details }: Props) {
  return (
    <div className="rounded-2xl shadow-md bg-white p-4 hover:shadow-lg transition">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <ul className="text-sm text-gray-700">
        {Object.entries(details).map(([key, val]) => (
          <li key={key}>
            <strong>{key}:</strong> {val}
          </li>
        ))}
      </ul>
    </div>
  );
}
