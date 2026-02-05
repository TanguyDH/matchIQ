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
        className="w-full flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
      >
        <span className={selectedLabel ? 'text-gray-100' : 'text-gray-600'}>
          {selectedLabel ?? 'Select metric…'}
        </span>
        <span className="text-gray-600">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 flex flex-col">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sticky top-0 bg-gray-800 border-b border-gray-700 px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none"
          />

          <div className="overflow-y-auto flex-1">
            {grouped.length === 0 && <p className="px-3 py-3 text-xs text-gray-600">No results</p>}
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="px-3 pt-2 pb-0.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                        ? 'bg-emerald-600/20 text-emerald-400'
                        : 'text-gray-300 hover:bg-gray-700'
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
