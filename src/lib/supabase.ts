import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: number;
  email: string;
  password_hash: string;
  client: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface SubService {
  id: number;
  service_id: number;
  name: string;
  url: string;
  created_at?: string;
}

export interface Service {
  id: number;
  client_id: number;
  name: string;
  sub_services?: SubService[];
  created_at?: string;
}

export interface Client {
  id: number;
  name: string;
  logo: string;
  domain: string;
  services?: Service[];
  created_at?: string;
  updated_at?: string;
}