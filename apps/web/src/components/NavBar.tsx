'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/supabase';

export default function NavBar() {
  const pathname = usePathname();

  const isStrategies = pathname === '/strategies' || pathname.startsWith('/strategies/');
  const isLive = pathname === '/live';
  const isSettings = pathname === '/settings';

  return (
    <>
      {/* ── Desktop top nav ───────────────────────────────────────────────── */}
      <nav className="hidden sm:block sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e293b]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-display text-xl text-[#10b981] tracking-wider select-none">
              MATCHIQ
            </span>
            <div className="flex items-center gap-5">
              <Link
                href="/strategies"
                className={`text-sm transition-colors ${isStrategies ? 'text-[#10b981] font-medium' : 'text-[#475569] hover:text-[#f1f5f9]'}`}
              >
                Stratégies
              </Link>
              <Link
                href="/live"
                className={`text-sm transition-colors flex items-center gap-1.5 ${isLive ? 'text-[#10b981] font-medium' : 'text-[#475569] hover:text-[#f1f5f9]'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#10b981]' : 'bg-[#f87171]'} animate-pulse-slow`}
                />
                Live
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className={`text-sm transition-colors ${isSettings ? 'text-[#10b981] font-medium' : 'text-[#475569] hover:text-[#f1f5f9]'}`}
            >
              Paramètres
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-[#475569] hover:text-[#f1f5f9] transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile top bar (logo only) ────────────────────────────────────── */}
      <div className="sm:hidden sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e293b] h-12 flex items-center px-4">
        <span className="font-display text-lg text-[#10b981] tracking-wider select-none">
          MATCHIQ
        </span>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/98 backdrop-blur-md border-t border-[#1e293b]">
        <div className="flex items-stretch h-16">
          {/* Stratégies */}
          <Link
            href="/strategies"
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isStrategies ? 'text-[#10b981]' : 'text-[#475569]'}`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isStrategies ? 2 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
            <span className="text-[10px] font-medium tracking-wide">Stratégies</span>
          </Link>

          {/* Live */}
          <Link
            href="/live"
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${isLive ? 'text-[#10b981]' : 'text-[#475569]'}`}
          >
            <div className="relative">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={isLive ? 2 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon
                  points="10 8 16 12 10 16 10 8"
                  fill={isLive ? 'currentColor' : 'none'}
                  stroke="currentColor"
                />
              </svg>
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#f87171] animate-pulse-slow" />
            </div>
            <span className="text-[10px] font-medium tracking-wide">Live</span>
          </Link>

          {/* Paramètres */}
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isSettings ? 'text-[#10b981]' : 'text-[#475569]'}`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isSettings ? 2 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span className="text-[10px] font-medium tracking-wide">Paramètres</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
