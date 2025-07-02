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
}

export default function SellProductPage({ params }: { params: { id: string } }) {
  const supabase = useSupabase();
  const session = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [units, setUnits] = useState(1);
  const [sellPrice, setSellPrice] = useState(0);

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
      setSellPrice(data.price);
    }
  }

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (units <= 0 || units > product.quantity) return;
    await supabase.from('sales').insert({
      user_id: session!.user.id,
      product_id: product.id,
      quantity: units,
      price: sellPrice,
    });
    await supabase
      .from('products')
      .update({ quantity: product.quantity - units })
      .eq('id', product.id);
    router.push('/products');
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl mb-4">Sell {product.name}</h1>
      <p className="mb-2">In Stock: {product.quantity}</p>
      <form onSubmit={handleSell} className="flex flex-col gap-2">
        <input
          className="border p-2"
          type="number"
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          min={1}
          max={product.quantity}
        />
        <input
          className="border p-2"
          type="number"
          value={sellPrice}
          onChange={(e) => setSellPrice(Number(e.target.value))}
        />
        <button className="bg-blue-600 text-white p-2" type="submit">
          Confirm
        </button>
      </form>
    </div>
  );
}
