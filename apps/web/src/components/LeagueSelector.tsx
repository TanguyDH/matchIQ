'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';

interface League {
  id: number;
  name: string;
  countryCode?: string;
}

const FLAG_MAP: Record<string, string> = {
  GB: '🇬🇧', ES: '🇪🇸', DE: '🇩🇪', IT: '🇮🇹', FR: '🇫🇷',
  PT: '🇵🇹', NL: '🇳🇱', BE: '🇧🇪', TR: '🇹🇷', RU: '🇷🇺',
  BR: '🇧🇷', AR: '🇦🇷', US: '🇺🇸', MX: '🇲🇽', JP: '🇯🇵',
  SA: '🇸🇦', GR: '🇬🇷', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰',
  CH: '🇨🇭', AT: '🇦🇹', PL: '🇵🇱', CZ: '🇨🇿', HR: '🇭🇷',
  SC: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
};

interface Props {
  token: string | null;
  selectedIds: number[];
  onSave: (ids: number[]) => void;
  onClose: () => void;
}

export default function LeagueSelector({ token, selectedIds, onSave, onClose }: Props) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getLeagues(token).then((data) => {
      setLeagues(data);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }, [token]);

  const filtered = leagues.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-[#f1f5f9]">Sélectionner les ligues</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-[#f1f5f9] transition-colors text-lg">
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher une ligue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div className="px-5 pb-2 flex items-center justify-between">
            <span className="text-xs text-[#10b981] font-mono">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-[#475569] hover:text-[#f87171] transition-colors"
            >
              Tout désélectionner
            </button>
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto flex-1 px-2 pb-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#475569] font-mono">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#475569]">Aucune ligue trouvée</div>
          ) : (
            filtered.map((league) => {
              const isSelected = selected.has(league.id);
              const flag = league.countryCode ? (FLAG_MAP[league.countryCode] ?? '🌍') : '🌍';
              return (
                <button
                  key={league.id}
                  onClick={() => toggle(league.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-[#10b981]/10 text-[#10b981]'
                      : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f1f5f9]'
                  }`}
                >
                  <span className="text-base w-5 text-center">{flag}</span>
                  <span className="text-sm flex-1">{league.name}</span>
                  {isSelected && (
                    <span className="text-[#10b981] text-xs">✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#334155] flex gap-3">
          <button
            onClick={() => onSave([])}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-[#475569] border border-[#334155] hover:text-[#f1f5f9] transition-colors"
          >
            Toutes les ligues
          </button>
          <button
            onClick={() => onSave(Array.from(selected))}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#10b981] hover:bg-[#34d399] text-[#0f172a] transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
