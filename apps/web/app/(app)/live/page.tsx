'use client';

import { useEffect, useState } from 'react';

interface LiveMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
  league: string;
}

export default function LiveMatchesPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  const fetchLiveMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/live-matches`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const liveMatches: LiveMatch[] = await response.json();
      setMatches(liveMatches);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Matchs en Live</h1>
        <button
          onClick={fetchLiveMatches}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          🔄 Recharger
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <span className="text-gray-500 text-sm">Chargement...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-sm">Erreur: {error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Aucun match en live pour le moment</p>
        </div>
      )}

      {/* Matches list */}
      {!loading && !error && matches.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-4">
            {matches.length} match{matches.length > 1 ? 's' : ''} en live
          </p>

          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              {/* League */}
              <p className="text-xs text-gray-500 mb-2">{match.league}</p>

              {/* Teams & Score */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-100">{match.homeTeam}</p>
                  <p className="text-sm font-medium text-gray-100 mt-1">{match.awayTeam}</p>
                </div>

                <div className="text-center mx-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-100">{match.homeScore}</span>
                    <span className="text-gray-600">-</span>
                    <span className="text-2xl font-bold text-gray-100">{match.awayScore}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 bg-emerald-600/20 text-emerald-400 text-xs font-semibold px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    {match.minute}'
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{match.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
