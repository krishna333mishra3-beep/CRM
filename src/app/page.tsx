'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    } else {
      const fallbackTimer = setTimeout(() => {
        if (!user) {
          router.replace('/login');
        } else {
          router.replace('/dashboard');
        }
      }, 500);
      return () => clearTimeout(fallbackTimer);
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">Connecting to CRM Workspace...</p>
        <Link
          href="/dashboard"
          className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors"
        >
          Click here if not redirected automatically
        </Link>
      </div>
    </div>
  );
}
