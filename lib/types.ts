export interface Product {
  id: string
  user_id: string
  name: string
  quantity: number
  price: number
  cost: number
  type: string
  image_url?: string
  profit: number
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  user_id: string
  product_id: string
  product_name: string
  units: number
  sell_price: number
  cost: number
  new_cost?: number
  profit: number
  created_at: string
}

export interface Link {
  id: string
  user_id: string
  name: string
  url: string
  folder_id?: string
  created_at: string
}

export interface LinkFolder {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export const PRODUCT_TYPES = [
  "Booster Packs",
  "Booster Boxes",
  "Elite Trainer Boxes",
  "Mini Tins",
  "Graded Cards",
  "Single Cards",
  "Other",
]

export const FOLDER_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
]
