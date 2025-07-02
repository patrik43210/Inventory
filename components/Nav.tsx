'use client'
import Link from 'next/link';
import { useSession, useSupabase } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

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
    <nav className="flex items-center gap-4 p-4 border-b mb-4">
      <h1 className="font-semibold text-lg">Inventory App</h1>
      <Link href="/products" className="underline">📦 Products Page</Link>
      <Link href="/dashboard" className="underline">📊 Open Dashboard</Link>
      <Link href="/links" className="underline">🔗 Links Page</Link>
      <ThemeToggle />
      <img
        src={session.user.user_metadata?.avatar_url || '/avatar.png'}
        alt="profile"
        className="w-8 h-8 rounded-full ml-auto"
      />
      <button onClick={handleSignOut} className="underline">Sign Out</button>
    </nav>
  );
}
