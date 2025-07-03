"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Link, LinkFolder } from "@/lib/types";
import { FOLDER_COLORS } from "@/lib/types";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  LinkIcon,
  ExternalLink,
  Globe,
  Search,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function OrganizedLinksPage() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<LinkFolder[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [folderForm, setFolderForm] = useState({
    name: "",
    description: "",
    color: FOLDER_COLORS[0],
  });

  const [linkForm, setLinkForm] = useState({
    name: "",
    url: "",
    folder_id: "",
  });

  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState<
    string | null
  >(null);
  const [showDeleteLinkConfirm, setShowDeleteLinkConfirm] = useState<
    string | null
  >(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [foldersResponse, linksResponse] = await Promise.all([
        supabase
          .from("link_folders")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("links")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);

      if (foldersResponse.error) throw foldersResponse.error;
      if (linksResponse.error) throw linksResponse.error;

      setFolders(foldersResponse.data || []);
      setLinks(linksResponse.data || []);
    } catch (error) {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    if (!folderForm.name) {
      toast.error("Please enter a folder name");
      setAddLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("link_folders").insert({
        user_id: user!.id,
        name: folderForm.name,
        description: folderForm.description,
        color: folderForm.color,
      });

      if (error) throw error;
      toast.success("Folder created successfully!");
      setFolderForm({ name: "", description: "", color: FOLDER_COLORS[0] });
      setShowAddFolder(false);
      fetchData();
    } catch (error) {
      toast.error("Error creating folder");
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    if (!linkForm.name || !linkForm.url) {
      toast.error("Please fill in both name and URL");
      setAddLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("links").insert({
        user_id: user!.id,
        name: linkForm.name,
        url: linkForm.url,
        folder_id: linkForm.folder_id || null,
      });

      if (error) throw error;
      toast.success("Link added successfully!");
      setLinkForm({ name: "", url: "", folder_id: "" });
      setShowAddLink(false);
      fetchData();
    } catch (error) {
      toast.error("Error adding link");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setDeleteLoading(true);
    try {
      // First, update all links in this folder to have no folder
      await supabase
        .from("links")
        .update({ folder_id: null })
        .eq("folder_id", folderId);

      // Then delete the folder
      const { error } = await supabase
        .from("link_folders")
        .delete()
        .eq("id", folderId);
      if (error) throw error;

      toast.success("Folder deleted and links moved to uncategorized!");
      setShowDeleteFolderConfirm(null);
      setSelectedFolder(null);
      fetchData();
    } catch (error) {
      toast.error("Error deleting folder");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from("links").delete().eq("id", linkId);
      if (error) throw error;
      toast.success("Link deleted successfully!");
      setShowDeleteLinkConfirm(null);
      fetchData();
    } catch (error) {
      toast.error("Error deleting link");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getLinksInFolder = (folderId: string | null) => {
    const folderLinks = links.filter((link) => link.folder_id === folderId);
    if (!searchTerm) return folderLinks;

    return folderLinks.filter(
      (link) =>
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const uncategorizedLinks = getLinksInFolder(null);

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Organized Links
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your links with folders and categories
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddFolder(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Folder</span>
              </button>
              <button
                onClick={() => setShowAddLink(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Link</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="🔍 Search links in current folder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Folders */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Folders
                </h2>

                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                      selectedFolder === null
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <LinkIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">Uncategorized</span>
                    </div>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      {uncategorizedLinks.length}
                    </span>
                  </button>

                  {folders.map((folder) => (
                    <div key={folder.id} className="relative">
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                          selectedFolder === folder.id
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                          {getLinksInFolder(folder.id).length}
                        </span>
                      </button>

                      {/* Action buttons - positioned below the folder button when selected */}
                      {selectedFolder === folder.id && (
                        <div className="flex justify-end space-x-1 mt-2 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolder(folder.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
                            title="Edit folder"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteFolderConfirm(folder.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - Links */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFolder
                      ? folders.find((f) => f.id === selectedFolder)?.name
                      : "Uncategorized Links"}
                    {searchTerm &&
                      ` (${getLinksInFolder(selectedFolder).length} results)`}
                  </h2>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getLinksInFolder(selectedFolder).map((link) => (
                    <div
                      key={link.id}
                      className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {link.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {getDomainFromUrl(link.url)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDeleteLinkConfirm(link.id)}
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
                      </div>
                    </div>
                  ))}
                </div>

                {getLinksInFolder(selectedFolder).length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4">
                      <LinkIcon className="w-8 h-8 text-gray-400 mx-auto" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {searchTerm
                        ? "No links match your search"
                        : "No links in this folder"}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {searchTerm
                        ? "Try a different search term"
                        : "Add some links to get started"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Folder Modal */}
          {showAddFolder && (
            <Modal
              isOpen={showAddFolder}
              onClose={() => setShowAddFolder(false)}
              title="Create New Folder"
              description="Organize your links by creating folders with custom colors and descriptions."
              icon={
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              }
            >
              <form onSubmit={handleAddFolder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) =>
                      setFolderForm({ ...folderForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Work Resources, Personal Links"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={folderForm.description}
                    onChange={(e) =>
                      setFolderForm({
                        ...folderForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Brief description of what this folder contains"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Choose Color
                  </label>
                  <div className="flex space-x-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFolderForm({ ...folderForm, color })}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          folderForm.color === color
                            ? "border-gray-900 dark:border-white scale-110 shadow-lg"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {addLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Folder</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFolder(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Add Link Modal */}
          {showAddLink && (
            <Modal
              isOpen={showAddLink}
              onClose={() => setShowAddLink(false)}
              title="Add New Link"
              description="Add a link to your collection. You can assign it to a folder or leave it uncategorized."
              icon={
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              }
            >
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link Name
                  </label>
                  <input
                    type="text"
                    value={linkForm.name}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Project Documentation, Design Resources"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={linkForm.url}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, url: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Folder (Optional)
                  </label>
                  <select
                    value={linkForm.folder_id}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, folder_id: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">📂 Uncategorized</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        📁 {folder.name}
                      </option>
                    ))}
                  </select>
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
                    onClick={() => setShowAddLink(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Delete Folder Confirmation */}
          {showDeleteFolderConfirm && (
            <ConfirmDialog
              isOpen={!!showDeleteFolderConfirm}
              onClose={() => setShowDeleteFolderConfirm(null)}
              onConfirm={() => handleDeleteFolder(showDeleteFolderConfirm)}
              title="Delete Folder"
              message={`Are you sure you want to delete "${
                folders.find((f) => f.id === showDeleteFolderConfirm)?.name
              }"? All links in this folder will be moved to uncategorized. This action cannot be undone.`}
              confirmText="Delete Folder"
              cancelText="Keep Folder"
              type="warning"
              isLoading={deleteLoading}
            />
          )}

          {/* Delete Link Confirmation */}
          {showDeleteLinkConfirm && (
            <ConfirmDialog
              isOpen={!!showDeleteLinkConfirm}
              onClose={() => setShowDeleteLinkConfirm(null)}
              onConfirm={() => handleDeleteLink(showDeleteLinkConfirm)}
              title="Delete Link"
              message={`Are you sure you want to delete "${
                links.find((l) => l.id === showDeleteLinkConfirm)?.name
              }"? This action cannot be undone.`}
              confirmText="Delete Link"
              cancelText="Keep Link"
              type="danger"
              isLoading={deleteLoading}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
