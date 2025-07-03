"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Product, Sale } from "@/lib/types";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import {
  BarChart3,
  Download,
  Trash2,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Activity,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const salesPerPage = 20;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [productsResponse, salesResponse] = await Promise.all([
        supabase.from("products").select("*").eq("user_id", user!.id),
        supabase
          .from("sales")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);

      if (productsResponse.error) throw productsResponse.error;
      if (salesResponse.error) throw salesResponse.error;

      setProducts(productsResponse.data || []);
      setSales(salesResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    setDeleteLoading(true);
    try {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) return;

      // Find the product and revert the sale
      const product = products.find((p) => p.id === sale.product_id);
      if (product) {
        const newQuantity = product.quantity + sale.units;
        const newProfit = product.profit - sale.profit;

        await supabase
          .from("products")
          .update({
            quantity: newQuantity,
            profit: newProfit,
          })
          .eq("id", sale.product_id);
      }

      // Delete the sale record
      const { error } = await supabase.from("sales").delete().eq("id", saleId);
      if (error) throw error;

      toast.success("Sale deleted and inventory restored!");
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Error deleting sale");
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCSV = () => {
    if (sales.length === 0) {
      toast.error("No sales data to export");
      return;
    }

    const headers = [
      "Date",
      "Product",
      "Units",
      "Sell Price",
      "Cost",
      "New Cost",
      "Profit",
    ];
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
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-log-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully!");
  };

  // Calculate metrics
  const totalProducts = products.length;
  const totalUnitsInStock = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );
  const totalStockValue = products.reduce(
    (sum, product) => sum + product.cost * product.quantity,
    0
  );
  const totalProfit = products.reduce(
    (sum, product) => sum + product.profit,
    0
  );
  const totalSalesCount = sales.length;
  const totalSalesRevenue = sales.reduce(
    (sum, sale) => sum + sale.sell_price * sale.units,
    0
  );
  const totalSalesCosts = sales.reduce(
    (sum, sale) => sum + (sale.new_cost || sale.cost) * sale.units,
    0
  );
  const moneySpent = totalStockValue + totalSalesCosts;

  // Pagination for sales
  const totalPages = Math.ceil(sales.length / salesPerPage);
  const startIndex = (currentPage - 1) * salesPerPage;
  const endIndex = startIndex + salesPerPage;
  const currentSales = sales.slice(startIndex, endIndex);

  const metrics = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Units in Stock",
      value: totalUnitsInStock,
      icon: Activity,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Stock Value",
      value: `£${totalStockValue.toFixed(2)}`,
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Total Profit",
      value: `£${totalProfit.toFixed(2)}`,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Sales",
      value: totalSalesCount,
      icon: ShoppingCart,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      textColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Sales Revenue",
      value: `£${totalSalesRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
      textColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "Money Spent",
      value: `£${moneySpent.toFixed(2)}`,
      icon: DollarSign,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-600 dark:text-red-400",
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Overview of your inventory performance
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div
                key={metric.title}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                    <metric.icon className={`w-6 h-6 ${metric.textColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sales Log */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sales Log
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track all your sales transactions
                  </p>
                </div>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={sales.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No sales recorded yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Start selling products to see your sales data here
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        {[
                          "Date",
                          "Product",
                          "Units",
                          "Sell Price",
                          "Cost",
                          "New Cost",
                          "Profit",
                          "Actions",
                        ].map((header) => (
                          <th
                            key={header}
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {sale.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {sale.units}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            £{sale.sell_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            £{sale.cost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {sale.new_cost
                              ? `£${sale.new_cost.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                            £{sale.profit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setShowDeleteConfirm(sale.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
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
                  <div className="flex justify-center items-center space-x-4 mt-8">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Export Info */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Export Sales Data
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Download your complete sales history as a CSV file for
                  external analysis
                </p>
              </div>
            </div>
          </div>

          {/* Delete Sale Confirmation Dialog */}
          {showDeleteConfirm && (
            <ConfirmDialog
              isOpen={!!showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(null)}
              onConfirm={() => deleteSale(showDeleteConfirm)}
              title="Delete Sale Record"
              message={`Are you sure you want to delete this sale? This will restore ${
                sales.find((s) => s.id === showDeleteConfirm)?.units
              } units back to inventory and adjust the profit calculations. This action cannot be undone.`}
              confirmText="Delete Sale"
              cancelText="Keep Sale"
              type="danger"
              isLoading={deleteLoading}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
