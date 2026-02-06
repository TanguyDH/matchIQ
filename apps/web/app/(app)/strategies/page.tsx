'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Strategy, Rule, COMPARATOR_LABELS, TEAM_SCOPES, metricLabel } from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import Toggle from '@/components/Toggle';

// ─── Actions dropdown ────────────────────────────────────────────────────────

function ActionsMenu({ strategy, onDelete }: { strategy: Strategy; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
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
                onDelete();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Format rule display ──────────────────────────────────────────────────────

function formatRule(rule: Rule): string {
  const metric = metricLabel(rule.metric);
  const comparator = COMPARATOR_LABELS[rule.comparator];
  const teamScope = rule.team_scope
    ? TEAM_SCOPES.find((t) => t.value === rule.team_scope)?.label
    : null;

  if (teamScope) {
    return `${metric} (${teamScope}) ${comparator} ${rule.value}`;
  }
  return `${metric} ${comparator} ${rule.value}`;
}

// ─── Expandable strategy row ──────────────────────────────────────────────────

function StrategyRow({ strategy, onToggle, onDelete }: {
  strategy: Strategy;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  const fetchRules = async () => {
    if (rules.length > 0) return; // Already loaded
    setLoadingRules(true);
    try {
      const data = await api.getRules(token, strategy.id);
      setRules(data);
    } catch (e) {
      console.error('Failed to load rules:', e);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleExpand = () => {
    if (!expanded) fetchRules();
    setExpanded(!expanded);
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.deleteRule(token, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (e) {
      console.error('Failed to delete rule:', e);
    }
  };

  return (
    <>
      <tr
        className="border-b border-gray-900 hover:bg-gray-900/40 transition-colors cursor-pointer"
        onClick={handleExpand}
      >
        <td className="py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExpand();
              }}
              className="text-gray-400 hover:text-gray-200 transition-transform"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </button>
            <div>
              <p className="text-sm font-medium text-gray-100">{strategy.name}</p>
              <p className="text-xs text-gray-500">{strategy.desired_outcome ?? '—'}</p>
            </div>
          </div>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <span className="text-sm text-gray-300">0</span>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <span className="text-sm text-gray-300">0%</span>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <Toggle on={strategy.is_active} onToggle={onToggle} />
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <ActionsMenu strategy={strategy} onDelete={onDelete} />
        </td>
      </tr>

      {/* Expanded rules section */}
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-gray-950/50 px-4 py-4">
            <div className="ml-8">
              <p className="text-xs text-gray-400 mb-3">Alert me of live matches where:</p>

              {loadingRules && (
                <p className="text-xs text-gray-500">Loading rules...</p>
              )}

              {!loadingRules && rules.length === 0 && (
                <p className="text-xs text-gray-500 mb-3">No rules yet</p>
              )}

              {!loadingRules && rules.map((rule, idx) => (
                <div key={rule.id}>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm text-gray-200">{formatRule(rule)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/strategies/${strategy.id}/rules/add`)}
                        className="text-gray-400 hover:text-emerald-500 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {idx < rules.length - 1 && (
                    <p className="text-xs text-gray-600 py-1">and</p>
                  )}
                </div>
              ))}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => router.push(`/strategies/${strategy.id}/rules/add`)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Rule
                </button>
                <button
                  disabled
                  className="bg-gray-800 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50"
                >
                  ⏱ History
                </button>
                <button
                  disabled
                  className="bg-gray-800 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50"
                >
                  🏆 Leagues: Default
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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

  const handleDelete = async (strategy: Strategy) => {
    if (!confirm(`Are you sure you want to delete "${strategy.name}"?`)) return;

    try {
      await api.deleteStrategy(token, strategy.id);
      setStrategies((prev) => prev.filter((s) => s.id !== strategy.id));
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
                <StrategyRow
                  key={s.id}
                  strategy={s}
                  onToggle={() => handleToggle(s)}
                  onDelete={() => handleDelete(s)}
                />
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
                <ActionsMenu strategy={s} onDelete={() => handleDelete(s)} />
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
