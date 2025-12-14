'use client';
import Navbar from '@/components/Navbar';
import { useState } from 'react';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'err'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const data = new FormData(e.currentTarget);
    const payload = Object.fromEntries(data.entries());
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? 'ok' : 'err');
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Contact Form */}
          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-bold">Contact</h1>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {/* honeypot (keep hidden) */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div>
                <label className="block text-sm">Name</label>
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-md bg-white/5 p-3 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md bg-white/5 p-3 ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm">Message</label>
                <textarea
                  name="message"
                  required
                  minLength={10}
                  className="mt-1 w-full rounded-md bg-white/5 p-3 ring-1 ring-white/10 h-32"
                />
              </div>

              <button
                disabled={status === 'sending'}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950"
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>

              {status === 'ok' && (
                <p className="text-green-400">
                  Thanks! We’ll get back to you shortly.
                </p>
              )}
              {status === 'err' && (
                <p className="text-red-400">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          </div>

          {/* Video on the right */}
          <div className="w-full md:w-1/2 flex justify-center">
            <video
              src="/videos/light_flicker.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="rounded-xl shadow-lg max-w-sm h-auto object-cover"
            />
          </div>
        </div>
      </main>
    </>
  );
}
