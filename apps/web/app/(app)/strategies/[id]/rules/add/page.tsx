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

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const numValue = parseFloat(targetValue);
    if (!metric || targetValue === '' || isNaN(numValue)) return;
    if (needsTeamScope && !teamScope) return;

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
        <div className={`grid gap-3 ${needsTeamScope ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
