import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://dbeeoriugpuqzqmhvjei.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZWVvcml1Z3B1cXpxbWh2amVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI5NjQsImV4cCI6MjA3MjA3ODk2NH0.zcYPudjhJg1Xg1NfgZtoAnhniSz-CGgOIMAd8IFfup0");
async function run() {
    const { data, error } = await supabase
        .schema('projects')
        .from('projects')
        .select('*, phases(phase_name, phase_status), last_comment:project_comments(content, created_at, user:v_profiles!user_id(email))');
    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("SUCCESS");
        console.log("Count:", data.length);
        console.log("Sample project:", data[0].name);
    }
}
run();
