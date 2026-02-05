import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qmrrekpxduweomkgpnzo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcnJla3B4ZHV3ZW9ta2dwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDIxMzAsImV4cCI6MjA4NDc3ODEzMH0.n3Ge9QSDun3iGc8K79YmX1nUels6N9kryypvy88t8LQ';

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
