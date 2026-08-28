'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name') || 'there';
  const paidId = searchParams.get('paidId');

  useEffect(() => {
    const params = new URLSearchParams({ paid: name });
    if (paidId) params.set('paidId', paidId);

    const timer = setTimeout(() => {
      router.push(`/?${params.toString()}`);
    }, 2500);
    return () => clearTimeout(timer);
  }, [name, paidId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
        <div style={{ fontSize: '48px' }}>✅</div>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Payment successful, {name}!
        </h1>
        <p className="mt-2 text-zinc-600">Redirecting you back to the bill...</p>
      </section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
