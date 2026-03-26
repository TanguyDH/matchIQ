'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GalleryStrategy,
  Rule,
  COMPARATOR_LABELS,
  TEAM_SCOPES,
  TimeFilter,
  RuleExpression,
  RuleValue,
  metricLabel,
} from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

// ─── Rule formatting (same as strategies page) ────────────────────────────────

function formatTimeFilter(tf: TimeFilter): string {
  switch (tf.mode) {
    case 'as_of_minute': return `@ min ${tf.x}`;
    case 'x_minutes_ago': return `${tf.x} min ago`;
    case 'between': return `min ${tf.x}–${tf.y}`;
    case 'past_x': return `last ${tf.x} min`;
    case 'since_minute': return `since min ${tf.x}`;
    case 'during_2nd_half': return `2nd half`;
    case 'as_of_halftime': return `@ HT`;
    default: return '';
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
  if (teamScope) return `${metric} (${teamScope}) ${comparator} ${rule.value}${timeLabel}`;
  return `${metric} ${comparator} ${rule.value}${timeLabel}`;
}

// ─── Gallery card ─────────────────────────────────────────────────────────────

function GalleryCard({
  strategy,
  onImport,
  importing,
}: {
  strategy: GalleryStrategy;
  onImport: () => void;
  importing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#f1f5f9] truncate">{strategy.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {strategy.desired_outcome && (
              <span className="text-[10px] font-mono text-[#10b981] bg-[rgba(16,185,129,0.1)] px-1.5 py-0.5 rounded">
                {strategy.desired_outcome}
              </span>
            )}
            <span className="text-[10px] font-mono text-[#475569] bg-[#0f172a] px-1.5 py-0.5 rounded">
              {strategy.alert_type === 'IN_PLAY' ? 'Live' : 'Pre-match'}
            </span>
            <span className="text-[10px] font-mono text-[#475569]">
              {strategy.rules.length} rule{strategy.rules.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <button
          onClick={onImport}
          disabled={importing}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10b981] hover:bg-[#34d399] text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
        >
          {importing ? '…' : 'Import'}
        </button>
      </div>

      {/* Rules toggle */}
      {strategy.rules.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((s) => !s)}
            className="text-[10px] font-mono text-[#475569] hover:text-[#94a3b8] transition-colors text-left"
          >
            {expanded ? '▾ Hide rules' : '▸ Show rules'}
          </button>

          {expanded && (
            <div className="space-y-1.5 border-t border-[#334155] pt-3">
              {strategy.rules.map((rule, i) => (
                <div key={rule.id ?? i} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#334155] w-4 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-[11px] font-mono text-[#64748b]">
                    {formatRule(rule)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [strategies, setStrategies] = useState<GalleryStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    api
      .getGallery(token)
      .then(setStrategies)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleImport = async (strategyId: string) => {
    if (!token) return;
    setImporting(strategyId);
    try {
      await api.importFromGallery(token, strategyId);
      setImported((prev) => new Set(prev).add(strategyId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push('/strategies')}
          className="text-[#475569] hover:text-[#f1f5f9] text-sm transition-colors"
        >
          ←
        </button>
        <span className="text-xs text-[#475569] font-mono">
          Strategies
          <span className="text-[#334155] mx-1.5">/</span>
          <span className="text-[#f1f5f9]">Gallery</span>
        </span>
        {!loading && strategies.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-[#475569]">
            {strategies.length} template{strategies.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="text-xs text-[#475569] font-mono mb-6">
        Ready-to-use strategy templates. Import one to add it to your strategies — it will be active immediately.
      </p>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <span className="text-[#475569] text-sm font-mono">Loading…</span>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-[#f87171] text-xs font-mono mb-4">{error}</p>}

      {/* Empty */}
      {!loading && !error && strategies.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#334155] rounded-xl">
          <p className="text-sm text-[#475569]">No templates yet</p>
        </div>
      )}

      {/* Grid */}
      {!loading && strategies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {strategies.map((s) => (
            <div key={s.id} className="relative">
              {imported.has(s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(15,23,42,0.85)] rounded-xl z-10">
                  <span className="text-[#10b981] text-xs font-mono font-semibold">
                    ✓ Imported
                  </span>
                </div>
              )}
              <GalleryCard
                strategy={s}
                onImport={() => handleImport(s.id)}
                importing={importing === s.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Go to strategies */}
      {imported.size > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push('/strategies')}
            className="text-xs font-mono text-[#10b981] hover:text-[#34d399] transition-colors"
          >
            Go to my strategies →
          </button>
        </div>
      )}
    </div>
  );
}
