'use client';

import {
  METRICS_BY_TYPE,
  TEAM_SCOPES,
  RuleValueType,
  TeamScope,
  metricRequiresTeamScope,
} from '@matchiq/shared-types';
import MetricDropdown from './MetricDropdown';

export type MathOp = '+' | '-' | '*' | '/';
export type TimeMode =
  | 'off'
  | 'as_of_minute'
  | 'x_minutes_ago'
  | 'between'
  | 'past_x'
  | 'since_minute'
  | 'during_2nd_half'
  | 'as_of_halftime';

export interface RuleValueDraft {
  kind: 'metric' | 'number';
  valueType: RuleValueType;
  metric: string;
  teamScope: TeamScope | '';
  timeMode: TimeMode;
  timeX: string;
  timeY: string;
  number: string;
}

export interface ExprDraft {
  left: RuleValueDraft;
  hasOp: boolean;
  op: MathOp | '';
  right: RuleValueDraft;
}

export function makeDefaultRuleValue(
  kind: 'metric' | 'number' = 'metric',
  valueType: RuleValueType = 'IN_PLAY',
): RuleValueDraft {
  return {
    kind,
    valueType,
    metric: '',
    teamScope: '',
    timeMode: 'off',
    timeX: '',
    timeY: '',
    number: '',
  };
}

export function makeDefaultExpr(
  leftKind: 'metric' | 'number' = 'metric',
  valueType: RuleValueType = 'IN_PLAY',
): ExprDraft {
  return {
    left: makeDefaultRuleValue(leftKind, valueType),
    hasOp: false,
    op: '',
    right: makeDefaultRuleValue('number', valueType),
  };
}

const TIME_MODES: { key: TimeMode; label: string; inputs: 0 | 1 | 2 }[] = [
  { key: 'off', label: 'Off', inputs: 0 },
  { key: 'as_of_minute', label: 'As of minute X', inputs: 1 },
  { key: 'x_minutes_ago', label: 'As of X minutes ago', inputs: 1 },
  { key: 'between', label: 'Between minutes X–Y', inputs: 2 },
  { key: 'past_x', label: 'Past X minutes', inputs: 1 },
  { key: 'since_minute', label: 'Since minute X', inputs: 1 },
  { key: 'during_2nd_half', label: '2nd half only', inputs: 0 },
  { key: 'as_of_halftime', label: 'As of half-time', inputs: 0 },
];

const MATH_OPS: { op: MathOp; label: string }[] = [
  { op: '+', label: '+' },
  { op: '-', label: '−' },
  { op: '*', label: '×' },
  { op: '/', label: '÷' },
];

interface RuleValueEditorProps {
  value: RuleValueDraft;
  onChange: (v: RuleValueDraft) => void;
  showTimeFilter?: boolean;
  metricOnly?: boolean;
}

function RuleValueEditor({
  value,
  onChange,
  showTimeFilter = true,
  metricOnly = false,
}: RuleValueEditorProps) {
  const update = (patch: Partial<RuleValueDraft>) => onChange({ ...value, ...patch });
  const metrics = METRICS_BY_TYPE[value.valueType];
  const needsTeamScope = value.metric ? metricRequiresTeamScope(value.metric) : false;
  const timeModeInfo = TIME_MODES.find((m) => m.key === value.timeMode)!;

  return (
    <div className="space-y-2.5">
      {/* Kind toggle — hidden when metricOnly */}
      {!metricOnly && (
        <div className="flex gap-1 bg-[#0f172a] rounded-lg p-0.5">
          {(['number', 'metric'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => update({ kind: k, metric: '', number: '' })}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                value.kind === k
                  ? 'bg-[#1e293b] text-[#10b981]'
                  : 'text-[#475569] hover:text-[#94a3b8]'
              }`}
            >
              {k === 'metric' ? 'Metric' : 'Number'}
            </button>
          ))}
        </div>
      )}

      {value.kind === 'number' ? (
        <input
          type="number"
          value={value.number}
          onChange={(e) => update({ number: e.target.value })}
          placeholder="0"
          className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#10b981] transition-colors"
        />
      ) : (
        <>
          {/* Value type selector */}
          <select
            value={value.valueType}
            onChange={(e) =>
              update({ valueType: e.target.value as RuleValueType, metric: '', teamScope: '' })
            }
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#94a3b8] appearance-none focus:outline-none focus:border-[#334155] transition-colors"
          >
            <option value="IN_PLAY">In-Play</option>
            <option value="PRE_MATCH">Pre-Match</option>
            <option value="ODDS">Odds</option>
          </select>

          {/* Metric dropdown */}
          <MetricDropdown
            metrics={metrics}
            selected={value.metric}
            onChange={(key) => update({ metric: key, teamScope: '' })}
          />

          {needsTeamScope && (
            <select
              value={value.teamScope}
              onChange={(e) => update({ teamScope: e.target.value as TeamScope | '' })}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] appearance-none focus:outline-none focus:border-[#10b981] transition-colors"
            >
              <option value="">Team scope…</option>
              {TEAM_SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}

          {showTimeFilter && value.metric && (
            <div className="space-y-1.5">
              <div className="flex gap-2 items-center">
                <select
                  value={value.timeMode}
                  onChange={(e) =>
                    update({ timeMode: e.target.value as TimeMode, timeX: '', timeY: '' })
                  }
                  className="flex-1 min-w-0 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#94a3b8] appearance-none focus:outline-none focus:border-[#334155] transition-colors"
                >
                  {TIME_MODES.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                {timeModeInfo.inputs >= 1 && (
                  <input
                    type="number"
                    min={0}
                    max={120}
                    placeholder="X"
                    value={value.timeX}
                    onChange={(e) => update({ timeX: e.target.value })}
                    className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#f1f5f9] text-center placeholder-[#334155] focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                )}
                {timeModeInfo.inputs === 2 && (
                  <input
                    type="number"
                    min={0}
                    max={120}
                    placeholder="Y"
                    value={value.timeY}
                    onChange={(e) => update({ timeY: e.target.value })}
                    className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#f1f5f9] text-center placeholder-[#334155] focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ExpressionEditorProps {
  label: string;
  value: ExprDraft;
  onChange: (v: ExprDraft) => void;
  showTimeFilter?: boolean;
  metricOnly?: boolean;
}

export default function ExpressionEditor({
  label,
  value,
  onChange,
  showTimeFilter = true,
  metricOnly = false,
}: ExpressionEditorProps) {
  const update = (patch: Partial<ExprDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 space-y-3">
      <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest">{label}</p>

      <RuleValueEditor
        value={value.left}
        onChange={(left) => update({ left })}
        showTimeFilter={showTimeFilter}
        metricOnly={metricOnly}
      />

      {/* Math operation */}
      {value.hasOp ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest flex-1">
              Operation
            </p>
            <button
              type="button"
              onClick={() =>
                update({
                  hasOp: false,
                  op: '',
                  right: makeDefaultRuleValue('number', value.left.valueType),
                })
              }
              className="text-[10px] text-[#475569] hover:text-[#f87171] transition-colors"
            >
              Remove
            </button>
          </div>
          {/* Op selector */}
          <div className="flex gap-1.5">
            {MATH_OPS.map(({ op, label: opLabel }) => (
              <button
                key={op}
                type="button"
                onClick={() => update({ op })}
                className={`flex-1 py-2 rounded-lg text-sm font-mono font-bold transition-colors ${
                  value.op === op
                    ? 'bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981]'
                    : 'bg-[#0f172a] border border-[#334155] text-[#475569] hover:text-[#94a3b8] hover:border-[#475569]'
                }`}
              >
                {opLabel}
              </button>
            ))}
          </div>
          {/* Right value */}
          <RuleValueEditor
            value={value.right}
            onChange={(right) => update({ right })}
            showTimeFilter={false}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            update({
              hasOp: true,
              op: '+',
              right: makeDefaultRuleValue('number', value.left.valueType),
            })
          }
          className="w-full py-1.5 border border-dashed border-[#334155] rounded-lg text-[11px] text-[#475569] hover:text-[#94a3b8] hover:border-[#475569] transition-colors"
        >
          + Add math operation
        </button>
      )}
    </div>
  );
}
