'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

export default function VideoFadeIn({
  src,
  poster,
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -20% 0px', threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={
        `w-full rounded-2xl ring-1 ring-white/10 shadow/50 ` +
        `transition-all duration-700 ease-out ` +
        (visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6') +
        ` ${className}`
      }
      playsInline
      preload="metadata"
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      poster={poster}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
