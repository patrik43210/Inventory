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
import { ArrowLeft, DollarSign, Package, TrendingUp } from "lucide-react"

export default function SellProductPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selling, setSelling] = useState(false)
  const [useDifferentPrice, setUseDifferentPrice] = useState(false)
  const [formData, setFormData] = useState({
    unitsToSell: 1,
    sellingPrice: 0,
    newPurchasePrice: 0,
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
        sellingPrice: Number(data.price),
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
    setSelling(true)

    if (!product || formData.unitsToSell <= 0 || formData.sellingPrice <= 0) {
      toast.error("Please fill in all required fields with valid values")
      setSelling(false)
      return
    }

    if (formData.unitsToSell > product.quantity) {
      toast.error("Cannot sell more units than in stock")
      setSelling(false)
      return
    }

    if (useDifferentPrice && formData.newPurchasePrice <= 0) {
      toast.error("Please enter a valid new purchase price")
      setSelling(false)
      return
    }

    try {
      const costPerUnit = useDifferentPrice ? formData.newPurchasePrice : Number(product.cost)
      const saleProfit = (formData.sellingPrice - costPerUnit) * formData.unitsToSell
      const newQuantity = product.quantity - formData.unitsToSell
      const newTotalProfit = Number(product.profit) + saleProfit

      // Update product quantity and profit
      const { error: updateError } = await supabase
        .from("products")
        .update({
          quantity: newQuantity,
          profit: newTotalProfit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)

      if (updateError) throw updateError

      // Record the sale
      const { error: saleError } = await supabase.from("sales").insert({
        user_id: user!.id,
        product_id: product.id,
        product_name: product.name,
        units: formData.unitsToSell,
        sell_price: formData.sellingPrice,
        cost: Number(product.cost),
        new_cost: useDifferentPrice ? formData.newPurchasePrice : null,
        profit: saleProfit,
      })

      if (saleError) throw saleError

      toast.success("Sale recorded successfully!")
      router.push("/products")
    } catch (error) {
      console.error("Sale error:", error)
      toast.error("Error recording sale")
    } finally {
      setSelling(false)
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

  const totalRevenue = formData.sellingPrice * formData.unitsToSell
  const costPerUnit = useDifferentPrice ? formData.newPurchasePrice : Number(product.cost)
  const totalCost = costPerUnit * formData.unitsToSell
  const totalProfit = totalRevenue - totalCost

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
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Sell Product</h1>
                  <p className="text-green-100">Record a sale for {product.name}</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleConfirmSale} className="space-y-8">
                {/* Product Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Available Stock
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={product.quantity}
                          readOnly
                          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-not-allowed"
                        />
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Purchase Cost per Unit
                      </label>
                      <input
                        type="text"
                        value={`£${Number(product.cost).toFixed(2)}`}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Units to Sell *
                      </label>
                      <input
                        type="number"
                        value={formData.unitsToSell}
                        onChange={(e) => setFormData({ ...formData, unitsToSell: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        min="1"
                        max={product.quantity}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selling Price per Unit (£) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Different Purchase Price Option */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="useDifferentPrice"
                      checked={useDifferentPrice}
                      onChange={(e) => setUseDifferentPrice(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="useDifferentPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Use different purchase price for this sale
                    </label>
                  </div>

                  {useDifferentPrice && (
                    <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Purchase Price per Unit (£) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.newPurchasePrice}
                        onChange={(e) => setFormData({ ...formData, newPurchasePrice: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required={useDifferentPrice}
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* Sale Summary */}
                {formData.unitsToSell > 0 && formData.sellingPrice > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Sale Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-green-600 dark:text-green-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                          £{totalRevenue.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-green-600 dark:text-green-400">Total Cost</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">£{totalCost.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-green-600 dark:text-green-400">Total Profit</p>
                        <p
                          className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-800 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}
                        >
                          £{totalProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    disabled={selling || formData.unitsToSell <= 0 || formData.sellingPrice <= 0}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    {selling ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Recording Sale...</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5" />
                        <span>Confirm Sale</span>
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
