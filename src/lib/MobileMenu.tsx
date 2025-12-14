'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Menu } from 'lucide-react'; // lucide-react is already in Next.js deps

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (

    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center p-2 text-slate-700 hover:text-white"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700" >
          <span className="font-semibold text-white">Menu</span>
          <button onClick={() => setOpen(false)}>
            <X size={22} className="text-slate-300" />
          </button>
        </div>
        <nav className="flex flex-col gap-4 p-4 text-slate-300">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          <Link href="/portal" onClick={() => setOpen(false)}>Portal</Link>
          <Link href="/services" onClick={() => setOpen(false)}>Services</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
        </nav>
      </div>
    </>
  );
}
