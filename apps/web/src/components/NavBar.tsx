'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/supabase';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight">
            Match<span className="text-emerald-500">IQ</span>
          </span>

          <div className="flex items-center gap-4">
            <Link
              href="/strategies"
              className={`text-sm transition-colors ${
                pathname === '/strategies'
                  ? 'text-emerald-500 font-medium'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Strategies
            </Link>
            <Link
              href="/live"
              className={`text-sm transition-colors ${
                pathname === '/live'
                  ? 'text-emerald-500 font-medium'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Live
            </Link>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
