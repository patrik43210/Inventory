'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useSupabase } from '../../../../context/AuthContext';

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  image_url: string | null;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = useSupabase();
  const session = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    } else {
      fetchProduct();
    }
  }, [session]);

  async function fetchProduct() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', Number(params.id))
      .single();
    if (data) {
      setProduct(data);
      setName(data.name);
      setQuantity(data.quantity);
      setPrice(data.price);
      setCost(data.cost);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase
      .from('products')
      .update({ name, quantity, price, cost })
      .eq('id', Number(params.id));
    router.push('/products');
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl mb-4">Edit Product</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <input className="border p-2" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border p-2" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        <input className="border p-2" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <input className="border p-2" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        <button className="bg-blue-600 text-white p-2" type="submit">Save</button>
      </form>
    </div>
  );
}
