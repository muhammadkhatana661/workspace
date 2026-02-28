import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "YOUR_SUPABASE_URL_HERE") {
    console.warn("Supabase URL or Anon Key is missing! Please configure your .env file.");
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'placeholder')
