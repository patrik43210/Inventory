"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Link } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import toast from "react-hot-toast"
import { Save, Trash2 } from "lucide-react"

export default function LinksPage() {
  const { user } = useAuth()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    url: "",
  })
  const [editingLinks, setEditingLinks] = useState<{ [key: string]: { name: string; url: string } }>({})

  useEffect(() => {
    if (user) {
      fetchLinks()
    }
  }, [user])

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

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.url) {
      toast.error("Please fill in both name and URL")
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
      fetchLinks()
    } catch (error) {
      toast.error("Error adding link")
    }
  }

  const startEditing = (link: Link) => {
    setEditingLinks({
      ...editingLinks,
      [link.id]: {
        name: link.name,
        url: link.url,
      },
    })
  }

  const cancelEditing = (linkId: string) => {
    const newEditingLinks = { ...editingLinks }
    delete newEditingLinks[linkId]
    setEditingLinks(newEditingLinks)
  }

  const saveLink = async (linkId: string) => {
    const editData = editingLinks[linkId]
    if (!editData || !editData.name || !editData.url) {
      toast.error("Please fill in both name and URL")
      return
    }

    try {
      const { error } = await supabase
        .from("links")
        .update({
          name: editData.name,
          url: editData.url,
        })
        .eq("id", linkId)

      if (error) throw error

      toast.success("Link updated successfully!")
      cancelEditing(linkId)
      fetchLinks()
    } catch (error) {
      toast.error("Error updating link")
    }
  }

  const deleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return

    try {
      const { error } = await supabase.from("links").delete().eq("id", linkId)

      if (error) throw error

      toast.success("Link deleted successfully!")
      fetchLinks()
    } catch (error) {
      toast.error("Error deleting link")
    }
  }

  const updateEditingLink = (linkId: string, field: "name" | "url", value: string) => {
    setEditingLinks({
      ...editingLinks,
      [linkId]: {
        ...editingLinks[linkId],
        [field]: value,
      },
    })
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Header />

        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">Useful Links</h1>

          {/* Add Link Form */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-4">Add Link</h2>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Add Link
              </button>
            </form>
          </div>

          {/* All Links */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-4">All Links</h2>

            {links.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-dark-muted">No links saved yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div key={link.id} className="border border-gray-200 dark:border-dark-border rounded-lg p-4">
                    {editingLinks[link.id] ? (
                      // Edit mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={editingLinks[link.id].name}
                            onChange={(e) => updateEditingLink(link.id, "name", e.target.value)}
                            className="input-field"
                            placeholder="Name"
                          />
                          <input
                            type="url"
                            value={editingLinks[link.id].url}
                            onChange={(e) => updateEditingLink(link.id, "url", e.target.value)}
                            className="input-field"
                            placeholder="URL"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => saveLink(link.id)} className="btn-success flex items-center space-x-1">
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button onClick={() => cancelEditing(link.id)} className="btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                          >
                            {link.name}
                          </a>
                          <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">{link.url}</p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button onClick={() => startEditing(link)} className="btn-secondary text-sm">
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="btn-danger text-sm flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
