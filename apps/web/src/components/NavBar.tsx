'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/supabase';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e293b]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-display text-xl text-[#10b981] tracking-wider select-none">
            MATCHIQ
          </span>

          <div className="flex items-center gap-5">
            <Link
              href="/strategies"
              className={`text-sm transition-colors ${
                pathname === '/strategies' || pathname.startsWith('/strategies/')
                  ? 'text-[#10b981] font-medium'
                  : 'text-[#475569] hover:text-[#f1f5f9]'
              }`}
            >
              Stratégies
            </Link>
            <Link
              href="/live"
              className={`text-sm transition-colors flex items-center gap-1.5 ${
                pathname === '/live'
                  ? 'text-[#10b981] font-medium'
                  : 'text-[#475569] hover:text-[#f1f5f9]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  pathname === '/live' ? 'bg-[#10b981]' : 'bg-[#f87171]'
                } animate-pulse-slow`}
              />
              Live
            </Link>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-[#475569] hover:text-[#f1f5f9] transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
