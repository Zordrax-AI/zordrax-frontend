// src/components/connectors/ConnectorLogo.tsx
import Image from "next/image";
import { useState } from "react";

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
  const [src, setSrc] = useState(`/connectors/${slug}.svg`);

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => {
        if (src !== "/connectors/default.svg") {
          setSrc("/connectors/default.svg");
        }
      }}
    />
  );
}
