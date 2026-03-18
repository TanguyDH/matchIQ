'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.push('/login');
  }, [session, loading, router]);

  if (loading || !session) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] font-body">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">{children}</main>
    </div>
  );
}
