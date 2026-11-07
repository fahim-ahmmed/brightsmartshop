'use client';

import { useRef } from 'react';
import Image from 'next/image';

const SOCIALS = [
  ['facebook', 'f', 'Facebook'],
  ['linkedin', 'in', 'LinkedIn'],
  ['instagram', 'ig', 'Instagram'],
];

export default function TeamSlider({ members = [] }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };
  if (!members.length) return null;

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <button type="button" aria-label="Previous members" onClick={() => scroll(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-divider hover:border-primary">
          ←
        </button>
        <button type="button" aria-label="Next members" onClick={() => scroll(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-divider hover:border-primary">
          →
        </button>
      </div>
      <ul ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {members.map((m) => (
          <li key={m.id} className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-divider bg-content1">
            <div className="relative aspect-[4/5] bg-content2">
              {m.photo && <Image src={m.photo} alt={m.name} fill sizes="256px" className="object-cover" />}
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-sm text-default-600">{m.role}</p>
              <div className="mt-3 flex gap-2">
                {SOCIALS.filter(([key]) => m.socials[key]).map(([key, label, name]) => (
                  <a key={key} href={m.socials[key]} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on ${name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-content2 text-xs font-semibold hover:bg-primary hover:text-primary-foreground">
                    {label}
                  </a>
                ))}
              </div>
              <p className="mt-3 text-xs text-default-500">Bright Smart Shop</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
