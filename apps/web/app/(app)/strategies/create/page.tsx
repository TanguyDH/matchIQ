'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertType, DESIRED_OUTCOMES } from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export default function CreateStrategyPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('IN_PLAY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const strategy = await api.createStrategy(token, {
        name: name.trim(),
        alert_type: alertType,
        ...(desiredOutcome ? { desired_outcome: desiredOutcome } : {}),
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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-200 text-sm">
          ←
        </button>
        <h1 className="text-base font-semibold">Create Strategy</h1>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Strategy Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. High possession trigger"
            autoFocus
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Desired Outcome */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desired Outcome</label>
          <select
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
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

        {/* Alert Type toggle */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Alert Type</label>
          <div className="flex gap-2">
            {(['IN_PLAY', 'PRE_MATCH'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAlertType(type)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  alertType === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-600'
                }`}
              >
                {type === 'IN_PLAY' ? 'In-Play' : 'Pre-Match'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 border border-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
