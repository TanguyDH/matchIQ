'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api/client';

type TelegramStatus = { linked: boolean; linkedAt?: string };

export default function SettingsPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;

  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (!token) return;
    api.getTelegramStatus(token).then((s) => {
      setStatus(s);
      setLoading(false);
    });
    return () => stopPolling();
  }, [token]);

  async function handleConnect() {
    if (!token) return;
    setConnecting(true);

    const { url } = await api.getTelegramLinkUrl(token);
    window.open(url, '_blank');

    // Poll every 2s for up to 2 min
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const s = await api.getTelegramStatus(token);
      if (s.linked) {
        setStatus(s);
        setConnecting(false);
        stopPolling();
        return;
      }
      if (attempts >= 60) {
        setConnecting(false);
        stopPolling();
      }
    }, 2000);
  }

  async function handleDisconnect() {
    if (!token) return;
    await api.disconnectTelegram(token);
    setStatus({ linked: false });
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-display font-semibold text-[#f1f5f9] mb-8">Paramètres</h1>

      <section className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#38bdf8]">
            <path
              d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
              fill="currentColor"
              opacity=".15"
            />
            <path
              d="M17.5 7.5L10.5 14.5L7 11"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 9l3 2.5L16.5 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="text-base font-medium text-[#f1f5f9]">Notifications Telegram</h2>
        </div>
        <p className="text-sm text-[#64748b] mb-5">
          Connectez votre Telegram pour recevoir les alertes de vos stratégies directement dans votre canal privé.
        </p>

        {loading ? (
          <div className="h-9 w-40 bg-[#334155] rounded-lg animate-pulse" />
        ) : status?.linked ? (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-[#10b981] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Telegram connecté
            </span>
            <button
              onClick={handleDisconnect}
              className="text-xs text-[#475569] hover:text-[#f87171] transition-colors"
            >
              Déconnecter
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#38bdf8]/30 border-t-[#38bdf8] rounded-full animate-spin" />
                En attente de connexion…
              </>
            ) : (
              'Connecter Telegram'
            )}
          </button>
        )}
      </section>
    </div>
  );
}
