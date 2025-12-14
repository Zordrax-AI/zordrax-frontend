'use client';

import { motion } from 'framer-motion';

type AnimatedBarProps = {
  label: string;
  value: number;
};

export default function AnimatedBar({ label, value }: AnimatedBarProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300"
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 5.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
