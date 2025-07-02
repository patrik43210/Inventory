'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useSupabase } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';

interface Product {
  id: number;
  user_id: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  type: string;
  image_url: string | null;
  profit: number;
}

const types = [
  'Booster Packs',
  'Booster Boxes',
  'Elite Trainer Boxes',
  'Mini Tins',
  'Graded Cards',
  'Single Cards',
  'Other',
];

export default function ProductsPage() {
  const session = useSession();
  const supabase = useSupabase();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [type, setType] = useState(types[0]);
  const [image, setImage] = useState<File | null>(null);

  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sort, setSort] = useState('name-asc');
  const [showOut, setShowOut] = useState(true);
  const [showLow, setShowLow] = useState(true);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

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
      .order('name');
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
      type,
      image_url,
    });
    setName('');
    setQuantity(0);
    setPrice(0);
    setCost(0);
    setType(types[0]);
    setImage(null);
    setToast('Product added');
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    await supabase.from('products').delete().eq('id', id);
    setToast('Product deleted');
    fetchProducts();
  };

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    .filter((p) => (filterType === 'All' ? true : p.type === filterType))
    .filter((p) => (showOut ? true : p.quantity > 0))
    .filter((p) => (showLow ? true : p.quantity >= 3));

  filtered.sort((a, b) => {
    switch (sort) {
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'quantity-asc':
        return a.quantity - b.quantity;
      case 'quantity-desc':
        return b.quantity - a.quantity;
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'cost-asc':
        return a.cost - b.cost;
      case 'cost-desc':
        return b.cost - a.cost;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginated = perPage === 0 ? filtered : filtered.slice(start, end);
  const totalPages = perPage === 0 ? 1 : Math.ceil(filtered.length / perPage);

  return (
    <div>
      <h1 className="text-2xl mb-4">Products</h1>
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4">
        <input className="border p-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="border p-2" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="Quantity" />
        <input className="border p-2" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price" />
        <input className="border p-2" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} placeholder="Cost" />
        <select className="border p-2" value={type} onChange={(e) => setType(e.target.value)}>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input className="border p-2" type="file" onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} />
        <button className="bg-blue-600 text-white p-2" type="submit">Add</button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <input
          className="border p-2"
          placeholder="Search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select className="border p-2" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="border p-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="quantity-desc">Quantity (High-Low)</option>
          <option value="quantity-asc">Quantity (Low-High)</option>
          <option value="price-desc">Price (High-Low)</option>
          <option value="price-asc">Price (Low-High)</option>
          <option value="cost-desc">Cost (High-Low)</option>
          <option value="cost-asc">Cost (Low-High)</option>
        </select>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={showOut} onChange={() => setShowOut(!showOut)} />
          <span>Show Out of Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={showLow} onChange={() => setShowLow(!showLow)} />
          <span>Show Low Stock</span>
        </div>
        <select className="border p-2" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={0}>All</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {paginated.map((p) => (
          <ProductCard key={p.id} product={p} onDelete={(id) => setConfirmId(id)} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-2 border ${page === i + 1 ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>{i + 1}</button>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmId !== null}
        message="Delete this product?"
        onConfirm={() => {
          if (confirmId !== null) handleDelete(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

