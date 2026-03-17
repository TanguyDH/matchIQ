'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertType,
  Comparator,
  COMPARATOR_LABELS,
  COMPARATORS,
  METRICS_BY_TYPE,
  Rule,
  RuleValueType,
  Strategy,
  TEAM_SCOPES,
  TeamScope,
  TimeFilter,
  metricRequiresTeamScope,
} from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import MetricDropdown from '@/components/MetricDropdown';
import RuleChip from '@/components/RuleChip';

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: { key: RuleValueType; label: string }[] = [
  { key: 'IN_PLAY', label: 'In-Play' },
  { key: 'PRE_MATCH', label: 'Pré-Match' },
  { key: 'ODDS', label: 'Cotes' },
];

// ─── Temporal range ───────────────────────────────────────────────────────────

// Metrics that don't benefit from a time filter (Match Context group)
const NO_TIME_FILTER = new Set(['match_timer', 'minutes_since_last_goal', 'league_position']);

type TimeMode =
  | 'off'
  | 'as_of_minute'
  | 'x_minutes_ago'
  | 'between'
  | 'past_x'
  | 'since_minute'
  | 'during_2nd_half'
  | 'as_of_halftime';

const TIME_MODES: { key: TimeMode; label: string; inputs: 0 | 1 | 2 }[] = [
  { key: 'off', label: 'Off', inputs: 0 },
  { key: 'as_of_minute', label: 'As of minute X', inputs: 1 },
  { key: 'x_minutes_ago', label: 'As of X minutes ago', inputs: 1 },
  { key: 'between', label: 'Between minutes X and Y', inputs: 2 },
  { key: 'past_x', label: 'Past X minutes', inputs: 1 },
  { key: 'since_minute', label: 'Since minute X', inputs: 1 },
  { key: 'during_2nd_half', label: 'During 2nd Half', inputs: 0 },
  { key: 'as_of_halftime', label: 'As of Half Time', inputs: 0 },
];

// Restricted set of temporal modes for ODDS tab
const ODDS_TIME_MODES: { key: TimeMode; label: string; inputs: 0 | 1 }[] = [
  { key: 'off', label: 'Off / Latest Odds', inputs: 0 },
  { key: 'as_of_minute', label: 'As of minute X', inputs: 1 },
  { key: 'x_minutes_ago', label: 'As of X minutes ago', inputs: 1 },
  { key: 'as_of_halftime', label: 'As of Half Time', inputs: 0 },
];

function oddsTimeModeHint(mode: TimeMode, x: string): string {
  switch (mode) {
    case 'as_of_minute':
      return `Odds at minute ${x || 'X'}`;
    case 'x_minutes_ago':
      return `Odds as they were ${x || 'X'} minutes ago`;
    case 'as_of_halftime':
      return `Odds at half time`;
    default:
      return '';
  }
}

function timeModeHint(mode: TimeMode, metricLabel: string, x: string, y: string): string {
  const m = metricLabel.toLowerCase();
  switch (mode) {
    case 'as_of_minute':
      return `Value of ${m} at minute ${x || 'X'}`;
    case 'x_minutes_ago':
      return `Value of ${m} as it was ${x || 'X'} minutes ago`;
    case 'between':
      return `Only count ${m} between minute ${x || 'X'} and ${y || 'Y'}`;
    case 'past_x':
      return `${m} accumulated over the last ${x || 'X'} minutes`;
    case 'since_minute':
      return `${m} since minute ${x || 'X'}`;
    case 'during_2nd_half':
      return `${m} in the 2nd half only`;
    case 'as_of_halftime':
      return `Value of ${m} at half time`;
    default:
      return '';
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddRulePage() {
  const { token } = useAuth();
  const router = useRouter();
  const { id: strategyId } = useParams<{ id: string }>();

  // ── Remote state ────────────────────────────────────────────────────────
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

  // ── Form state ──────────────────────────────────────────────────────────
  const [valueType, setValueType] = useState<RuleValueType>('IN_PLAY');
  const [metric, setMetric] = useState('');
  const [comparator, setComparator] = useState<Comparator>('GTE');
  const [targetValue, setTargetValue] = useState('');
  const [teamScope, setTeamScope] = useState<TeamScope | ''>('');
  const [timeMode, setTimeMode] = useState<TimeMode>('off');
  const [timeX, setTimeX] = useState('');
  const [timeY, setTimeY] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentMetrics = METRICS_BY_TYPE[valueType];
  const metricStillValid = currentMetrics.some((m) => m.key === metric);

  useEffect(() => {
    if (metric && !metricStillValid) {
      setMetric('');
      setTeamScope('');
    }
  }, [metric, metricStillValid]);

  useEffect(() => {
    if (metric && !metricRequiresTeamScope(metric)) setTeamScope('');
  }, [metric]);

  useEffect(() => {
    setTimeMode('off');
    setTimeX('');
    setTimeY('');
  }, [metric, valueType]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const numValue = parseFloat(targetValue);
    if (!metric || targetValue === '' || isNaN(numValue)) return;
    if (needsTeamScope && !teamScope) return;

    // Build time_filter payload
    let timeFilter: TimeFilter | undefined;
    if ((showTimeFilter || showOddsTimeFilter) && timeMode !== 'off') {
      const x = parseInt(timeX, 10);
      const y = parseInt(timeY, 10);
      switch (timeMode) {
        case 'as_of_minute':
        case 'x_minutes_ago':
        case 'past_x':
        case 'since_minute':
          if (!isNaN(x)) timeFilter = { mode: timeMode, x };
          break;
        case 'between':
          if (!isNaN(x) && !isNaN(y)) timeFilter = { mode: 'between', x, y };
          break;
        case 'during_2nd_half':
        case 'as_of_halftime':
          timeFilter = { mode: timeMode };
          break;
      }
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (strategy && valueType !== 'ODDS' && strategy.alert_type !== valueType) {
        const updatedStrategy = await api.patchStrategy(token, strategyId, {
          alert_type: valueType as AlertType,
        });
        setStrategy(updatedStrategy);
      }

      const rule = await api.createRule(token, strategyId, {
        value_type: valueType,
        metric,
        comparator,
        value: numValue,
        ...(needsTeamScope && teamScope ? { team_scope: teamScope } : {}),
        ...(timeFilter ? { time_filter: timeFilter } : {}),
      });
      setRules((prev) => [...prev, rule]);
      setMetric('');
      setTargetValue('');
      setTeamScope('');
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.deleteRule(token, ruleId);
      const updatedRules = rules.filter((r) => r.id !== ruleId);
      setRules(updatedRules);

      if (strategy && updatedRules.length > 0) {
        const ruleValueTypes = updatedRules.map((r) => r.value_type);
        const allSameType = ruleValueTypes.every((t) => t === ruleValueTypes[0]);
        const firstType = ruleValueTypes[0];
        if (allSameType && firstType !== 'ODDS' && strategy.alert_type !== firstType) {
          const updatedStrategy = await api.patchStrategy(token, strategyId, {
            alert_type: firstType as AlertType,
          });
          setStrategy(updatedStrategy);
        }
      }
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const previewLabel = metric ? currentMetrics.find((m) => m.key === metric)?.label : undefined;
  const needsTeamScope = metric ? metricRequiresTeamScope(metric) : false;
  const showTimeFilter = valueType === 'IN_PLAY' && metric !== '' && !NO_TIME_FILTER.has(metric);
  const showOddsTimeFilter = valueType === 'ODDS' && metric.startsWith('live_');
  const timeModeInfo = showOddsTimeFilter
    ? (ODDS_TIME_MODES.find((m) => m.key === timeMode) ?? ODDS_TIME_MODES[0])
    : TIME_MODES.find((m) => m.key === timeMode)!;
  const canSave =
    metric !== '' &&
    targetValue !== '' &&
    !isNaN(parseFloat(targetValue)) &&
    (!needsTeamScope || teamScope !== '');

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
          <span className="text-[#10b981]">Ajouter une règle</span>
        </span>
      </div>

      {loadError && <p className="text-[#f87171] text-xs font-mono mb-3">{loadError}</p>}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#0f172a] border border-[#334155] rounded-lg p-1 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setValueType(tab.key)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              valueType === tab.key
                ? 'bg-[#1e293b] text-[#10b981]'
                : 'text-[#475569] hover:text-[#94a3b8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Form fields ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Metric + Team Scope */}
        <div
          className={`grid gap-3 ${
            needsTeamScope && showTimeFilter
              ? 'grid-cols-3'
              : needsTeamScope || showTimeFilter || showOddsTimeFilter
                ? 'grid-cols-2'
                : 'grid-cols-1'
          }`}
        >
          <div>
            <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
              Métrique
            </label>
            <MetricDropdown metrics={currentMetrics} selected={metric} onChange={setMetric} />
            <p className="text-[10px] text-[#475569] mt-1.5">Valeur à surveiller</p>
          </div>

          {needsTeamScope && (
            <div>
              <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
                Équipe
              </label>
              <select
                value={teamScope}
                onChange={(e) => setTeamScope(e.target.value as TeamScope | '')}
                required
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] appearance-none focus:outline-none focus:border-[#10b981] transition-colors"
              >
                <option value="">Sélectionner…</option>
                {TEAM_SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#475569] mt-1.5">
                Équipe dont la {previewLabel?.toLowerCase() || 'métrique'} est comptée
              </p>
            </div>
          )}

          {showTimeFilter && (
            <div>
              <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
                Plage temporelle{' '}
                <span className="normal-case tracking-normal text-[#334155]">(optionnel)</span>
              </label>
              {/* Mode selector + inline inputs */}
              <div className="flex gap-1.5 items-center">
                <select
                  value={timeMode}
                  onChange={(e) => {
                    setTimeMode(e.target.value as TimeMode);
                    setTimeX('');
                    setTimeY('');
                  }}
                  className="flex-1 min-w-0 bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#f1f5f9] appearance-none focus:outline-none focus:border-[#10b981] transition-colors"
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
                    value={timeX}
                    onChange={(e) => setTimeX(e.target.value)}
                    className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#f1f5f9] text-center placeholder-[#334155] focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                )}
                {timeModeInfo.inputs === 2 && (
                  <input
                    type="number"
                    min={0}
                    max={120}
                    placeholder="Y"
                    value={timeY}
                    onChange={(e) => setTimeY(e.target.value)}
                    className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#f1f5f9] text-center placeholder-[#334155] focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                )}
              </div>
              {timeMode !== 'off' && (
                <p className="text-[10px] text-[#475569] mt-1.5">
                  {timeModeHint(timeMode, previewLabel || 'metric', timeX, timeY)}
                </p>
              )}
            </div>
          )}

          {showOddsTimeFilter && (
            <div>
              <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
                Plage temporelle{' '}
                <span className="normal-case tracking-normal text-[#334155]">(optionnel)</span>
              </label>
              <div className="flex gap-1.5 items-center">
                <select
                  value={timeMode}
                  onChange={(e) => {
                    setTimeMode(e.target.value as TimeMode);
                    setTimeX('');
                  }}
                  className="flex-1 min-w-0 bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#f1f5f9] appearance-none focus:outline-none focus:border-[#10b981] transition-colors"
                >
                  {ODDS_TIME_MODES.map((m) => (
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
                    value={timeX}
                    onChange={(e) => setTimeX(e.target.value)}
                    className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-2 py-2 text-xs text-[#f1f5f9] text-center placeholder-[#334155] focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                )}
              </div>
              {timeMode !== 'off' && (
                <p className="text-[10px] text-[#475569] mt-1.5">
                  {oddsTimeModeHint(timeMode, timeX)}
                </p>
              )}
            </div>
          )}

        </div>

        {/* Comparator + Target Value */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
              Comparateur
            </label>
            <select
              value={comparator}
              onChange={(e) => setComparator(e.target.value as Comparator)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] appearance-none focus:outline-none focus:border-[#10b981] transition-colors"
            >
              {COMPARATORS.map((c) => (
                <option key={c} value={c}>
                  {COMPARATOR_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
              Valeur cible
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="0"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>
        </div>

        {/* Preview */}
        {previewLabel && (
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3">
            <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1">
              Aperçu
            </p>
            <p className="text-sm font-mono">
              <span className="text-[#10b981]">{previewLabel}</span>{' '}
              {needsTeamScope && teamScope && (
                <span className="text-[#a78bfa]">
                  ({TEAM_SCOPES.find((s) => s.value === teamScope)?.label}){' '}
                </span>
              )}
              <span className="text-[#fbbf24]">{COMPARATOR_LABELS[comparator]}</span>{' '}
              <span className="text-[#60a5fa]">{targetValue || '…'}</span>
            </p>
            {showTimeFilter && timeMode !== 'off' && (
              <p className="text-[10px] text-[#f59e0b] font-mono mt-1.5">
                ⏱ {timeModeHint(timeMode, previewLabel ?? '', timeX, timeY)}
              </p>
            )}
            {showOddsTimeFilter && timeMode !== 'off' && (
              <p className="text-[10px] text-[#f59e0b] font-mono mt-1.5">
                ⏱ {oddsTimeModeHint(timeMode, timeX)}
              </p>
            )}
          </div>
        )}

        {/* Advanced Mode */}
        <div className="flex items-center justify-between pt-2 border-t border-[#334155]">
          <span className="text-xs text-[#475569] font-mono">Mode avancé</span>
          <div
            onClick={() => setAdvanced((a) => !a)}
            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
              advanced ? 'bg-[#10b981]' : 'bg-[#334155]'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform ${
                advanced ? 'bg-[#0f172a] translate-x-5' : 'bg-[#64748b] translate-x-0'
              }`}
            />
          </div>
        </div>

        {advanced && (
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2">
            <p className="text-xs text-[#475569] font-mono">
              Filtres temporels — disponible en Phase 4
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
          {saving ? 'Enregistrement…' : 'Enregistrer la règle'}
        </button>
      </div>

      {/* ── Existing rules ─────────────────────────────────────────────── */}
      {rules.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#334155]">
          <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-3">
            Règles actuelles <span className="text-[#334155]">({rules.length})</span>
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
