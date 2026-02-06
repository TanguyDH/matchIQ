'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Comparator,
  COMPARATOR_LABELS,
  COMPARATORS,
  METRICS_BY_TYPE,
  Rule,
  RuleValueType,
  Strategy,
  TEAM_SCOPES,
  TeamScope,
  metricRequiresTeamScope,
} from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import MetricDropdown from '@/components/MetricDropdown';
import RuleChip from '@/components/RuleChip';

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: { key: RuleValueType; label: string }[] = [
  { key: 'IN_PLAY', label: 'In-Play' },
  { key: 'PRE_MATCH', label: 'Pre-Match' },
  { key: 'ODDS', label: 'Odds' },
];

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
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Switch tab → reset metric if it belongs to the previous tab
  const currentMetrics = METRICS_BY_TYPE[valueType];
  const metricStillValid = currentMetrics.some((m) => m.key === metric);
  useEffect(() => {
    if (metric && !metricStillValid) {
      setMetric('');
      setTeamScope('');
    }
  }, [metric, metricStillValid]);

  // Reset team scope when metric changes and doesn't need it
  useEffect(() => {
    if (metric && !metricRequiresTeamScope(metric)) {
      setTeamScope('');
    }
  }, [metric]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const numValue = parseFloat(targetValue);
    if (!metric || targetValue === '' || isNaN(numValue)) return;
    if (needsTeamScope && !teamScope) return; // Team scope required but not selected

    setSaving(true);
    setSaveError(null);
    try {
      const rule = await api.createRule(token, strategyId, {
        value_type: valueType,
        metric,
        comparator,
        value: numValue,
        ...(needsTeamScope && teamScope ? { team_scope: teamScope } : {}),
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
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────

  const previewLabel = metric ? currentMetrics.find((m) => m.key === metric)?.label : undefined;
  const needsTeamScope = metric ? metricRequiresTeamScope(metric) : false;
  const canSave =
    metric !== '' &&
    targetValue !== '' &&
    !isNaN(parseFloat(targetValue)) &&
    (!needsTeamScope || teamScope !== '');

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => router.push('/strategies')}
          className="text-gray-400 hover:text-gray-200 text-sm"
        >
          ←
        </button>
        <span className="text-xs text-gray-500">
          {strategy?.name ?? '…'}
          <span className="text-gray-700 mx-1.5">/</span>
          Add Rule
        </span>
      </div>

      {/* Load error */}
      {loadError && <p className="text-red-400 text-xs mb-3">{loadError}</p>}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setValueType(tab.key)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              valueType === tab.key
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Form fields ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Metric and Team Scope - side by side */}
        <div className={`grid gap-3 ${needsTeamScope ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Metric</label>
            <MetricDropdown metrics={currentMetrics} selected={metric} onChange={setMetric} />
            <p className="text-xs text-gray-500 mt-1.5">Select the value to be used</p>
          </div>

          {/* Team Scope - only show if metric requires it */}
          {needsTeamScope && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Team
              </label>
              <select
                value={teamScope}
                onChange={(e) => setTeamScope(e.target.value as TeamScope | '')}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Select team...</option>
                {TEAM_SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1.5">
                Select the team of which the {previewLabel?.toLowerCase() || 'metric'} will be counted
              </p>
            </div>
          )}
        </div>

        {/* Comparator and Target Value - side by side */}
        <div className="grid grid-cols-2 gap-3">
          {/* Comparator */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Comparator</label>
            <select
              value={comparator}
              onChange={(e) => setComparator(e.target.value as Comparator)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {COMPARATORS.map((c) => (
                <option key={c} value={c}>
                  {COMPARATOR_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Target Value</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Preview */}
        {previewLabel && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
            <p className="text-xs text-gray-600 mb-0.5">Preview</p>
            <p className="text-sm">
              <span className="text-emerald-400">{previewLabel}</span>{' '}
              {needsTeamScope && teamScope && (
                <span className="text-purple-400">
                  ({TEAM_SCOPES.find((s) => s.value === teamScope)?.label}){' '}
                </span>
              )}
              <span className="text-amber-400">{COMPARATOR_LABELS[comparator]}</span>{' '}
              <span className="text-blue-400">{targetValue || '…'}</span>
            </p>
          </div>
        )}

        {/* Advanced Mode toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-xs text-gray-500">Advanced Mode</span>
          <div
            onClick={() => setAdvanced((a) => !a)}
            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
              advanced ? 'bg-emerald-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                advanced ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {advanced && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">
              Time filters — available in Phase 4 (rule-engine)
            </p>
          </div>
        )}

        {/* Save error */}
        {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save Rule'}
        </button>
      </div>

      {/* ── Existing rules ─────────────────────────────────────────────── */}
      {rules.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-2">
            Current Rules <span className="text-gray-700">({rules.length})</span>
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
