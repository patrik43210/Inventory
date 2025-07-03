"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"
import { supabase } from "@/lib/supabase"
import type { Note } from "@/lib/types"
import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import FileUpload from "@/components/ui/FileUpload"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import toast from "react-hot-toast"
import { User, Save, Plus, Edit, Trash2, Calendar, StickyNote, Mail, Camera } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, updateProfile } = useProfile()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showDeleteNoteConfirm, setShowDeleteNoteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    avatar_url: "",
  })

  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
  })

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
      })
    }
  }, [profile])

  useEffect(() => {
    if (user) {
      fetchNotes()
    }
  }, [user])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      toast.error("Error fetching notes")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    try {
      await updateProfile(profileForm)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Error updating profile")
    } finally {
      setSaveLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)

    if (!noteForm.title || !noteForm.content) {
      toast.error("Please fill in both title and content")
      setAddLoading(false)
      return
    }

    try {
      const { error } = await supabase.from("notes").insert({
        user_id: user!.id,
        title: noteForm.title,
        content: noteForm.content,
      })

      if (error) throw error
      toast.success("Note added successfully!")
      setNoteForm({ title: "", content: "" })
      setShowAddNote(false)
      fetchNotes()
    } catch (error) {
      toast.error("Error adding note")
    } finally {
      setAddLoading(false)
    }
  }

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", noteId)

      if (error) throw error
      toast.success("Note updated successfully!")
      setEditingNote(null)
      fetchNotes()
    } catch (error) {
      toast.error("Error updating note")
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)
      if (error) throw error
      toast.success("Note deleted successfully!")
      setShowDeleteNoteConfirm(null)
      fetchNotes()
    } catch (error) {
      toast.error("Error deleting note")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (profileLoading || loading) {
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

        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                    <p className="text-blue-100">Manage your account information and preferences</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <form onSubmit={handleProfileUpdate} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Avatar Section */}
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="relative inline-block">
                          {profileForm.avatar_url ? (
                            <img
                              src={profileForm.avatar_url || "/placeholder.svg"}
                              alt="Profile"
                              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                              <User className="w-16 h-16 text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full shadow-lg">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                          {profileForm.full_name || "Your Name"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Email cannot be changed for security reasons
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Profile Picture
                        </label>
                        <FileUpload
                          onUpload={(url) => setProfileForm({ ...profileForm, avatar_url: url })}
                          currentImage={profileForm.avatar_url}
                          accept="image/*"
                          maxSize={2}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      {saveLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <StickyNote className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">Notes</h2>
                      <p className="text-green-100">Keep track of important information and ideas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Note</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {notes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4">
                      <StickyNote className="w-8 h-8 text-gray-400 mx-auto" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No notes yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Add your first note to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                      >
                        {editingNote === note.id ? (
                          <EditNoteForm
                            note={note}
                            onSave={(updates) => handleUpdateNote(note.id, updates)}
                            onCancel={() => setEditingNote(null)}
                          />
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                                {note.title}
                              </h3>
                              <div className="flex space-x-2 ml-2">
                                <button
                                  onClick={() => setEditingNote(note.id)}
                                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteNoteConfirm(note.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap line-clamp-4">
                              {note.content}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>
                                {new Date(note.updated_at).toLocaleDateString()} at{" "}
                                {new Date(note.updated_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Note Modal */}
          {showAddNote && (
            <Modal
              isOpen={showAddNote}
              onClose={() => setShowAddNote(false)}
              title="Add New Note"
              description="Create a new note to keep track of important information."
              icon={
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <StickyNote className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              }
            >
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note Title</label>
                  <input
                    type="text"
                    placeholder="Enter note title"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note Content
                  </label>
                  <textarea
                    placeholder="Enter note content"
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {addLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Note</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddNote(false)
                      setNoteForm({ title: "", content: "" })
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Delete Note Confirmation Dialog */}
          {showDeleteNoteConfirm && (
            <ConfirmDialog
              isOpen={!!showDeleteNoteConfirm}
              onClose={() => setShowDeleteNoteConfirm(null)}
              onConfirm={() => handleDeleteNote(showDeleteNoteConfirm)}
              title="Delete Note"
              message={`Are you sure you want to delete "${notes.find((n) => n.id === showDeleteNoteConfirm)?.title}"? This action cannot be undone.`}
              confirmText="Delete Note"
              cancelText="Keep Note"
              type="danger"
              isLoading={deleteLoading}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

function EditNoteForm({
  note,
  onSave,
  onCancel,
}: {
  note: Note
  onSave: (updates: Partial<Note>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ title, content })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        required
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
