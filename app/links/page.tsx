"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Link } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import toast from "react-hot-toast"
import { LinkIcon, Plus, ExternalLink, Trash2, Search, Globe } from "lucide-react"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

export default function LinksPage() {
  const { user } = useAuth()
  const [links, setLinks] = useState<Link[]>([])
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    url: "",
  })

  useEffect(() => {
    if (user) {
      fetchLinks()
    }
  }, [user])

  useEffect(() => {
    filterLinks()
  }, [links, searchTerm])

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setLinks(data || [])
    } catch (error) {
      toast.error("Error fetching links")
    } finally {
      setLoading(false)
    }
  }

  const filterLinks = () => {
    if (!searchTerm) {
      setFilteredLinks(links)
      return
    }

    const filtered = links.filter(
      (link) =>
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredLinks(filtered)
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)

    if (!formData.name || !formData.url) {
      toast.error("Please fill in both name and URL")
      setAddLoading(false)
      return
    }

    try {
      const { error } = await supabase.from("links").insert({
        user_id: user!.id,
        name: formData.name,
        url: formData.url,
      })

      if (error) throw error
      toast.success("Link added successfully!")
      setFormData({ name: "", url: "" })
      setShowAddModal(false)
      fetchLinks()
    } catch (error) {
      toast.error("Error adding link")
    } finally {
      setAddLoading(false)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from("links").delete().eq("id", linkId)
      if (error) throw error
      toast.success("Link deleted successfully!")
      setShowDeleteConfirm(null)
      fetchLinks()
    } catch (error) {
      toast.error("Error deleting link")
    } finally {
      setDeleteLoading(false)
    }
  }

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-teal-600 rounded-2xl shadow-lg">
                <LinkIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Links</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your important links and bookmarks</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Link</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="🔍 Search links by name or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Links Grid */}
          {filteredLinks.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4">
                <LinkIcon className="w-8 h-8 text-gray-400 mx-auto" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {links.length === 0 ? "No links added yet" : "No links match your search"}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                {links.length === 0 ? "Add your first link to get started" : "Try a different search term"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{link.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {getDomainFromUrl(link.url)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(link.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      <span>Visit Link</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(link.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Link Modal */}
          {showAddModal && (
            <Modal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              title="Add New Link"
              description="Add a new link to your collection for quick access."
              icon={
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              }
            >
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Project Documentation, Design Resources"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {addLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Link</span>
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
              onConfirm={() => handleDeleteLink(showDeleteConfirm)}
              title="Delete Link"
              message={`Are you sure you want to delete "${links.find((l) => l.id === showDeleteConfirm)?.name}"? This action cannot be undone.`}
              confirmText="Delete Link"
              cancelText="Keep Link"
              type="danger"
              isLoading={deleteLoading}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
