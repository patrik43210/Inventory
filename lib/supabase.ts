import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          quantity: number
          price: number
          cost: number
          type: string
          image: string | null
          profit: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          quantity: number
          price: number
          cost: number
          type: string
          image?: string | null
          profit: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          quantity?: number
          price?: number
          cost?: number
          type?: string
          image?: string | null
          profit?: number
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          user_id: string
          product_id: string
          product_name: string
          units: number
          sell_price: number
          cost: number
          new_cost: number | null
          profit: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          product_name: string
          units: number
          sell_price: number
          cost: number
          new_cost?: number | null
          profit: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          product_name?: string
          units?: number
          sell_price?: number
          cost?: number
          new_cost?: number | null
          profit?: number
          created_at?: string
        }
      }
      links: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          created_at?: string
        }
      }
    }
  }
}
