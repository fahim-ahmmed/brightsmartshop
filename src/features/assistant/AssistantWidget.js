'use client';

import { useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { formatPoints, formatTaka } from '@/lib/format';

const GREETING = { from: 'bot', text: 'Hi! Ask me to find products, deals or help with your order.', products: [] };

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, open]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text, products: [] }]);
    setBusy(true);
    try {
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      setMessages((m) => [...m, { from: 'bot', text: data.reply, products: data.products || [] }]);
    } catch {
      setMessages((m) => [...m, { from: 'bot', text: 'Something went wrong. Please try again.', products: [] }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <section aria-label="Smart Assistant" className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-divider bg-background shadow-xl">
          <header className="flex items-start justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-xs font-semibold tracking-wide opacity-80">BRIGHT SMART AI</p>
              <p className="text-lg font-semibold">How can we help?</p>
            </div>
            <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)} className="text-2xl leading-none">
              ×
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? 'text-right' : ''}>
                <p className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-content2'}`}>{m.text}</p>
                {m.products.length > 0 && (
                  <ul className="mt-2 grid gap-2 text-left">
                    {m.products.map((p) => (
                      <li key={p.slug}>
                        <NextLink href={`/product/${p.slug}`} onClick={() => setOpen(false)} className="block rounded-xl border border-divider p-2 text-sm hover:border-primary">
                          <strong className="block">{p.name}</strong>
                          {formatTaka(p.pricePaisa)} · {formatPoints(p.pointsX100)} Point
                        </NextLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-divider p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={200} placeholder="Ask about a product" aria-label="Your message" className="h-10 flex-1 rounded-xl border border-divider px-3 text-sm outline-none focus:border-primary" />
            <button type="submit" disabled={busy} aria-label="Send" className="h-10 w-10 rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
              ➤
            </button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg hover:opacity-90">
        <span aria-hidden="true">✨</span> Smart Assistant
      </button>
    </div>
  );
}
