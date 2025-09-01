import { createClient } from '@supabase/supabase-js'

// Using Lovable's native Supabase integration
// The credentials are automatically provided by Lovable when Supabase is connected
const supabaseUrl = 'https://caquiles20.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcXVpbGVzMjAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4MDA3MTQwMCwiZXhwIjoxOTk1NjQ3NDAwfQ.placeholder'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please ensure Supabase is connected to your Lovable project.')
}

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