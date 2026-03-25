'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Strategy, Trigger } from '@matchiq/shared-types';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 20;

export default function StrategyHistoryPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { id: strategyId } = useParams<{ id: string }>();

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load strategy name once
  useEffect(() => {
    if (!token || !strategyId) return;
    api.getStrategy(token, strategyId).then(setStrategy).catch(() => {});
  }, [token, strategyId]);

  // Load triggers on page change
  useEffect(() => {
    if (!token || !strategyId) return;
    setLoading(true);
    setError(null);
    api
      .getTriggers(token, strategyId, page, PAGE_SIZE)
      .then(({ data, total }) => {
        setTriggers(data);
        setTotal(total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, strategyId, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
          <span className="text-[#f1f5f9]">History</span>
        </span>
        {total > 0 && (
          <span className="ml-auto text-[10px] font-mono text-[#475569]">
            {total} trigger{total > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <span className="text-[#475569] text-sm font-mono">Loading…</span>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-[#f87171] text-xs font-mono">{error}</p>}

      {/* Empty */}
      {!loading && !error && triggers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#334155] rounded-xl">
          <p className="text-sm text-[#475569]">No triggers yet</p>
          <p className="text-xs text-[#334155] mt-1 font-mono">
            Matches where this strategy fired will appear here
          </p>
        </div>
      )}

      {/* List */}
      {!loading && triggers.length > 0 && (
        <>
          <div className="space-y-2">
            {triggers.map((trigger) => {
              const isHit = trigger.result === 'HIT';
              const isMiss = trigger.result === 'MISS';
              const date = new Date(trigger.triggered_at);
              const dateStr = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = date.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={trigger.id}
                  className={`rounded-xl border px-4 py-3 ${
                    isHit
                      ? 'bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.2)]'
                      : isMiss
                        ? 'bg-[rgba(248,113,113,0.06)] border-[rgba(248,113,113,0.2)]'
                        : 'bg-[#1e293b] border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#f1f5f9] truncate">
                        {trigger.home_team ?? '?'} vs {trigger.away_team ?? '?'}
                      </p>
                      <p className="text-xs text-[#475569] font-mono mt-0.5">
                        {dateStr} · {timeStr}
                        {trigger.minute != null && (
                          <span className="ml-2 text-[#334155]">min {trigger.minute}&apos;</span>
                        )}
                      </p>
                    </div>

                    {trigger.score_home != null && trigger.score_away != null && (
                      <span className="text-sm font-mono font-semibold text-[#94a3b8] shrink-0">
                        {trigger.score_home} – {trigger.score_away}
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-mono font-semibold shrink-0 px-2 py-0.5 rounded ${
                        isHit
                          ? 'text-[#10b981] bg-[rgba(16,185,129,0.1)]'
                          : isMiss
                            ? 'text-[#f87171] bg-[rgba(248,113,113,0.1)]'
                            : 'text-[#475569] bg-[#0f172a]'
                      }`}
                    >
                      {isHit ? 'HIT' : isMiss ? 'MISS' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#334155]">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#94a3b8] border border-[#334155] hover:border-[#475569] hover:text-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="text-xs text-[#475569] font-mono px-1">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono transition-colors ${
                          page === p
                            ? 'bg-[#10b981] text-[#0f172a] font-semibold'
                            : 'text-[#475569] hover:text-[#f1f5f9] hover:bg-[#334155]'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
              </div>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#94a3b8] border border-[#334155] hover:border-[#475569] hover:text-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
