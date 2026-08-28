'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'there';

  return (
    <main style={{ maxWidth: '480px', margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '48px' }}>✅</div>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '16px' }}>
        Payment successful, {name}!
      </h1>
      <p style={{ color: '#666', marginTop: '8px' }}>
        Your share of the bill has been paid.
      </p>
      <Link href="/" style={{ display: 'inline-block', marginTop: '24px', color: '#000', textDecoration: 'underline' }}>
        ← Back to bill
      </Link>
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
