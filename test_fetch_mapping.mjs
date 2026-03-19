import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dbeeoriugpuqzqmhvjei.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZWVvcml1Z3B1cXpxbWh2amVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI5NjQsImV4cCI6MjA3MjA3ODk2NH0.zcYPudjhJg1Xg1NfgZtoAnhniSz-CGgOIMAd8IFfup0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    try {
        const { data, error } = await supabase
            .schema('projects')
            .from('projects')
            .select('*, phases(phase_name, phase_status), last_comment:project_comments(content, created_at, user:v_profiles!user_id(email))');
        
        if (error) throw error;

        const projectsWithComments = (data).map(project => {
            const lastComment = project.last_comment && project.last_comment.length > 0
                ? project.last_comment.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
                : null;

            return {
                ...project,
                last_comment: lastComment ? {
                    content: lastComment.content,
                    created_at: lastComment.created_at,
                    user_email: lastComment.user?.email
                } : undefined
            };
        });

        console.log("SUCCESS. Row count:", projectsWithComments.length);
        
        // Simulating the filter on frontend
        const filteredProjects = projectsWithComments.filter(p =>
            p.name.toLowerCase().includes(''.toLowerCase()) ||
            p.project_number.toLowerCase().includes(''.toLowerCase()) ||
            p.client.toLowerCase().includes(''.toLowerCase())
        );
        console.log("Filtered count:", filteredProjects.length);

    } catch (err) {
        console.error("CAUGHT ERROR:", err);
    }
}
test();
