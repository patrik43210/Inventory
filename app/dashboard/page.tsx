'use client'
import { useState, useEffect } from 'react';
import { useSession, useSupabase } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Sale {
  id: number;
  product_id: number;
  user_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export default function DashboardPage() {
  const session = useSession();
  const supabase = useSupabase();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    } else {
      fetchSales();
    }
  }, [session]);

  async function fetchSales() {
    const { data } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', session?.user.id)
      .order('created_at', { ascending: false });
    setSales(data || []);
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">Dashboard</h1>
      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th className="p-2">Date</th>
            <th className="p-2">Product</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{new Date(s.created_at).toLocaleDateString()}</td>
              <td className="p-2">{s.product_id}</td>
              <td className="p-2">{s.quantity}</td>
              <td className="p-2">{s.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
