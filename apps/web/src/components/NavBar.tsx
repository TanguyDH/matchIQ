'use client';

import { supabase } from '@/supabase';

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">
          Match<span className="text-emerald-500">IQ</span>
        </span>
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
