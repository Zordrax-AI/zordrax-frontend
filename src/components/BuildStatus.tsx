type Props = {
  statusText: string | null;
  warning?: string | null;
};

export function BuildStatus({ statusText, warning }: Props) {
  if (!statusText && !warning) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
      {statusText ? <p className="font-semibold">{statusText}</p> : null}
      {warning ? <p className="mt-2 text-xs text-amber-700">{warning}</p> : null}
    </div>
  );
}

