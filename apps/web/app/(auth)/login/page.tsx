'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push('/strategies');
  }, [session, router]);

  if (authLoading) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <span className="font-display text-4xl text-[#10b981] tracking-wider">MATCHIQ</span>
          <p className="text-xs text-[#475569] font-mono mt-2 tracking-wider uppercase">
            Connexion à votre compte
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-4 shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-mono font-medium text-[#475569] uppercase tracking-widest mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-mono font-medium text-[#475569] uppercase tracking-widest mb-1.5"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          {error && <p className="text-[#f87171] text-xs font-mono">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10b981] hover:bg-[#34d399] disabled:opacity-40 disabled:cursor-not-allowed text-[#0f172a] text-sm font-semibold py-2.5 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.35)]"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-[#475569] mt-5">
          Pas de compte ?{' '}
          <Link href="/signup" className="text-[#10b981] hover:text-[#34d399] transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
