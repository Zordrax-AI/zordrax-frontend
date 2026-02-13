"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  slug: string;
  alt: string;
  size?: number;
};

export function Logo({ slug, alt, size = 36 }: Props) {
  const [failed, setFailed] = useState(false);
  const srcSvg = `/connectors/${slug}.svg`;
  const srcPng = `/connectors/${slug}.png`;

  if (failed) {
    return (
      <div className="flex items-center justify-center rounded-md bg-slate-100 border border-slate-200 w-12 h-12 text-slate-500 text-sm font-semibold">
        {alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center rounded-md bg-white/60 border border-slate-200 w-12 h-12 overflow-hidden">
      <Image
        src={srcSvg}
        alt={alt}
        width={size}
        height={size}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.src.endsWith(".svg")) {
            img.src = srcPng;
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
