// src/components/connectors/ConnectorLogo.tsx
import Image from "next/image";

export function ConnectorLogo({
  slug,
  alt,
  size = 40,
  className = "",
}: {
  slug: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  // This will work as soon as the SVG files exist in /public/connectors/
  return (
    <Image
      src={`/connectors/${slug}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={className}
    />
  );
}
