'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Strategy,
  Rule,
  TimeFilter,
  COMPARATOR_LABELS,
  TEAM_SCOPES,
  RuleExpression,
  RuleValue,
  metricLabel,
} from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import Toggle from '@/components/Toggle';
import LeagueSelector from '@/components/LeagueSelector';

// ─── Actions dropdown ────────────────────────────────────────────────────────

function ActionsMenu({
  onDelete,
  onRename,
  onEdit,
}: {
  onDelete: () => void;
  onRename: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
        className="px-1.5 py-0.5 text-[#475569] hover:text-[#f1f5f9] rounded text-lg leading-none transition-colors"
      >
        ⋮
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-40 bg-[#1e293b] border border-[#334155] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] py-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#94a3b8] hover:bg-[#334155] transition-colors"
            >
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#94a3b8] hover:bg-[#334155] transition-colors"
            >
              Edit goal
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#f87171] hover:bg-[#334155] transition-colors"
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

function formatTimeFilter(tf: TimeFilter): string {
  switch (tf.mode) {
    case 'as_of_minute':
      return `@ min ${tf.x}`;
    case 'x_minutes_ago':
      return `${tf.x} min ago`;
    case 'between':
      return `min ${tf.x}–${tf.y}`;
    case 'past_x':
      return `last ${tf.x} min`;
    case 'since_minute':
      return `since min ${tf.x}`;
    case 'during_2nd_half':
      return `2nd half`;
    case 'as_of_halftime':
      return `@ HT`;
    default:
      return '';
  }
}

function formatRuleValue(rv: RuleValue): string {
  if (rv.kind === 'number') return String(rv.number ?? '?');
  if (!rv.metric) return '?';
  const label = metricLabel(rv.metric);
  const parts: string[] = [label];
  if (rv.team_scope) parts.push(`(${rv.team_scope})`);
  if (rv.time_filter && rv.time_filter.mode !== 'off') {
    parts.push(`⏱ ${formatTimeFilter(rv.time_filter)}`);
  }
  return parts.join(' ');
}

function formatExpression(expr: RuleExpression): string {
  const left = formatRuleValue(expr.left);
  if (!expr.op || !expr.right) return left;
  const opLabel = expr.op === '*' ? '×' : expr.op === '/' ? '÷' : expr.op;
  return `${left} ${opLabel} ${formatRuleValue(expr.right)}`;
}

function formatRule(rule: Rule): string {
  const comparator = COMPARATOR_LABELS[rule.comparator];

  if (rule.lhs_json && rule.rhs_json) {
    return `${formatExpression(rule.lhs_json)} ${comparator} ${formatExpression(rule.rhs_json)}`;
  }

  const metric = metricLabel(rule.metric);
  const teamScope = rule.team_scope
    ? TEAM_SCOPES.find((t) => t.value === rule.team_scope)?.label
    : null;
  const timeLabel =
    rule.time_filter && rule.time_filter.mode !== 'off'
      ? ` ⏱ ${formatTimeFilter(rule.time_filter)}`
      : '';

  if (teamScope) {
    return `${metric} (${teamScope}) ${comparator} ${rule.value}${timeLabel}`;
  }
  return `${metric} ${comparator} ${rule.value}${timeLabel}`;
}

// ─── Mobile strategy card ─────────────────────────────────────────────────────

function StrategyCard({
  strategy,
  onToggle,
  onDelete,
  onRename,
  onLeagueChange,
}: {
  strategy: Strategy;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (newName: string) => Promise<void>;
  onLeagueChange: (ids: number[]) => void;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(strategy.name);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);

  const fetchRules = async () => {
    if (rules.length > 0) return;
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
    setExpanded((s) => !s);
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.deleteRule(token, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (e) {
      console.error('Failed to delete rule:', e);
    }
  };

  const handleSaveName = async () => {
    if (editedName.trim() === '' || editedName === strategy.name) {
      setEditedName(strategy.name);
      setIsEditingName(false);
      return;
    }
    try {
      await onRename(editedName.trim());
      setIsEditingName(false);
    } catch {
      setEditedName(strategy.name);
      setIsEditingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') {
      setEditedName(strategy.name);
      setIsEditingName(false);
    }
  };

  return (
    <div
      className={`bg-[#1e293b] border rounded-xl transition-colors ${expanded ? 'border-[#10b981]/40' : 'border-[#334155]'}`}
    >
      {/* Header — always visible */}
      <div className="p-4 flex items-center gap-3">
        {/* Clickable zone: chevron + name */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleExpand}
          onKeyDown={(e) => e.key === 'Enter' && handleExpand()}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          <span
            className="text-[#475569] transition-transform duration-200 flex-shrink-0"
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="text-sm font-semibold bg-[#0f172a] text-[#f1f5f9] border border-[#10b981] rounded px-2 py-0.5 focus:outline-none w-full"
              />
            ) : (
              <p className="text-sm font-semibold text-[#f1f5f9] truncate">{strategy.name}</p>
            )}
            {strategy.desired_outcome && (
              <p className="text-[11px] text-[#475569] mt-0.5 truncate">
                {strategy.desired_outcome}
              </p>
            )}
          </div>
        </div>

        {/* Non-interactive controls — outside clickable zone */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] font-mono text-[#475569]">
            <span className="text-[#94a3b8]">{strategy.total_triggers ?? 0}</span> picks
          </span>
          <span
            className={`text-[11px] font-mono font-semibold ${
              strategy.hit_rate && parseFloat(strategy.hit_rate) >= 55
                ? 'text-[#10b981]'
                : strategy.hit_rate && parseFloat(strategy.hit_rate) >= 40
                  ? 'text-[#fbbf24]'
                  : 'text-[#475569]'
            }`}
          >
            {strategy.hit_rate ? `${parseFloat(strategy.hit_rate).toFixed(0)}%` : '—'}
          </span>
          <Toggle on={strategy.is_active} onToggle={onToggle} />
          <ActionsMenu
            onDelete={onDelete}
            onRename={() => setIsEditingName(true)}
            onEdit={() => router.push(`/strategies/${strategy.id}/edit`)}
          />
        </div>
      </div>

      {/* Expandable panel */}
      {expanded && (
        <div className="border-t border-[#334155] bg-[#0f172a] px-4 py-4 rounded-b-xl">
          <p className="text-[10px] text-[#475569] font-mono mb-3 uppercase tracking-wider">
            Alert me if:
          </p>

          {loadingRules && <p className="text-xs text-[#475569] font-mono">Loading…</p>}
          {!loadingRules && rules.length === 0 && (
            <p className="text-xs text-[#475569] mb-3">No rules configured</p>
          )}

          {!loadingRules &&
            rules.map((rule, idx) => (
              <div key={rule.id}>
                <div className="flex items-center justify-between py-2">
                  <p className="text-xs font-mono text-[#94a3b8]">{formatRule(rule)}</p>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-[#475569] hover:text-[#f87171] transition-colors ml-2 flex-shrink-0"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                {idx < rules.length - 1 && (
                  <p className="text-[10px] text-[#475569] font-mono py-0.5 uppercase tracking-widest">
                    and
                  </p>
                )}
              </div>
            ))}

          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => router.push(`/strategies/${strategy.id}/rules/add`)}
              className="bg-[#10b981] hover:bg-[#34d399] text-[#0f172a] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              + Rule
            </button>
            <button
              onClick={() => router.push(`/strategies/${strategy.id}/history`)}
              className="bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              History
            </button>
            <button
              onClick={() => setShowLeagueSelector(true)}
              className="bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              🏆{' '}
              {!strategy.league_ids || strategy.league_ids.length === 0
                ? 'All leagues'
                : `${strategy.league_ids.length} league${strategy.league_ids.length > 1 ? 's' : ''}`}
            </button>
          </div>

          {showLeagueSelector && (
            <LeagueSelector
              token={token}
              selectedIds={strategy.league_ids ?? []}
              onClose={() => setShowLeagueSelector(false)}
              onSave={(ids) => {
                onLeagueChange(ids);
                setShowLeagueSelector(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Expandable strategy row ──────────────────────────────────────────────────

function StrategyRow({
  strategy,
  onToggle,
  onDelete,
  onRename,
  onLeagueChange,
}: {
  strategy: Strategy;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (newName: string) => Promise<void>;
  onLeagueChange: (ids: number[]) => void;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(strategy.name);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);

  const fetchRules = async () => {
    if (rules.length > 0) return;
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

  const handleSaveName = async () => {
    if (editedName.trim() === '' || editedName === strategy.name) {
      setEditedName(strategy.name);
      setIsEditingName(false);
      return;
    }
    try {
      await onRename(editedName.trim());
      setIsEditingName(false);
    } catch {
      setEditedName(strategy.name);
      setIsEditingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') {
      setEditedName(strategy.name);
      setIsEditingName(false);
    }
  };

  return (
    <>
      <tr
        className={`border-b transition-colors ${expanded ? 'border-[#10b981]/20 bg-[#1e293b]/40' : 'border-[#334155] hover:bg-[#1e293b]/30'}`}
      >
        <td className="py-3 pr-4">
          <button
            type="button"
            onClick={handleExpand}
            className="flex items-center gap-3 group w-full text-left"
          >
            {/* Animated chevron */}
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:bg-[#334155] text-[#475569] group-hover:text-[#f1f5f9]"
              style={{
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                display: 'inline-flex',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4 2.5l4 3.5-4 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <div>
              {isEditingName ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="text-sm font-semibold bg-[#0f172a] text-[#f1f5f9] border border-[#10b981] rounded px-2 py-0.5 focus:outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-[#f1f5f9] group-hover:text-[#10b981] transition-colors">
                  {strategy.name}
                </p>
              )}
              {strategy.desired_outcome && (
                <p className="text-[11px] text-[#475569]">{strategy.desired_outcome}</p>
              )}
            </div>
          </button>
        </td>
        <td className="py-3" onClick={(e) => e.stopPropagation()}>
          <span className="text-sm font-mono text-[#94a3b8]">{strategy.total_triggers ?? 0}</span>
        </td>
        <td className="py-3" onClick={(e) => e.stopPropagation()}>
          <span
            className={`text-sm font-mono font-semibold ${
              strategy.hit_rate && parseFloat(strategy.hit_rate) >= 55
                ? 'text-[#10b981]'
                : strategy.hit_rate && parseFloat(strategy.hit_rate) >= 40
                  ? 'text-[#fbbf24]'
                  : 'text-[#475569]'
            }`}
          >
            {strategy.hit_rate ? `${parseFloat(strategy.hit_rate).toFixed(1)}%` : '—'}
          </span>
        </td>
        <td className="py-3" onClick={(e) => e.stopPropagation()}>
          <Toggle on={strategy.is_active} onToggle={onToggle} />
        </td>
        <td className="py-3" onClick={(e) => e.stopPropagation()}>
          <ActionsMenu
            onDelete={onDelete}
            onRename={() => setIsEditingName(true)}
            onEdit={() => router.push(`/strategies/${strategy.id}/edit`)}
          />
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="bg-[#0f172a] px-4 py-4 border-b border-[#334155]">
            <div className="ml-8">
              <p className="text-xs text-[#475569] font-mono mb-3 uppercase tracking-wider">
                Alert me if:
              </p>

              {loadingRules && <p className="text-xs text-[#475569] font-mono">Loading…</p>}

              {!loadingRules && rules.length === 0 && (
                <p className="text-xs text-[#475569] mb-3">No rules</p>
              )}

              {!loadingRules &&
                rules.map((rule, idx) => (
                  <div key={rule.id}>
                    <div className="flex items-center justify-between py-2">
                      <p className="text-sm font-mono text-[#94a3b8]">{formatRule(rule)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/strategies/${strategy.id}/rules/add`)}
                          className="text-[#475569] hover:text-[#10b981] transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-[#475569] hover:text-[#f87171] transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {idx < rules.length - 1 && (
                      <p className="text-[10px] text-[#475569] font-mono py-1 uppercase tracking-widest">
                        and
                      </p>
                    )}
                  </div>
                ))}

              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => router.push(`/strategies/${strategy.id}/rules/add`)}
                  className="bg-[#10b981] hover:bg-[#34d399] text-[#0f172a] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add rule
                </button>
                <button
                  onClick={() => router.push(`/strategies/${strategy.id}/history`)}
                  className="bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  History
                </button>
                <button
                  onClick={() => setShowLeagueSelector(true)}
                  className="bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  🏆{' '}
                  {!strategy.league_ids || strategy.league_ids.length === 0
                    ? 'Leagues: All'
                    : `Leagues: ${strategy.league_ids.length}`}
                </button>
                {showLeagueSelector && (
                  <LeagueSelector
                    token={token}
                    selectedIds={strategy.league_ids ?? []}
                    onClose={() => setShowLeagueSelector(false)}
                    onSave={(ids) => {
                      onLeagueChange(ids);
                      setShowLeagueSelector(false);
                    }}
                  />
                )}
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
  const [defaultLeagueIds, setDefaultLeagueIds] = useState<number[]>([]);
  const [showGlobalSelector, setShowGlobalSelector] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [strategies, settings] = await Promise.all([
        api.getStrategies(token),
        api.getUserSettings(token),
      ]);
      setStrategies(strategies);
      setDefaultLeagueIds(settings.default_league_ids ?? []);
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
    if (!confirm(`Delete "${strategy.name}"?`)) return;
    try {
      await api.deleteStrategy(token, strategy.id);
      setStrategies((prev) => prev.filter((s) => s.id !== strategy.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRename = async (strategyId: string, newName: string) => {
    setStrategies((prev) => prev.map((s) => (s.id === strategyId ? { ...s, name: newName } : s)));
    try {
      await api.patchStrategy(token, strategyId, { name: newName });
    } catch (e) {
      fetchAll();
      throw e;
    }
  };

  const handleGlobalLeagueChange = async (ids: number[]) => {
    setDefaultLeagueIds(ids);
    await api.updateUserSettings(token, ids.length > 0 ? ids : null);
  };

  const handleLeagueChange = async (strategyId: string, ids: number[]) => {
    const leagueIds = ids.length > 0 ? ids : null;
    setStrategies((prev) =>
      prev.map((s) => (s.id === strategyId ? { ...s, league_ids: leagueIds } : s)),
    );
    try {
      await api.patchStrategy(token, strategyId, { league_ids: leagueIds });
    } catch {
      fetchAll();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl text-[#f1f5f9] tracking-wide leading-none">
            STRATEGIES
          </h1>
          {!loading && strategies.length > 0 && (
            <p className="text-xs text-[#475569] font-mono mt-1">
              {strategies.length} strateg{strategies.length > 1 ? 'ies' : 'y'} configured
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/strategies/create')}
          className="bg-[#10b981] hover:bg-[#34d399] text-[#0f172a] text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
        >
          + New
        </button>
      </div>

      {/* Global league filter */}
      {!loading && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] text-[#334155] font-mono uppercase tracking-widest">
            Default leagues
          </span>
          <button
            onClick={() => setShowGlobalSelector(true)}
            className="text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors"
          >
            {defaultLeagueIds.length === 0 ? 'All' : `${defaultLeagueIds.length} selected`}
            {' ↗'}
          </button>
        </div>
      )}

      {showGlobalSelector && (
        <LeagueSelector
          token={token}
          selectedIds={defaultLeagueIds}
          onClose={() => setShowGlobalSelector(false)}
          onSave={(ids) => {
            handleGlobalLeagueChange(ids);
            setShowGlobalSelector(false);
          }}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <span className="text-[#475569] text-sm font-mono">Loading…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && <p className="text-[#f87171] text-xs font-mono mt-2">{error}</p>}

      {/* Empty state */}
      {!loading && !error && strategies.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#334155] rounded-xl">
          <p className="text-sm text-[#475569]">No strategies yet</p>
          <button
            onClick={() => router.push('/strategies/create')}
            className="mt-3 text-[#10b981] text-xs hover:text-[#34d399] transition-colors"
          >
            Create your first one →
          </button>
        </div>
      )}

      {/* Desktop table */}
      {!loading && strategies.length > 0 && (
        <div className="hidden sm:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="pb-3 text-[10px] font-mono font-medium text-[#475569] uppercase tracking-widest">
                  Name / Goal
                </th>
                <th className="pb-3 text-[10px] font-mono font-medium text-[#475569] uppercase tracking-widest">
                  Picks
                </th>
                <th className="pb-3 text-[10px] font-mono font-medium text-[#475569] uppercase tracking-widest">
                  Hit %
                </th>
                <th className="pb-3 text-[10px] font-mono font-medium text-[#475569] uppercase tracking-widest">
                  Status
                </th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <StrategyRow
                  key={s.id}
                  strategy={s}
                  onToggle={() => handleToggle(s)}
                  onDelete={() => handleDelete(s)}
                  onRename={(newName) => handleRename(s.id, newName)}
                  onLeagueChange={(ids) => handleLeagueChange(s.id, ids)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && strategies.length > 0 && (
        <div className="sm:hidden space-y-3">
          {strategies.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              onToggle={() => handleToggle(s)}
              onDelete={() => handleDelete(s)}
              onRename={(newName) => handleRename(s.id, newName)}
              onLeagueChange={(ids) => handleLeagueChange(s.id, ids)}
            />
          ))}
        </div>
      )}
    </>
  );
}
