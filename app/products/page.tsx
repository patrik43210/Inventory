"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { PRODUCT_TYPES } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import FileUpload from "@/components/ui/FileUpload"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Edit,
  Trash2,
  Minus,
  ShoppingCart,
} from "lucide-react"

export default function ProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [sortBy, setSortBy] = useState("Name (A-Z)")
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showOutOfStock, setShowOutOfStock] = useState(true)
  const [showLowStock, setShowLowStock] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    price: 0,
    cost: 0,
    type: PRODUCT_TYPES[0],
    image_url: "",
  })

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
    const filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "All Types" || product.type === typeFilter
      const matchesOutOfStock = showOutOfStock || product.quantity > 0
      const matchesLowStock = showLowStock || product.quantity >= 3

      return matchesSearch && matchesType && matchesOutOfStock && matchesLowStock
    })

    // Sort products
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
          return Number(a.price) - Number(b.price)
        case "Price (High-Low)":
          return Number(b.price) - Number(a.price)
        case "Cost (Low-High)":
          return Number(a.cost) - Number(b.cost)
        case "Cost (High-Low)":
          return Number(b.cost) - Number(a.cost)
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)

    if (!formData.name || formData.price <= 0 || formData.cost <= 0) {
      toast.error("Please fill in all required fields with valid values")
      setAddLoading(false)
      return
    }

    try {
      const profit = Number(formData.price) - Number(formData.cost)
      const { error } = await supabase.from("products").insert({
        user_id: user!.id,
        name: formData.name,
        quantity: formData.quantity,
        price: formData.price,
        cost: formData.cost,
        type: formData.type,
        image_url: formData.image_url,
        profit: profit,
      })

      if (error) throw error

      toast.success("Product added successfully!")
      setFormData({
        name: "",
        quantity: 0,
        price: 0,
        cost: 0,
        type: PRODUCT_TYPES[0],
        image_url: "",
      })
      setShowAddModal(false)
      fetchProducts()
    } catch (error) {
      toast.error("Error adding product")
    } finally {
      setAddLoading(false)
    }
  }

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    try {
      const { error } = await supabase.from("products").update({ quantity: newQuantity }).eq("id", productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      toast.error("Error updating quantity")
    }
  }

  const deleteProduct = async (productId: string) => {
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error

      toast.success("Product deleted successfully!")
      setShowDeleteConfirm(null)
      fetchProducts()
    } catch (error) {
      toast.error("Error deleting product")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditProduct = (productId: string) => {
    router.push(`/edit/${productId}`)
  }

  const handleSellProduct = (productId: string) => {
    router.push(`/sell/${productId}`)
  }

  // Calculate stats
  const totalProducts = products.length
  const totalProfit = products.reduce((sum, product) => sum + Number(product.profit) * product.quantity, 0)
  const totalValue = products.reduce((sum, product) => sum + Number(product.price) * product.quantity, 0)
  const outOfStockCount = products.filter((product) => product.quantity === 0).length

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / (itemsPerPage === -1 ? filteredProducts.length : itemsPerPage))
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredProducts.length : itemsPerPage)
  const endIndex = itemsPerPage === -1 ? filteredProducts.length : startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your inventory and track stock levels</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">£{totalProfit.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Value</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">£{totalValue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="🔍 Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="All Types">All Types</option>
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
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
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Out of Stock</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Low Stock</span>
              </label>
              <button
                onClick={() => {
                  setShowOutOfStock(true)
                  setShowLowStock(true)
                  setSearchTerm("")
                  setTypeFilter("All Types")
                  setSortBy("Name (A-Z)")
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Show All
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {currentProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400 mx-auto" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No products found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                {products.length === 0 ? "Add your first product to get started" : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {currentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                      {product.image_url ? (
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}

                      {/* Stock Status Badge */}
                      {product.quantity === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                          Out of Stock
                        </div>
                      )}
                      {product.quantity > 0 && product.quantity < 3 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full">
                          Low Stock
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{product.name}</h3>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(product.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.type}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            £{Number(product.price).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Cost:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            £{Number(product.cost).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Profit:</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            £{Number(product.profit).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(product.id, product.quantity - 1)}
                            disabled={product.quantity <= 0}
                            className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[2rem] text-center">
                            {product.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, product.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sell Button */}
                      <button
                        onClick={() => handleSellProduct(product.id)}
                        disabled={product.quantity === 0}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Sell</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of{" "}
                    {filteredProducts.length} products
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                      {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Add Product Modal */}
        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Product"
            description="Add a new product to your inventory with all the details."
            icon={
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            }
          >
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    {PRODUCT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {formData.price > 0 && formData.cost > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    <strong>Profit per unit:</strong> £{(formData.price - formData.cost).toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Image</label>
                <div className="space-y-4">
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter image URL (optional)"
                  />
                  <div className="text-center text-gray-500 dark:text-gray-400">or</div>
                  <FileUpload
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                    currentImage={formData.image_url}
                    accept="image/*"
                    maxSize={5}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {addLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <ConfirmDialog
            isOpen={!!showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(null)}
            onConfirm={() => deleteProduct(showDeleteConfirm)}
            title="Delete Product"
            message={`Are you sure you want to delete "${products.find((p) => p.id === showDeleteConfirm)?.name}"? This action cannot be undone.`}
            confirmText="Delete Product"
            cancelText="Keep Product"
            type="danger"
            isLoading={deleteLoading}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
