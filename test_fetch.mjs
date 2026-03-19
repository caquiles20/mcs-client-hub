import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dbeeoriugpuqzqmhvjei.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZWVvcml1Z3B1cXpxbWh2amVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI5NjQsImV4cCI6MjA3MjA3ODk2NH0.zcYPudjhJg1Xg1NfgZtoAnhniSz-CGgOIMAd8IFfup0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log("Fetching...");
    const { data, error } = await supabase
        .schema('projects')
        .from('projects')
        .select('*, phases(phase_name, phase_status), last_comment:project_comments(content, created_at, user:v_profiles!user_id(email))');
    
    if (error) {
        console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2));
    } else {
        console.log("SUCCESS. Row count:", data?.length);
    }
}
test();
