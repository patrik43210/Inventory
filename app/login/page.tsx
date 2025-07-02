'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useSupabase } from '../../context/AuthContext';

export default function LoginPage() {
  const supabase = useSupabase();
  const session = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  if (session) {
    router.replace('/products');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.replace('/products');
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl mb-4">{isSignUp ? 'Sign Up' : 'Login'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          className="border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600">{error}</p>}
        <button className="bg-blue-600 text-white p-2" type="submit">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError('');
        }}
        className="underline mt-2"
      >
        {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
      </button>
    </div>
  );
}
