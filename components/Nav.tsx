'use client'
import Link from 'next/link';
import { useSession, useSupabase } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Nav() {
  const session = useSession();
  const supabase = useSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!session) return null;

  return (
    <nav className="flex gap-4 p-4 border-b mb-4">
      <Link href="/products" className="underline">Products</Link>
      <Link href="/dashboard" className="underline">Dashboard</Link>
      <Link href="/links" className="underline">Links</Link>
      <button onClick={handleSignOut} className="ml-auto underline">Sign Out</button>
    </nav>
  );
}
