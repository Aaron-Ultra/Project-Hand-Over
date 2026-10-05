'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComplaintsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
