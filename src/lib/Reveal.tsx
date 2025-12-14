'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PropsWithChildren } from 'react';

type RevealProps = PropsWithChildren<{
  delay?: number;        // seconds
  y?: number;            // initial translateY
  once?: boolean;        // animate only first time in view
  className?: string;
}>;

/**
 * Smooth slide+fade in when the element enters the viewport.
 * Respects prefers-reduced-motion.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 16,
  once = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();

  // If user prefers reduced motion, disable transforms and use quick fade
  const initial = reduce ? { opacity: 0 } : { opacity: 0, y };
  const animate = reduce ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={animate}
      viewport={{ once, amount: 0.20 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
