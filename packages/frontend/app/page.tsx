'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the media page
    router.push('/media');
  }, [router]);

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      <div className='text-center'>
        <h2 className='text-2xl font-semibold mb-4'>Redirecting...</h2>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto'></div>
      </div>
    </main>
  );
}
