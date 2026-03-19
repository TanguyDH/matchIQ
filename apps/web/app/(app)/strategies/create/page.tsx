'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertType, DESIRED_OUTCOMES } from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export default function CreateStrategyPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [alertType] = useState<AlertType>('IN_PLAY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultLeagueIds, setDefaultLeagueIds] = useState<number[] | null>(null);

  useEffect(() => {
    api.getUserSettings(token).then((s) => {
      setDefaultLeagueIds(s.default_league_ids);
    });
  }, [token]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const strategy = await api.createStrategy(token, {
        name: name.trim(),
        alert_type: alertType,
        ...(desiredOutcome ? { desired_outcome: desiredOutcome } : {}),
        ...(defaultLeagueIds && defaultLeagueIds.length > 0
          ? { league_ids: defaultLeagueIds }
          : {}),
      });
      router.push(`/strategies/${strategy.id}/rules/add`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-[#475569] hover:text-[#f1f5f9] text-sm transition-colors"
        >
          ←
        </button>
        <h1 className="font-display text-3xl text-[#f1f5f9] tracking-wide">NEW STRATEGY</h1>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
            Strategy name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. High press in 2nd half"
            autoFocus
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>

        {/* Desired Outcome */}
        <div>
          <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
            Betting goal
          </label>
          <select
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] appearance-none focus:outline-none focus:border-[#10b981] transition-colors"
          >
            <option value="">None</option>
            {Object.entries(
              DESIRED_OUTCOMES.reduce<Record<string, typeof DESIRED_OUTCOMES>>((acc, o) => {
                (acc[o.group] ??= []).push(o);
                return acc;
              }, {}),
            ).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Alert Type */}
        <div>
          <label className="block text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-1.5">
            Alert type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#10b981] text-[#0f172a]"
            >
              In-Play
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-[#f87171] text-xs font-mono">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 bg-[#10b981] hover:bg-[#34d399] disabled:bg-[#334155] disabled:text-[#475569] text-[#0f172a] text-sm font-semibold py-2.5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-lg text-xs text-[#94a3b8] hover:text-[#f1f5f9] border border-[#334155] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
