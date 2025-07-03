"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Product, Sale } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import toast from "react-hot-toast"
import { ArrowLeft, Download, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import BarChart3 from "lucide-react" // Import BarChart3 component

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const salesPerPage = 20

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [productsResponse, salesResponse] = await Promise.all([
        supabase.from("products").select("*").eq("user_id", user!.id),
        supabase.from("sales").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      ])

      if (productsResponse.error) throw productsResponse.error
      if (salesResponse.error) throw salesResponse.error

      setProducts(productsResponse.data || [])
      setSales(salesResponse.data || [])
    } catch (error) {
      toast.error("Error fetching data")
    } finally {
      setLoading(false)
    }
  }

  const deleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale? This will revert the product quantity and profit.")) return

    try {
      const sale = sales.find((s) => s.id === saleId)
      if (!sale) return

      // Find the product and revert the sale
      const product = products.find((p) => p.id === sale.product_id)
      if (product) {
        const newQuantity = product.quantity + sale.units
        const newProfit = product.profit - sale.profit

        await supabase
          .from("products")
          .update({
            quantity: newQuantity,
            profit: newProfit,
          })
          .eq("id", sale.product_id)
      }

      // Delete the sale record
      const { error } = await supabase.from("sales").delete().eq("id", saleId)

      if (error) throw error

      toast.success("Sale deleted successfully!")
      fetchData()
    } catch (error) {
      toast.error("Error deleting sale")
    }
  }

  const exportCSV = () => {
    if (sales.length === 0) {
      toast.error("No sales data to export")
      return
    }

    const headers = ["Date", "Product", "Units", "Sell Price", "Cost", "New Cost", "Profit"]
    const csvContent = [
      headers.join(","),
      ...sales.map((sale) =>
        [
          new Date(sale.created_at).toLocaleDateString(),
          `"${sale.product_name}"`,
          sale.units,
          sale.sell_price.toFixed(2),
          sale.cost.toFixed(2),
          sale.new_cost ? sale.new_cost.toFixed(2) : "",
          sale.profit.toFixed(2),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-log-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success("CSV exported successfully!")
  }

  // Calculate metrics
  const totalProducts = products.length
  const totalUnitsInStock = products.reduce((sum, product) => sum + product.quantity, 0)
  const totalStockValue = products.reduce((sum, product) => sum + product.cost * product.quantity, 0)
  const totalProfit = products.reduce((sum, product) => sum + product.profit, 0)
  const totalSalesCount = sales.length
  const totalSalesRevenue = sales.reduce((sum, sale) => sum + sale.sell_price * sale.units, 0)
  const totalSalesCosts = sales.reduce((sum, sale) => sum + (sale.new_cost || sale.cost) * sale.units, 0)
  const moneySpent = totalStockValue + totalSalesCosts

  // Pagination for sales
  const totalPages = Math.ceil(sales.length / salesPerPage)
  const startIndex = (currentPage - 1) * salesPerPage
  const endIndex = startIndex + salesPerPage
  const currentSales = sales.slice(startIndex, endIndex)

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
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center text-green-600 dark:text-green-400">
              <BarChart3 className="w-6 h-6 mr-2" />
              <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <div className="text-sm text-gray-600 dark:text-dark-muted">Total Products</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">{totalProducts}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 dark:text-dark-muted">Total Units in Stock</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">{totalUnitsInStock}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 dark:text-dark-muted">Total Stock Value</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">£{totalStockValue.toFixed(2)}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 dark:text-dark-muted">Total Profit</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">£{totalProfit.toFixed(2)}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 dark:text-dark-muted">Total Sales</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">{totalSalesCount}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-600 dark:text-dark-muted">Total Sales Revenue</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                £{totalSalesRevenue.toFixed(2)}
              </div>
            </div>
            <div className="card p-4 md:col-span-2">
              <div className="text-sm text-gray-600 dark:text-dark-muted">Money Spent</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">£{moneySpent.toFixed(2)}</div>
            </div>
          </div>

          {/* Sales Log */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Sales Log</h2>
              <button
                onClick={exportCSV}
                className="btn-primary flex items-center space-x-2"
                disabled={sales.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-dark-muted">No sales recorded yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                    <thead className="bg-gray-50 dark:bg-dark-card">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          Units
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          Sell Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          New Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          Profit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-dark-border">
                      {currentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                            {sale.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                            {sale.units}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                            £{sale.sell_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                            £{sale.cost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                            {sale.new_cost ? `£${sale.new_cost.toFixed(2)}` : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                            £{sale.profit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-6">
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
              </>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <button onClick={() => router.push("/products")} className="btn-secondary flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          {/* Export Info */}
          <div className="mt-6 card p-4">
            <p className="text-gray-600 dark:text-dark-muted text-sm">This is to export the sales log as a CSV file</p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
