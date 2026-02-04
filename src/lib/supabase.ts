import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface QuoteRequest {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: string;
  vin?: string;
  description: string;
  photo_url?: string;
  status?: 'new' | 'contacted' | 'quoted' | 'completed';
  created_at?: string;
  updated_at?: string;
}
