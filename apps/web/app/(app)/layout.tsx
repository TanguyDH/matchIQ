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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
