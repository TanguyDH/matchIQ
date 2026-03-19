'use client';

import {
  COMPARATOR_LABELS,
  Rule,
  RuleExpression,
  RuleValue,
  TimeFilter,
  metricLabel,
} from '@matchiq/shared-types';

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

export default function RuleChip({ rule, onDelete }: { rule: Rule; onDelete: () => void }) {
  const isExpr = !!(rule.lhs_json && rule.rhs_json);

  const timeLabel =
    !isExpr && rule.time_filter && rule.time_filter.mode !== 'off'
      ? formatTimeFilter(rule.time_filter)
      : null;

  return (
    <div className="flex items-center justify-between bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2">
      <span className="text-xs font-mono">
        {isExpr ? (
          <>
            <span className="text-[#10b981]">{formatExpression(rule.lhs_json!)}</span>{' '}
            <span className="text-[#fbbf24]">{COMPARATOR_LABELS[rule.comparator]}</span>{' '}
            <span className="text-[#60a5fa]">{formatExpression(rule.rhs_json!)}</span>
          </>
        ) : (
          <>
            <span className="text-[#10b981]">{metricLabel(rule.metric)}</span>{' '}
            <span className="text-[#fbbf24]">{COMPARATOR_LABELS[rule.comparator]}</span>{' '}
            <span className="text-[#60a5fa]">{rule.value}</span>
            {rule.team_scope && <span className="text-[#475569] ml-1.5">({rule.team_scope})</span>}
            {timeLabel && <span className="text-[#f59e0b] ml-1.5">⏱ {timeLabel}</span>}
          </>
        )}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="text-[#475569] hover:text-[#f87171] transition-colors text-sm leading-none ml-3"
      >
        ✕
      </button>
    </div>
  );
}
