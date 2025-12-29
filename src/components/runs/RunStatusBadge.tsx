export function RunStatusBadge({ status }: { status: string }) {
  const color =
    status === "running"
      ? "bg-blue-500"
      : status === "completed"
      ? "bg-green-500"
      : status === "failed"
      ? "bg-red-500"
      : status === "canceled"
      ? "bg-yellow-500"
      : "bg-gray-500";

  return (
    <span className={`rounded px-2 py-0.5 text-xs text-white ${color}`}>
      {status}
    </span>
  );
}
