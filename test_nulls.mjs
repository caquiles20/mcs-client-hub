import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://dbeeoriugpuqzqmhvjei.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZWVvcml1Z3B1cXpxbWh2amVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI5NjQsImV4cCI6MjA3MjA3ODk2NH0.zcYPudjhJg1Xg1NfgZtoAnhniSz-CGgOIMAd8IFfup0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function test() {
    const { data } = await supabase.schema('projects').from('projects').select('*');
    if (!data) return;
    for (const p of data) {
        if (!p.name || !p.project_number || !p.client) {
            console.log("Found project with missing required fields for filtering:", JSON.stringify(p));
        }
    }
}
test();
