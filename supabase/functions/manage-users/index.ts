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
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.error("No Authorization header provided");
            return new Response(JSON.stringify({ error: "Falta encabezado de autorización" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const token = authHeader.replace("Bearer ", "");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Use service role client to validate token (more robust in Edge Functions)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 1. Validate the user token
        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !requester) {
            console.error("Auth error details:", JSON.stringify(authError));
            return new Response(JSON.stringify({ 
                error: "Token inválido o sesión expirada", 
                details: authError?.message || "No se encontró el usuario",
                hint: "Por favor, cierra sesión y vuelve a entrar."
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        console.log("Requester identified:", requester.email);

        // 2. Check if requester is an admin in profiles table
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", requester.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile:", profileError.message);
            return new Response(JSON.stringify({ error: "Error al verificar perfil de administrador" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            });
        }

        if (profile?.role !== "admin") {
            console.warn("Unauthorized access attempt by:", requester.email, "Role:", profile?.role);
            return new Response(JSON.stringify({ error: "Acceso denegado: Solo administradores pueden realizar esta acción" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }

        // 3. Process request
        const { action, userData, userId } = await req.json();

        if (action === "create") {
            const { email, password, full_name, role, client_name } = userData;
            console.log("Creating user:", email);

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

            if (createError) {
                console.error("Error creating user in Auth:", createError.message);
                return new Response(JSON.stringify({ error: "Error al crear usuario en Auth", details: createError.message }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }

            return new Response(JSON.stringify({ user: newUser }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 201,
            });
        }

        if (action === "delete") {
            console.log("Deleting user:", userId);
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteError) {
                console.error("Error deleting user:", deleteError.message);
                return new Response(JSON.stringify({ error: "Error al eliminar usuario", details: deleteError.message }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        throw new Error("Acción inválida");
    } catch (error) {
        console.error("Global error catch:", error.message);
        return new Response(JSON.stringify({ error: "Error interno del servidor", details: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
