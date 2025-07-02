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
  type: string;
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
  const [typeVal, setTypeVal] = useState('Other');
  const [image, setImage] = useState<File | null>(null);

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
      setTypeVal(data.type);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let image_url = product?.image_url || null;
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
    await supabase
      .from('products')
      .update({ name, quantity, price, cost, type: typeVal, image_url })
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
        <select className="border p-2" value={typeVal} onChange={(e) => setTypeVal(e.target.value)}>
          <option value="Booster Packs">Booster Packs</option>
          <option value="Booster Boxes">Booster Boxes</option>
          <option value="Elite Trainer Boxes">Elite Trainer Boxes</option>
          <option value="Mini Tins">Mini Tins</option>
          <option value="Graded Cards">Graded Cards</option>
          <option value="Single Cards">Single Cards</option>
          <option value="Other">Other</option>
        </select>
        <input className="border p-2" type="file" onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} />
        <button className="bg-blue-600 text-white p-2" type="submit">Save</button>
      </form>
    </div>
  );
}

