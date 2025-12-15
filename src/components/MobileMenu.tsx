'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:text-white"
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 transform bg-slate-900 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <span className="font-semibold text-white">Menu</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-slate-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-4 p-4 text-slate-300">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          <Link href="/portal" onClick={() => setOpen(false)}>Portal</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
        </nav>
      </div>
    </>
  );
}
