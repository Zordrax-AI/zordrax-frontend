type StatusBannerProps = {
  title: string;
  message: string;
  variant?: "idle" | "info" | "success" | "error";
  linkLabel?: string;
  linkHref?: string;
};

const variantStyles: Record<Exclude<StatusBannerProps["variant"], undefined>, string> = {
  idle: "border-gray-200 bg-white text-gray-700",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function StatusBanner({
  title,
  message,
  variant = "info",
  linkHref,
  linkLabel,
}: StatusBannerProps) {
  return (
    <div className={`rounded-xl border p-4 text-sm ${variantStyles[variant]}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
      {linkHref && linkLabel ? (
        <a
          href={linkHref}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-semibold underline"
        >
          {linkLabel}
        </a>
      ) : null}
    </div>
  );
}
