'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSupabase } from '../context/AuthContext';

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  type: string;
  image_url: string | null;
  profit: number;
}

export default function ProductCard({ product, onDelete }: { product: Product; onDelete: (id: number) => void }) {
  const supabase = useSupabase();
  const [qty, setQty] = useState(product.quantity);

  const updateQty = async (delta: number) => {
    const newQty = qty + delta;
    if (newQty < 0) return;
    setQty(newQty);
    await supabase.from('products').update({ quantity: newQty }).eq('id', product.id);
  };

  return (
    <div className="border p-2 flex flex-col gap-1">
      {product.image_url && (
        <Image src={product.image_url} alt={product.name} width={128} height={128} className="object-cover" />
      )}
      <span className="font-semibold">{product.name}</span>
      <span>Qty: {qty}</span>
      <span>Price: £{product.price}</span>
      <span>Cost: £{product.cost}</span>
      {qty === 0 && <span className="text-red-600">Out of Stock</span>}
      {qty > 0 && qty < 3 && <span className="text-yellow-600">Low Stock</span>}
      <div className="flex gap-2 mt-2">
        <button onClick={() => updateQty(1)} className="px-2 border">+1</button>
        <button onClick={() => updateQty(-1)} className="px-2 border">-1</button>
      </div>
      <div className="flex gap-2 mt-2">
        <Link href={`/products/${product.id}/sell`} className="underline">
          Sell
        </Link>
        <Link href={`/products/${product.id}/edit`} className="underline">
          Edit
        </Link>
        <button onClick={() => onDelete(product.id)} className="underline text-red-600">
          Delete
        </button>
      </div>
    </div>
  );
}

