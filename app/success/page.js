'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name') || 'there';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/?paid=${encodeURIComponent(name)}`);
    }, 2500);
    return () => clearTimeout(timer);
  }, [name, router]);

  return (
    <main style={{ maxWidth: '480px', margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '48px' }}>✅</div>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '16px' }}>
        Payment successful, {name}!
      </h1>
      <p style={{ color: '#666', marginTop: '8px' }}>
        Redirecting you back to the bill...
      </p>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '80px' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
