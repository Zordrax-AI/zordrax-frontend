interface Props {
  status: string;
}

const palette: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100",
  succeeded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
};

export function StatusPill({ status }: Props) {
  const key = status?.toLowerCase?.() || "default";
  const color = palette[key] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>;
}
