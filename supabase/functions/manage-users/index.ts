import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = Deno.env.get("SUPABASE_URL") ?? "";
        console.log("Supabase URL in Function:", url.substring(0, 15) + "...");
        
        const authHeader = req.headers.get("Authorization")!;
        const supabaseClient = createClient(
            url,
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        );

        // 1. Get requester info
        const {
            data: { user: requester },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError) {
            console.error("Auth error details:", JSON.stringify(authError));
            return new Response(JSON.stringify({ 
                error: "Invalid token", 
                details: authError.message,
                hint: "Ensure you are logged in to the correct Supabase project"
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }
        
        if (!requester) {
            // This case means no authError, but no user was returned (e.g., token is valid but for no user)
            // This should ideally be caught by authError, but as a fallback.
            return new Response(JSON.stringify({ 
                error: "Unauthorized", 
                details: "No user found for the provided token.",
                hint: "Ensure the token corresponds to an active user."
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // 2. Check if requester is an admin
        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", requester.id)
            .single();

        if (profileError || profile?.role !== "admin") {
            throw new Error("Forbidden: Only administrators can manage users");
        }

        // 3. Process request
        const { action, userData } = await req.json();

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        if (action === "create") {
            const { email, password, full_name, role, client_name } = userData;

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name,
                    role: role || "visualizador",
                    client_name: client_name || null,
                },
            });

            if (createError) throw createError;

            return new Response(JSON.stringify({ user: newUser }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 201,
            });
        }

        throw new Error("Invalid action");
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 400,
        });
    }
});
