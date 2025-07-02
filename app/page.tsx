'use client'
import { useSession } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace('/products');
    else router.replace('/login');
  }, [session, router]);

  return null;
}
