'use client';

import { COMPARATOR_LABELS, Rule, metricLabel } from '@matchiq/shared-types';

export default function RuleChip({ rule, onDelete }: { rule: Rule; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2">
      <span className="text-xs font-mono">
        <span className="text-[#10b981]">{metricLabel(rule.metric)}</span>{' '}
        <span className="text-[#fbbf24]">{COMPARATOR_LABELS[rule.comparator]}</span>{' '}
        <span className="text-[#60a5fa]">{rule.value}</span>
        {rule.team_scope && <span className="text-[#475569] ml-1.5">({rule.team_scope})</span>}
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
