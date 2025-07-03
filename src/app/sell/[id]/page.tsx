"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function SellProductPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [useDifferentPrice, setUseDifferentPrice] = useState(false)
  const [formData, setFormData] = useState({
    unitsToSell: "",
    sellingPrice: "",
    newPurchasePrice: "",
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
      setFormData((prev) => ({
        ...prev,
        sellingPrice: data.price.toString(),
      }))
    } catch (error) {
      toast.error("Product not found")
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || !formData.unitsToSell || !formData.sellingPrice) {
      toast.error("Please fill in all required fields")
      return
    }

    const unitsToSell = Number.parseInt(formData.unitsToSell)
    const sellingPrice = Number.parseFloat(formData.sellingPrice)
    const newPurchasePrice = useDifferentPrice ? Number.parseFloat(formData.newPurchasePrice) : null

    if (unitsToSell > product.quantity) {
      toast.error("Cannot sell more units than in stock")
      return
    }

    if (unitsToSell <= 0) {
      toast.error("Units to sell must be greater than 0")
      return
    }

    try {
      const costPerUnit = newPurchasePrice || product.cost
      const saleProfit = (sellingPrice - costPerUnit) * unitsToSell
      const newQuantity = product.quantity - unitsToSell
      const newTotalProfit = product.profit + saleProfit

      // Update product quantity and profit
      const { error: updateError } = await supabase
        .from("products")
        .update({
          quantity: newQuantity,
          profit: newTotalProfit,
        })
        .eq("id", product.id)

      if (updateError) throw updateError

      // Record the sale
      const { error: saleError } = await supabase.from("sales").insert({
        user_id: user!.id,
        product_id: product.id,
        product_name: product.name,
        units: unitsToSell,
        sell_price: sellingPrice,
        cost: product.cost,
        new_cost: newPurchasePrice,
        profit: saleProfit,
      })

      if (saleError) throw saleError

      toast.success("Sale recorded successfully!")
      router.push("/products")
    } catch (error) {
      toast.error("Error recording sale")
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">Sell Product</h1>

            <form onSubmit={handleConfirmSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Product Name:
                </label>
                <input
                  type="text"
                  value={product.name}
                  readOnly
                  className="input-field bg-gray-100 dark:bg-dark-border cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">In Stock:</label>
                <input
                  type="number"
                  value={product.quantity}
                  readOnly
                  className="input-field bg-gray-100 dark:bg-dark-border cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Purchase Cost per Unit:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={product.cost}
                  readOnly
                  className="input-field bg-gray-100 dark:bg-dark-border cursor-not-allowed"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useDifferentPrice"
                  checked={useDifferentPrice}
                  onChange={(e) => setUseDifferentPrice(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="useDifferentPrice" className="text-sm text-gray-700 dark:text-dark-text">
                  Use different purchase price for this sale
                </label>
              </div>

              {useDifferentPrice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                    New Purchase Price per Unit:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="New purchase price"
                    value={formData.newPurchasePrice}
                    onChange={(e) => setFormData({ ...formData, newPurchasePrice: e.target.value })}
                    className="input-field"
                    required={useDifferentPrice}
                    min="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Units to Sell:
                </label>
                <input
                  type="number"
                  placeholder="Units to sell"
                  value={formData.unitsToSell}
                  onChange={(e) => setFormData({ ...formData, unitsToSell: e.target.value })}
                  className="input-field"
                  required
                  min="1"
                  max={product.quantity}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Selling Price per Unit:
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Selling price per unit"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button type="submit" className="btn-success">
                  Confirm Sale
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
