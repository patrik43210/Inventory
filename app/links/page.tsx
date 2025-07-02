'use client'
import { useState, useEffect } from 'react';
import { useSession, useSupabase } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';

interface LinkItem {
  id: number;
  user_id: string;
  name: string;
  url: string;
}

export default function LinksPage() {
  const session = useSession();
  const supabase = useSupabase();
  const router = useRouter();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    } else {
      fetchLinks();
    }
  }, [session]);

  async function fetchLinks() {
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', session?.user.id)
      .order('id');
    setLinks(data || []);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('links').insert({ user_id: session!.user.id, name, url });
    setName('');
    setUrl('');
    fetchLinks();
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Links</h1>
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4">
        <input className="border p-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="border p-2" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" />
        <button className="bg-blue-600 text-white p-2" type="submit">Add</button>
      </form>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.id} className="border p-2 flex justify-between">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline">{l.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
