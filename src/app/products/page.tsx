"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { type Product, PRODUCT_TYPES } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { Search, Plus, Minus, Edit, Trash2 } from "lucide-react"

export default function ProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    price: "",
    cost: "",
    type: "Booster Packs",
    image: "",
  })

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [sortBy, setSortBy] = useState("Name (A-Z)")
  const [showOutOfStock, setShowOutOfStock] = useState(true)
  const [showLowStock, setShowLowStock] = useState(true)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, typeFilter, sortBy, showOutOfStock, showLowStock])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      toast.error("Error fetching products")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Type filter
    if (typeFilter !== "All Types") {
      filtered = filtered.filter((product) => product.type === typeFilter)
    }

    // Stock filters
    if (!showOutOfStock) {
      filtered = filtered.filter((product) => product.quantity > 0)
    }
    if (!showLowStock) {
      filtered = filtered.filter((product) => product.quantity >= 3)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "Name (A-Z)":
          return a.name.localeCompare(b.name)
        case "Name (Z-A)":
          return b.name.localeCompare(a.name)
        case "Quantity (Low-High)":
          return a.quantity - b.quantity
        case "Quantity (High-Low)":
          return b.quantity - a.quantity
        case "Price (Low-High)":
          return a.price - b.price
        case "Price (High-Low)":
          return b.price - a.price
        case "Cost (Low-High)":
          return a.cost - b.cost
        case "Cost (High-Low)":
          return b.cost - a.cost
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.quantity || !formData.price || !formData.cost) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const quantity = Number.parseInt(formData.quantity)
      const price = Number.parseFloat(formData.price)
      const cost = Number.parseFloat(formData.cost)
      const profit = (price - cost) * quantity

      const { error } = await supabase.from("products").insert({
        user_id: user!.id,
        name: formData.name,
        quantity,
        price,
        cost,
        type: formData.type,
        image: formData.image || null,
        profit,
      })

      if (error) throw error

      toast.success("Product added successfully!")
      setFormData({
        name: "",
        quantity: "",
        price: "",
        cost: "",
        type: "Booster Packs",
        image: "",
      })
      fetchProducts()
    } catch (error) {
      toast.error("Error adding product")
    }
  }

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      const newProfit = (product.price - product.cost) * newQuantity

      const { error } = await supabase
        .from("products")
        .update({
          quantity: newQuantity,
          profit: newProfit,
        })
        .eq("id", productId)

      if (error) throw error

      fetchProducts()
      toast.success("Quantity updated")
    } catch (error) {
      toast.error("Error updating quantity")
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error

      toast.success("Product deleted successfully!")
      fetchProducts()
    } catch (error) {
      toast.error("Error deleting product")
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setTypeFilter("All Types")
    setSortBy("Name (A-Z)")
    setShowOutOfStock(true)
    setShowLowStock(true)
  }

  // Calculate totals
  const totalProfit = products.reduce((sum, product) => sum + product.profit, 0)
  const totalStockValue = products.reduce((sum, product) => sum + product.cost * product.quantity, 0)

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / (itemsPerPage === -1 ? filteredProducts.length : itemsPerPage))
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? 0 : itemsPerPage)
  const endIndex = itemsPerPage === -1 ? filteredProducts.length : startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Header />

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Add Product Form */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-4">Add Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Selling Price per Unit"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Purchase Cost per Unit"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="select-field"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  placeholder="Image URL"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn-primary">
                Add Product
              </button>
            </form>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                Total Profit: £{totalProfit.toFixed(2)}
              </h3>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                Total Stock Value: £{totalStockValue.toFixed(2)}
              </h3>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="🔍 Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select-field">
                <option value="All Types">All Types</option>
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field">
                <option value="Name (A-Z)">Name (A-Z)</option>
                <option value="Name (Z-A)">Name (Z-A)</option>
                <option value="Quantity (Low-High)">Quantity (Low-High)</option>
                <option value="Quantity (High-Low)">Quantity (High-Low)</option>
                <option value="Price (Low-High)">Price (Low-High)</option>
                <option value="Price (High-Low)">Price (High-Low)</option>
                <option value="Cost (Low-High)">Cost (Low-High)</option>
                <option value="Cost (High-Low)">Cost (High-Low)</option>
              </select>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number.parseInt(e.target.value))}
                className="select-field"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOutOfStock}
                  onChange={(e) => setShowOutOfStock(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-dark-text">Show Out of Stock</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-dark-text">Show Low Stock</span>
              </label>
              <button onClick={resetFilters} className="btn-secondary text-sm">
                Show All
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">Products</h2>

            {currentProducts.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-dark-muted">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                  <div key={product.id} className="card p-4">
                    <div className="aspect-square mb-4 bg-gray-100 dark:bg-dark-border rounded-lg overflow-hidden">
                      <img
                        src={product.image || "/placeholder.svg?height=200&width=200"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=200"
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-dark-text text-sm leading-tight">
                          {product.name}
                        </h3>
                        <div className="flex flex-col space-y-1">
                          {product.quantity < 3 && product.quantity > 0 && (
                            <span className="badge-low-stock">Low Stock</span>
                          )}
                          {product.quantity === 0 && <span className="badge-out-of-stock">Out of Stock</span>}
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-dark-muted space-y-1">
                        <p>Type: {product.type}</p>
                        <p>Quantity: {product.quantity}</p>
                        <p>Price: £{product.price.toFixed(2)}</p>
                        <p>Cost: £{product.cost.toFixed(2)}</p>
                        <p>Profit: £{product.profit.toFixed(2)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => updateQuantity(product.id, product.quantity + 1)}
                          className="btn-success text-xs py-1 flex items-center justify-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+1</span>
                        </button>
                        <button
                          onClick={() => updateQuantity(product.id, product.quantity - 1)}
                          className="btn-warning text-xs py-1 flex items-center justify-center space-x-1"
                          disabled={product.quantity === 0}
                        >
                          <Minus className="w-3 h-3" />
                          <span>-1</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <button
                          onClick={() => router.push(`/sell/${product.id}`)}
                          className="btn-primary text-xs py-1"
                          disabled={product.quantity === 0}
                        >
                          Sell
                        </button>
                        <button
                          onClick={() => router.push(`/edit/${product.id}`)}
                          className="btn-secondary text-xs py-1 flex items-center justify-center"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="btn-danger text-xs py-1 flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && itemsPerPage !== -1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="flex items-center px-4 py-2 text-gray-700 dark:text-dark-text">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
