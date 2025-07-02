'use client'
import { useState, useEffect } from 'react';
import { useSession, useSupabase } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Sale {
  id: number;
  product_id: number;
  product_name: string;
  units: number;
  sell_price: number;
  cost: number;
  new_cost: number | null;
  profit: number;
  created_at: string;
}

interface Product {
  id: number;
  quantity: number;
  cost: number;
  profit: number;
}

export default function DashboardPage() {
  const session = useSession();
  const supabase = useSupabase();
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    } else {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    const { data: salesData } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', session?.user.id)
      .order('created_at', { ascending: false });
    setSales(salesData || []);

    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', session?.user.id);
    setProducts(prodData || []);
  }

  const totalProducts = products.length;
  const totalUnits = products.reduce((a, p) => a + p.quantity, 0);
  const totalStockValue = products.reduce((a, p) => a + p.quantity * p.cost, 0);
  const totalProfit = products.reduce((a, p) => a + (p.profit || 0), 0);
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((a, s) => a + s.sell_price * s.units, 0);
  const spentOnSales = sales.reduce((a, s) => a + (s.new_cost ?? s.cost) * s.units, 0);
  const moneySpent = totalStockValue + spentOnSales;

  return (
    <div>
      <h1 className="text-2xl mb-4">Dashboard</h1>
      <ul className="space-y-1 mb-4">
        <li>Total Products: {totalProducts}</li>
        <li>Total Units in Stock: {totalUnits}</li>
        <li>Total Stock Value: £{totalStockValue.toFixed(2)}</li>
        <li>Total Profit: £{totalProfit.toFixed(2)}</li>
        <li>Total Sales: {totalSales}</li>
        <li>Total Sales Revenue: £{totalRevenue.toFixed(2)}</li>
        <li>Money Spent: £{moneySpent.toFixed(2)}</li>
      </ul>
      <table className="w-full border text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Date</th>
            <th className="p-2">Product</th>
            <th className="p-2">Units</th>
            <th className="p-2">Sell Price</th>
            <th className="p-2">Cost</th>
            <th className="p-2">New Cost</th>
            <th className="p-2">Profit</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{new Date(s.created_at).toLocaleDateString()}</td>
              <td className="p-2">{s.product_name}</td>
              <td className="p-2">{s.units}</td>
              <td className="p-2">£{s.sell_price}</td>
              <td className="p-2">£{s.cost}</td>
              <td className="p-2">{s.new_cost ? `£${s.new_cost}` : '-'}</td>
              <td className="p-2">£{s.profit.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

