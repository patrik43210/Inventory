"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { uploadFile } from "@/lib/storage"
import toast from "react-hot-toast"

interface FileUploadProps {
  onUpload: (url: string) => void
  accept?: string
  maxSize?: number // in MB
  preview?: boolean
  currentImage?: string | null
  showAsModal?: boolean
  onClose?: () => void
}

export default function FileUpload({
  onUpload,
  accept = "image/*",
  maxSize = 5,
  preview = true,
  currentImage,
  showAsModal = false,
  onClose,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    setUploading(true)
    try {
      const url = await uploadFile(file, "images")
      onUpload(url)
      toast.success("File uploaded successfully!")
      if (onClose) onClose()
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Error uploading file")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const content = (
    <div className="space-y-4">
      {preview && currentImage && (
        <div className="relative w-32 h-32 mx-auto">
          <img
            src={currentImage || "/placeholder.svg"}
            alt="Current"
            className="w-full h-full object-cover rounded-lg border-2 border-gray-200 dark:border-dark-border"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=128&width=128"
            }}
          />
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileInput} className="hidden" />

        {uploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600 dark:text-dark-muted">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-dark-card rounded-full">
              <Upload className="w-8 h-8 text-gray-600 dark:text-dark-muted" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">
                Drop files here or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 dark:text-dark-muted">
                Supports {accept} files up to {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Upload Image</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    )
  }

  return content
}
