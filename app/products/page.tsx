'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useSupabase } from '../../context/AuthContext';

interface Product {
  id: number;
  user_id: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  image_url: string | null;
}

export default function ProductsPage() {
  const session = useSession();
  const supabase = useSupabase();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    } else {
      fetchProducts();
    }
  }, [session]);

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', session?.user.id)
      .order('id');
    setProducts(data || []);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    let image_url = null;
    if (image) {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`${session!.user.id}/${Date.now()}-${image.name}`, image);
      if (!error) {
        const { data: url } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);
        image_url = url.publicUrl;
      }
    }
    await supabase.from('products').insert({
      user_id: session!.user.id,
      name,
      quantity,
      price,
      cost,
      image_url,
    });
    setName('');
    setQuantity(0);
    setPrice(0);
    setCost(0);
    setImage(null);
    fetchProducts();
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Products</h1>
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4">
        <input className="border p-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="border p-2" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="Quantity" />
        <input className="border p-2" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price" />
        <input className="border p-2" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} placeholder="Cost" />
        <input className="border p-2" type="file" onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} />
        <button className="bg-blue-600 text-white p-2" type="submit">Add</button>
      </form>
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id} className="border p-2 flex justify-between">
            <span>{p.name} ({p.quantity})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
