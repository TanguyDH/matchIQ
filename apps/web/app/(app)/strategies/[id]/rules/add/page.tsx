'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertType,
  Comparator,
  COMPARATOR_LABELS,
  COMPARATORS,
  Rule,
  RuleExpression,
  RuleValue,
  RuleValueType,
  Strategy,
  TimeFilter,
  metricLabel,
  metricRequiresTeamScope,
} from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import RuleChip from '@/components/RuleChip';
import ExpressionEditor, {
  ExprDraft,
  RuleValueDraft,
  TimeMode,
  makeDefaultExpr,
} from '@/components/ExpressionEditor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTimeFilter(draft: RuleValueDraft): TimeFilter | undefined {
  if (draft.timeMode === 'off') return undefined;
  const x = parseInt(draft.timeX, 10);
  const y = parseInt(draft.timeY, 10);
  switch (draft.timeMode as TimeMode) {
    case 'as_of_minute':
    case 'x_minutes_ago':
    case 'past_x':
    case 'since_minute':
      return isNaN(x) ? undefined : { mode: draft.timeMode as 'as_of_minute', x };
    case 'between':
      return isNaN(x) || isNaN(y) ? undefined : { mode: 'between', x, y };
    case 'during_2nd_half':
      return { mode: 'during_2nd_half' };
    case 'as_of_halftime':
      return { mode: 'as_of_halftime' };
    default:
      return undefined;
  }
}

function draftToRuleValue(draft: RuleValueDraft): RuleValue | null {
  if (draft.kind === 'number') {
    const n = parseFloat(draft.number);
    if (isNaN(n)) return null;
    return { kind: 'number', number: n };
  }
  if (!draft.metric) return null;
  const timeFilter = buildTimeFilter(draft);
  return {
    kind: 'metric',
    value_type: draft.valueType,
    metric: draft.metric,
    team_scope: draft.teamScope || null,
    time_filter: timeFilter ?? null,
  };
}

function draftToExpression(draft: ExprDraft): RuleExpression | null {
  const left = draftToRuleValue(draft.left);
  if (!left) return null;
  if (!draft.hasOp || !draft.op) return { left };
  const right = draftToRuleValue(draft.right);
  if (!right) return null;
  return { left, op: draft.op as '+' | '-' | '*' | '/', right };
}

function isExprDraftValid(draft: ExprDraft): boolean {
  if (!isValueDraftValid(draft.left)) return false;
  if (draft.hasOp && draft.op && !isValueDraftValid(draft.right)) return false;
  return true;
}

function isValueDraftValid(draft: RuleValueDraft): boolean {
  if (draft.kind === 'number') return draft.number !== '' && !isNaN(parseFloat(draft.number));
  if (!draft.metric) return false;
  if (metricRequiresTeamScope(draft.metric) && !draft.teamScope) return false;
  return true;
}

function formatRuleValueDraft(draft: RuleValueDraft): string {
  if (draft.kind === 'number') return draft.number || '?';
  if (!draft.metric) return '…';
  const label = metricLabel(draft.metric) || draft.metric;
  const parts: string[] = [label];
  if (draft.teamScope) parts.push(`(${draft.teamScope})`);
  if (draft.timeMode !== 'off') parts.push(`⏱ ${draft.timeMode}`);
  return parts.join(' ');
}

function formatExprDraft(draft: ExprDraft): string {
  const left = formatRuleValueDraft(draft.left);
  if (!draft.hasOp || !draft.op) return left;
  const opLabel = draft.op === '*' ? '×' : draft.op === '/' ? '÷' : draft.op;
  const right = formatRuleValueDraft(draft.right);
  return `${left} ${opLabel} ${right}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddRulePage() {
  const { token } = useAuth();
  const router = useRouter();
  const { id: strategyId } = useParams<{ id: string }>();

  // Remote state
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !strategyId) return;
    Promise.all([api.getStrategy(token, strategyId), api.getRules(token, strategyId)])
      .then(([s, r]) => {
        setStrategy(s);
        setRules(r);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [token, strategyId]);

  // Expression state
  const [lhs, setLhs] = useState<ExprDraft>(() => makeDefaultExpr('metric', 'IN_PLAY'));
  const [comparator, setComparator] = useState<Comparator>('GTE');
  const [rhs, setRhs] = useState<ExprDraft>(() => makeDefaultExpr('number', 'IN_PLAY'));

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = isExprDraftValid(lhs) && isExprDraftValid(rhs);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSave) return;

    const lhsExpr = draftToExpression(lhs);
    const rhsExpr = draftToExpression(rhs);
    if (!lhsExpr || !rhsExpr) return;

    // Determine legacy fields from LHS (for backward compat with rule engine)
    const lhsLeft = lhs.left;
    const legacyMetric = lhsLeft.kind === 'metric' && lhsLeft.metric ? lhsLeft.metric : '__expr__';
    const legacyValueType: RuleValueType =
      lhsLeft.kind === 'metric' && lhsLeft.valueType ? lhsLeft.valueType : 'IN_PLAY';
    const legacyTeamScope =
      lhsLeft.kind === 'metric' && lhsLeft.teamScope ? lhsLeft.teamScope : undefined;
    const legacyTimeFilter = lhsLeft.kind === 'metric' ? buildTimeFilter(lhsLeft) : undefined;
    const legacyValue =
      rhs.left.kind === 'number' && !rhs.hasOp ? parseFloat(rhs.left.number) || 0 : 0;

    setSaving(true);
    setSaveError(null);
    try {
      if (strategy && legacyValueType !== 'ODDS' && strategy.alert_type !== legacyValueType) {
        const updatedStrategy = await api.patchStrategy(token, strategyId, {
          alert_type: legacyValueType as AlertType,
        });
        setStrategy(updatedStrategy);
      }

      const rule = await api.createRule(token, strategyId, {
        value_type: legacyValueType,
        metric: legacyMetric,
        comparator,
        value: legacyValue,
        ...(legacyTeamScope ? { team_scope: legacyTeamScope } : {}),
        ...(legacyTimeFilter ? { time_filter: legacyTimeFilter } : {}),
        lhs_json: lhsExpr,
        rhs_json: rhsExpr,
      });
      setRules((prev) => [...prev, rule]);

      // Reset form
      setLhs(makeDefaultExpr('metric', 'IN_PLAY'));
      setRhs(makeDefaultExpr('number', 'IN_PLAY'));
      setComparator('GTE');
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.deleteRule(token, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
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
          {strategy?.name ?? '…'}
          <span className="text-[#334155] mx-1.5">/</span>
          <span className="text-[#10b981]">Add a rule</span>
        </span>
      </div>

      {loadError && <p className="text-[#f87171] text-xs font-mono mb-3">{loadError}</p>}

      {/* ── Expression builder ───────────────────────────────────────── */}
      <div className="space-y-3">
        {/* LHS */}
        <ExpressionEditor
          label="Left side"
          value={lhs}
          onChange={setLhs}
          showTimeFilter
          metricOnly
        />

        {/* Comparator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-[#334155]" />
          <select
            value={comparator}
            onChange={(e) => setComparator(e.target.value as Comparator)}
            className="bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-sm font-mono text-[#fbbf24] appearance-none focus:outline-none focus:border-[#fbbf24]/50 transition-colors cursor-pointer"
          >
            {COMPARATORS.map((c) => (
              <option key={c} value={c}>
                {COMPARATOR_LABELS[c]}
              </option>
            ))}
          </select>
          <div className="flex-1 h-px bg-[#334155]" />
        </div>

        {/* RHS */}
        <ExpressionEditor label="Right side" value={rhs} onChange={setRhs} showTimeFilter={false} />

        {/* Preview */}
        {canSave && (
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3">
            <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
              Preview
            </p>
            <p className="text-sm font-mono leading-relaxed">
              <span className="text-[#10b981]">{formatExprDraft(lhs)}</span>{' '}
              <span className="text-[#fbbf24]">{COMPARATOR_LABELS[comparator]}</span>{' '}
              <span className="text-[#60a5fa]">{formatExprDraft(rhs)}</span>
            </p>
          </div>
        )}

        {saveError && <p className="text-[#f87171] text-xs font-mono">{saveError}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full bg-[#10b981] hover:bg-[#34d399] disabled:bg-[#334155] disabled:text-[#475569] text-[#0f172a] text-sm font-semibold py-2.5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
        >
          {saving ? 'Saving…' : 'Save rule'}
        </button>
      </div>

      {/* ── Existing rules ─────────────────────────────────────────────── */}
      {rules.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#334155]">
          <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-3">
            Current rules <span className="text-[#334155]">({rules.length})</span>
          </p>
          <div className="space-y-2">
            {rules.map((rule) => (
              <RuleChip key={rule.id} rule={rule} onDelete={() => handleDeleteRule(rule.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
