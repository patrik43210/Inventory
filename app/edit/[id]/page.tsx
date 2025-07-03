"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { type Product, PRODUCT_TYPES } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import FileUpload from "@/components/ui/FileUpload"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Package, Save } from "lucide-react"

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    cost: 0,
    quantity: 0,
    type: PRODUCT_TYPES[0],
    image_url: "",
  })

  useEffect(() => {
    if (user && params.id) {
      fetchProduct()
    }
  }, [user, params.id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user!.id)
        .single()

      if (error) throw error
      setProduct(data)
      setFormData({
        name: data.name,
        price: Number(data.price),
        cost: Number(data.cost),
        quantity: data.quantity,
        type: data.type,
        image_url: data.image_url || "",
      })
    } catch (error) {
      toast.error("Product not found")
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!formData.name || formData.price <= 0 || formData.cost <= 0) {
      toast.error("Please fill in all required fields with valid values")
      setSaving(false)
      return
    }

    try {
      const profit = (formData.price - formData.cost) * formData.quantity

      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          price: formData.price,
          cost: formData.cost,
          quantity: formData.quantity,
          type: formData.type,
          image_url: formData.image_url || null,
          profit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Product updated successfully!")
      router.push("/products")
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Error updating product")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!product) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h1>
            <button onClick={() => router.push("/products")} className="btn-primary">
              Back to Products
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const profitPerUnit = formData.price - formData.cost
  const totalProfit = profitPerUnit * formData.quantity

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />

        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.push("/products")}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Products</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Edit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Edit Product</h1>
                  <p className="text-blue-100">Update product details and information</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSaveChanges} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Product Details */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {PRODUCT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Selling Price (£) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Purchase Cost (£) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantity *
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          min="0"
                        />
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>

                    {/* Profit Calculation */}
                    {formData.price > 0 && formData.cost > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                          Profit Calculation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Profit per Unit</p>
                            <p
                              className={`text-xl font-bold ${profitPerUnit >= 0 ? "text-green-800 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}
                            >
                              £{profitPerUnit.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Total Profit</p>
                            <p
                              className={`text-xl font-bold ${totalProfit >= 0 ? "text-green-800 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}
                            >
                              £{totalProfit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Product Image
                    </label>
                    <div className="space-y-4">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/products")}
                    className="px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
