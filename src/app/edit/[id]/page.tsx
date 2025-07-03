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

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    cost: "",
    quantity: "",
    type: "Booster Packs",
    image: "",
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
        price: data.price.toString(),
        cost: data.cost.toString(),
        quantity: data.quantity.toString(),
        type: data.type,
        image: data.image || "",
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

    if (!formData.name || !formData.price || !formData.cost || !formData.quantity) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const quantity = Number.parseInt(formData.quantity)
      const price = Number.parseFloat(formData.price)
      const cost = Number.parseFloat(formData.cost)
      const profit = (price - cost) * quantity

      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          price,
          cost,
          quantity,
          type: formData.type,
          image: formData.image || null,
          profit,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Product updated successfully!")
      router.push("/products")
    } catch (error) {
      toast.error("Error updating product")
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!product) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Header />

        <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">Edit Product</h1>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Selling Price:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Purchase Cost:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Quantity:</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Type:</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Image URL:</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button type="submit" className="btn-success">
                  Save Changes
                </button>
                <button type="button" onClick={() => router.push("/products")} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
