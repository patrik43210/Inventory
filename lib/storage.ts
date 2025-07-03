import { supabase } from "./supabase"

export const uploadFile = async (file: File, folder = "general"): Promise<string> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${user.id}/${folder}/${fileName}`

    const { data, error } = await supabase.storage.from("uploads").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Storage upload error:", error)
      throw error
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("Upload file error:", error)
    throw new Error("Failed to upload file")
  }
}

export const deleteFile = async (url: string): Promise<void> => {
  try {
    const path = url.split("/uploads/")[1]
    if (!path) return

    const { error } = await supabase.storage.from("uploads").remove([path])

    if (error) {
      console.error("Storage delete error:", error)
      throw error
    }
  } catch (error) {
    console.error("Delete file error:", error)
    throw new Error("Failed to delete file")
  }
}
