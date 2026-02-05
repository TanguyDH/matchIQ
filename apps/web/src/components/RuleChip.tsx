'use client';

import { COMPARATOR_LABELS, Rule, metricLabel } from '@matchiq/shared-types';

export default function RuleChip({ rule, onDelete }: { rule: Rule; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
      <span className="text-xs">
        <span className="text-emerald-400">{metricLabel(rule.metric)}</span>{' '}
        <span className="text-amber-400">{COMPARATOR_LABELS[rule.comparator]}</span>{' '}
        <span className="text-blue-400">{rule.value}</span>
        {rule.team_scope && <span className="text-gray-500 ml-1.5">({rule.team_scope})</span>}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="text-gray-600 hover:text-red-400 transition-colors text-sm leading-none"
      >
        ✕
      </button>
    </div>
  );
}
