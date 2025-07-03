"use client"
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "danger" | "warning" | "info" | "success"
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <XCircle className="w-6 h-6 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case "info":
        return <Info className="w-6 h-6 text-blue-600" />
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600" />
    }
  }

  const getConfirmButtonClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
      case "info":
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      case "success":
        return "bg-green-600 hover:bg-green-700 focus:ring-green-500"
      default:
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 transition-all">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0">{getIcon()}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getConfirmButtonClass()}`}
              >
                {isLoading ? "Processing..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
