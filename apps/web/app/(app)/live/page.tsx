'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api/client';
import LeagueSelector from '@/components/LeagueSelector';

const REFRESH_INTERVAL = 15; // seconds

interface LiveMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
  league: string;
  leagueId: number | null;
}

export default function LiveMatchesPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;

  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultLeagueIds, setDefaultLeagueIds] = useState<number[]>([]);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLiveMatches = async () => {
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/live-matches`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const liveMatches: LiveMatch[] = await response.json();
      setMatches(liveMatches);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMatches();
    intervalRef.current = setInterval(fetchLiveMatches, REFRESH_INTERVAL * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Load default league filter
  useEffect(() => {
    if (!token) return;
    api.getUserSettings(token).then((s) => {
      setDefaultLeagueIds(s.default_league_ids ?? []);
    });
  }, [token]);

  const handleLeagueSave = async (ids: number[]) => {
    setDefaultLeagueIds(ids);
    setShowLeagueSelector(false);
    await api.updateUserSettings(token, ids.length > 0 ? ids : null);
  };

  // Apply filter
  const filteredMatches =
    defaultLeagueIds.length === 0
      ? matches
      : matches.filter((m) => m.leagueId !== null && defaultLeagueIds.includes(m.leagueId));

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl text-[#f1f5f9] tracking-wide leading-none">
            MATCHS EN LIVE
          </h1>
          {!loading && matches.length > 0 && (
            <p className="text-xs text-[#475569] font-mono mt-1">
              <span className="text-[#10b981]">{filteredMatches.length}</span>
              {defaultLeagueIds.length > 0 && matches.length !== filteredMatches.length && (
                <span className="text-[#334155]"> / {matches.length}</span>
              )}
              {' '}match{filteredMatches.length > 1 ? 's' : ''} en cours
            </p>
          )}
        </div>

        {/* League filter button */}
        <button
          onClick={() => setShowLeagueSelector(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
            defaultLeagueIds.length > 0
              ? 'border-[#10b981]/40 bg-[rgba(16,185,129,0.06)] text-[#10b981]'
              : 'border-[#334155] text-[#475569] hover:border-[#475569] hover:text-[#94a3b8]'
          }`}
        >
          🏆{' '}
          {defaultLeagueIds.length === 0
            ? 'Toutes les ligues'
            : `${defaultLeagueIds.length} ligue${defaultLeagueIds.length > 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-[#475569] font-mono text-sm">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse-slow" />
            Chargement des matchs live…
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-[rgba(248,113,113,0.06)] border border-[#f87171]/20 rounded-xl p-4">
          <p className="text-[#f87171] text-sm font-mono">Erreur : {error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredMatches.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#334155] rounded-xl">
          <span className="text-2xl mb-3 opacity-30">⬡</span>
          {defaultLeagueIds.length > 0 && matches.length > 0 ? (
            <>
              <p className="text-sm text-[#475569]">Aucun match en live dans vos ligues</p>
              <button
                onClick={() => handleLeagueSave([])}
                className="text-xs text-[#10b981] mt-2 hover:underline"
              >
                Voir tous les matchs
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[#475569]">Aucun match en live pour le moment</p>
              <p className="text-xs text-[#334155] mt-1 font-mono">Revenez pendant les matchs</p>
            </>
          )}
        </div>
      )}

      {/* Matches list */}
      {!loading && !error && filteredMatches.length > 0 && (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 hover:border-[#10b981]/20 transition-all group"
            >
              {/* League */}
              <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-3">
                {match.league}
              </p>

              {/* Teams & Score */}
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-[#f1f5f9]">{match.homeTeam}</p>
                  <p className="text-sm font-medium text-[#f1f5f9]">{match.awayTeam}</p>
                </div>

                <div className="text-center mx-6">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-3xl text-[#f1f5f9]">{match.homeScore}</span>
                    <span className="text-[#334155] font-display text-xl">—</span>
                    <span className="font-display text-3xl text-[#f1f5f9]">{match.awayScore}</span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 bg-[rgba(16,185,129,0.08)] text-[#10b981] border border-[#10b981]/20 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse-slow" />
                    {match.minute}&apos;
                  </span>
                  <p className="text-[10px] text-[#475569] mt-1.5 font-mono">{match.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* League selector modal */}
      {showLeagueSelector && (
        <LeagueSelector
          token={token}
          selectedIds={defaultLeagueIds}
          onSave={handleLeagueSave}
          onClose={() => setShowLeagueSelector(false)}
        />
      )}
    </>
  );
}
