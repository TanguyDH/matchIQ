'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';

interface League {
  id: number;
  name: string;
  countryCode?: string;
}

const FLAG_MAP: Record<string, string> = {
  GB: '🇬🇧',
  EN: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  SC: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  ES: '🇪🇸',
  DE: '🇩🇪',
  IT: '🇮🇹',
  FR: '🇫🇷',
  PT: '🇵🇹',
  NL: '🇳🇱',
  BE: '🇧🇪',
  TR: '🇹🇷',
  RU: '🇷🇺',
  BR: '🇧🇷',
  AR: '🇦🇷',
  US: '🇺🇸',
  MX: '🇲🇽',
  JP: '🇯🇵',
  SA: '🇸🇦',
  GR: '🇬🇷',
  SE: '🇸🇪',
  NO: '🇳🇴',
  DK: '🇩🇰',
  CH: '🇨🇭',
  AT: '🇦🇹',
  PL: '🇵🇱',
  CZ: '🇨🇿',
  HR: '🇭🇷',
  FI: '🇫🇮',
  RO: '🇷🇴',
  RS: '🇷🇸',
  HU: '🇭🇺',
  UA: '🇺🇦',
  BG: '🇧🇬',
  SK: '🇸🇰',
  SI: '🇸🇮',
  BA: '🇧🇦',
  AL: '🇦🇱',
  MK: '🇲🇰',
  ME: '🇲🇪',
  IE: '🇮🇪',
  IL: '🇮🇱',
  EE: '🇪🇪',
  LV: '🇱🇻',
  LT: '🇱🇹',
  GE: '🇬🇪',
  AZ: '🇦🇿',
  AM: '🇦🇲',
  KZ: '🇰🇿',
  CY: '🇨🇾',
  LU: '🇱🇺',
  MT: '🇲🇹',
  IS: '🇮🇸',
  BY: '🇧🇾',
  MD: '🇲🇩',
  KO: '🇽🇰',
  CN: '🇨🇳',
  KR: '🇰🇷',
  AU: '🇦🇺',
  ZA: '🇿🇦',
  NG: '🇳🇬',
  EG: '🇪🇬',
  MA: '🇲🇦',
  CO: '🇨🇴',
  CL: '🇨🇱',
  UY: '🇺🇾',
  PE: '🇵🇪',
  EC: '🇪🇨',
};

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom',
  EN: 'England',
  SC: 'Scotland',
  ES: 'Spain',
  DE: 'Germany',
  IT: 'Italy',
  FR: 'France',
  PT: 'Portugal',
  NL: 'Netherlands',
  BE: 'Belgium',
  TR: 'Turkey',
  RU: 'Russia',
  BR: 'Brazil',
  AR: 'Argentina',
  US: 'United States',
  MX: 'Mexico',
  JP: 'Japan',
  SA: 'Saudi Arabia',
  GR: 'Greece',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  CH: 'Switzerland',
  AT: 'Austria',
  PL: 'Poland',
  CZ: 'Czech Republic',
  HR: 'Croatia',
  FI: 'Finland',
  RO: 'Romania',
  RS: 'Serbia',
  HU: 'Hungary',
  UA: 'Ukraine',
  BG: 'Bulgaria',
  SK: 'Slovakia',
  SI: 'Slovenia',
  BA: 'Bosnia',
  AL: 'Albania',
  MK: 'North Macedonia',
  ME: 'Montenegro',
  IE: 'Ireland',
  IL: 'Israel',
  EE: 'Estonia',
  LV: 'Latvia',
  LT: 'Lithuania',
  GE: 'Georgia',
  AZ: 'Azerbaijan',
  AM: 'Armenia',
  KZ: 'Kazakhstan',
  CY: 'Cyprus',
  LU: 'Luxembourg',
  MT: 'Malta',
  IS: 'Iceland',
  BY: 'Belarus',
  MD: 'Moldova',
  KO: 'Kosovo',
  CN: 'China',
  KR: 'South Korea',
  AU: 'Australia',
  ZA: 'South Africa',
  NG: 'Nigeria',
  EG: 'Egypt',
  MA: 'Morocco',
  CO: 'Colombia',
  CL: 'Chile',
  UY: 'Uruguay',
  PE: 'Peru',
  EC: 'Ecuador',
};

interface Props {
  token: string | null;
  selectedIds: number[];
  onSave: (ids: number[]) => void;
  onClose: () => void;
}

interface CountryGroup {
  code: string;
  name: string;
  flag: string;
  leagues: League[];
}

export default function LeagueSelector({ token, selectedIds, onSave, onClose }: Props) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getLeagues(token).then((data) => {
      setLeagues(data);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }, [token]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCountry = (code: string, leagueIds: number[]) => {
    const allSelected = leagueIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        leagueIds.forEach((id) => next.delete(id));
      } else {
        leagueIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleCollapse = (code: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const groups: CountryGroup[] = (() => {
    const map = new Map<string, League[]>();
    const noCountry: League[] = [];

    for (const l of leagues) {
      const q = search.toLowerCase();
      const countryName = l.countryCode ? (COUNTRY_NAMES[l.countryCode] ?? l.countryCode) : '';
      const matchesLeague = l.name.toLowerCase().includes(q);
      const matchesCountry = countryName.toLowerCase().includes(q);
      if (q && !matchesLeague && !matchesCountry) continue;
      if (!l.countryCode) {
        noCountry.push(l);
      } else {
        const arr = map.get(l.countryCode) ?? [];
        arr.push(l);
        map.set(l.countryCode, arr);
      }
    }

    const result: CountryGroup[] = [];
    for (const [code, ls] of map.entries()) {
      result.push({
        code,
        name: COUNTRY_NAMES[code] ?? code,
        flag: FLAG_MAP[code] ?? '🌍',
        leagues: ls.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
    result.sort((a, b) => a.name.localeCompare(b.name));

    if (noCountry.length > 0) {
      result.push({
        code: '__other__',
        name: 'International / Other',
        flag: '🌍',
        leagues: noCountry.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    return result;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-[#f1f5f9]">Select leagues</h2>
          <button
            onClick={onClose}
            className="text-[#475569] hover:text-[#f1f5f9] transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search a league or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div className="px-5 pb-2 flex items-center justify-between">
            <span className="text-xs text-[#10b981] font-mono">
              {selected.size} selected
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-[#475569] hover:text-[#f87171] transition-colors"
            >
              Deselect all
            </button>
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto flex-1 px-2 pb-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#475569] font-mono">Loading…</div>
          ) : groups.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#475569]">No leagues found</div>
          ) : (
            groups.map((group) => {
              const isOpen = !collapsed.has(group.code);
              const leagueIds = group.leagues.map((l) => l.id);
              const selectedCount = leagueIds.filter((id) => selected.has(id)).length;
              const allSelected = leagueIds.length > 0 && selectedCount === leagueIds.length;
              const someSelected = selectedCount > 0 && selectedCount < leagueIds.length;

              return (
                <div key={group.code} className="mb-1">
                  {/* Country header */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#263043] group">
                    {/* Collapse toggle */}
                    <button
                      onClick={() => toggleCollapse(group.code)}
                      className="text-[#475569] hover:text-[#94a3b8] transition-colors w-4 text-center text-xs flex-shrink-0"
                    >
                      {isOpen ? '▼' : '▶'}
                    </button>

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleCountry(group.code, leagueIds)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        allSelected
                          ? 'bg-[#10b981] border-[#10b981]'
                          : someSelected
                            ? 'bg-[#10b981]/30 border-[#10b981]'
                            : 'border-[#475569] hover:border-[#10b981]'
                      }`}
                    >
                      {allSelected && (
                        <span className="text-[#0f172a] text-[9px] font-bold leading-none">✓</span>
                      )}
                      {someSelected && (
                        <span className="text-[#10b981] text-[9px] font-bold leading-none">−</span>
                      )}
                    </button>

                    {/* Flag + name — clicking expands/collapses */}
                    <button
                      onClick={() => toggleCollapse(group.code)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="text-base w-5 text-center flex-shrink-0">{group.flag}</span>
                      <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                        {group.name}
                      </span>
                      <span className="ml-auto text-[10px] text-[#475569] font-mono">
                        {selectedCount > 0
                          ? `${selectedCount}/${group.leagues.length}`
                          : group.leagues.length}
                      </span>
                    </button>
                  </div>

                  {/* League rows */}
                  {isOpen && (
                    <div className="ml-9 border-l border-[#1e293b] pl-2">
                      {group.leagues.map((league) => {
                        const isSelected = selected.has(league.id);
                        return (
                          <button
                            key={league.id}
                            onClick={() => toggle(league.id)}
                            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-colors ${
                              isSelected
                                ? 'text-[#10b981]'
                                : 'text-[#64748b] hover:bg-[#263043] hover:text-[#f1f5f9]'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-[#10b981] border-[#10b981]' : 'border-[#475569]'
                              }`}
                            >
                              {isSelected && (
                                <span className="text-[#0f172a] text-[8px] font-bold leading-none">
                                  ✓
                                </span>
                              )}
                            </div>
                            <span className="text-xs flex-1">{league.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
            All leagues
          </button>
          <button
            onClick={() => onSave(Array.from(selected))}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#10b981] hover:bg-[#34d399] text-[#0f172a] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
