'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Strategy } from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import Toggle from '@/components/Toggle';

// ─── Actions dropdown ────────────────────────────────────────────────────────

function ActionsMenu({ strategy, onDuplicate }: { strategy: Strategy; onDuplicate: () => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="px-1.5 py-0.5 text-gray-400 hover:text-gray-200 rounded text-lg leading-none"
      >
        ⋮
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-0.5">
            <button
              onClick={() => {
                router.push(`/strategies/${strategy.id}`);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDuplicate();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
            >
              Duplicate
            </button>
            <div className="border-t border-gray-700 my-0.5" />
            <button
              disabled
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 opacity-40 cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrategiesPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStrategies(await api.getStrategies(token));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleToggle = async (strategy: Strategy) => {
    const next = !strategy.is_active;
    setStrategies((prev) =>
      prev.map((s) => (s.id === strategy.id ? { ...s, is_active: next } : s)),
    );
    try {
      await api.patchStrategy(token, strategy.id, { is_active: next });
    } catch {
      fetchAll();
    }
  };

  const handleDuplicate = async (strategy: Strategy) => {
    try {
      await api.createStrategy(token, {
        name: `${strategy.name} (copy)`,
        description: strategy.description ?? undefined,
        mode: strategy.mode,
        alert_type: strategy.alert_type,
        desired_outcome: strategy.desired_outcome ?? undefined,
      });
      fetchAll();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold tracking-wide">Strategies</h1>
        <button
          onClick={() => router.push('/strategies/create')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          + New
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <span className="text-gray-600 text-sm">Loading…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {/* Empty state */}
      {!loading && !error && strategies.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-600">
          <p className="text-sm">No strategies yet</p>
          <button
            onClick={() => router.push('/strategies/create')}
            className="mt-2 text-emerald-500 text-xs hover:underline"
          >
            Create your first →
          </button>
        </div>
      )}

      {/* Desktop table */}
      {!loading && strategies.length > 0 && (
        <div className="hidden sm:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Outcome
                </th>
                <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Picks
                </th>
                <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hit %
                </th>
                <th className="pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-900 hover:bg-gray-900/40 transition-colors"
                >
                  <td className="py-2">
                    <p className="text-sm font-medium text-gray-100">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.desired_outcome ?? '—'}</p>
                  </td>
                  <td>
                    <span className="text-sm text-gray-300">0</span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-300">0%</span>
                  </td>
                  <td>
                    <Toggle on={s.is_active} onToggle={() => handleToggle(s)} />
                  </td>
                  <td>
                    <ActionsMenu strategy={s} onDuplicate={() => handleDuplicate(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && strategies.length > 0 && (
        <div className="sm:hidden space-y-2">
          {strategies.map((s) => (
            <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.desired_outcome ?? '—'}</p>
                </div>
                <ActionsMenu strategy={s} onDuplicate={() => handleDuplicate(s)} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                <div className="flex gap-4">
                  <span className="text-xs text-gray-500">
                    Picks <span className="text-gray-300">0</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Hit% <span className="text-gray-300">0%</span>
                  </span>
                </div>
                <Toggle on={s.is_active} onToggle={() => handleToggle(s)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
