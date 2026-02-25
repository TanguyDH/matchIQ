'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MetricEntry } from '@matchiq/shared-types';

export default function MetricDropdown({
  metrics,
  selected,
  onChange,
}: {
  metrics: MetricEntry[];
  selected: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return metrics.filter((m) => m.label.toLowerCase().includes(q) || m.key.includes(q));
  }, [metrics, search]);

  const grouped = useMemo(() => {
    const map: Record<string, MetricEntry[]> = {};
    for (const m of filtered) {
      (map[m.group] ??= []).push(m);
    }
    return Object.entries(map);
  }, [filtered]);

  const selectedLabel = metrics.find((m) => m.key === selected)?.label;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((s) => !s);
          setSearch('');
        }}
        className="w-full flex items-center justify-between bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] transition-colors"
      >
        <span className={selectedLabel ? 'text-[#f1f5f9]' : 'text-[#475569]'}>
          {selectedLabel ?? 'Sélectionner une métrique…'}
        </span>
        <span className="text-[#475569]">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-[#1e293b] border border-[#334155] rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.6)] max-h-64 flex flex-col">
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sticky top-0 bg-[#0f172a] border-b border-[#334155] px-3 py-2 text-xs text-[#f1f5f9] placeholder-[#475569] focus:outline-none rounded-t-lg"
          />

          <div className="overflow-y-auto flex-1">
            {grouped.length === 0 && (
              <p className="px-3 py-3 text-xs text-[#475569]">Aucun résultat</p>
            )}
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="px-3 pt-2 pb-0.5 text-[10px] font-mono font-semibold text-[#475569] uppercase tracking-widest">
                  {group}
                </p>
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onChange(item.key);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      item.key === selected
                        ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981]'
                        : 'text-[#94a3b8] hover:bg-[#334155]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
