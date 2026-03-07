import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserType = 'guest' | 'admin' | 'client';

interface ServiceWithSubServices {
    name: string;
    sub_services?: { name: string; url: string }[];
}

interface AuthUser {
    email: string;
    type: UserType;
    clientName?: string;
    clientLogo?: string;
    availableServices?: ServiceWithSubServices[];
}

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const { toast } = useToast();

    const handleLogin = async (email: string, password: string) => {
        try {
            // Admin bypass (still using env vars for now as fallback)
            const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@mcs.com.mx';
            const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'MCSadmin2025$';

            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                // We still sign in to Supabase if possible to get a valid session for SSO
                const { error: adminAuthError } = await supabase.auth.signInWithPassword({ email, password });
                if (adminAuthError) console.warn("Admin login to Supabase Auth failed, proceeding with local admin state:", adminAuthError.message);

                setCurrentUser({ email, type: 'admin' });
                toast({ title: "Acceso autorizado", description: "Bienvenido al panel de administración" });
                return;
            }

            // Real Supabase Auth for clients
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                toast({
                    title: "Error de acceso",
                    description: authError.message || "Credenciales incorrectas",
                    variant: "destructive"
                });
                return;
            }

            // Fetch profile data from public.users
            const { data: user, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (profileError || !user) {
                console.error("Profile not found in public.users:", profileError);
                // If auth succeeded but profile missing, we handle gracefully
                toast({
                    title: "Acceso limitado",
                    description: "Usuario autenticado pero sin perfil asignado",
                    variant: "destructive"
                });
                return;
            }

            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select(`
          name,
          domain,
          logo,
          services(
            name,
            sub_services(name, url)
          )
        `)
                .eq('name', user.client)
                .single();

            if (clientError || !clientData) {
                toast({
                    title: "Error de acceso",
                    description: "No se encontró información del cliente",
                    variant: "destructive"
                });
                return;
            }

            setCurrentUser({
                email,
                type: 'client',
                clientName: clientData.name,
                clientLogo: clientData.logo,
                availableServices: clientData.services || []
            });

            toast({ title: "Acceso autorizado", description: `Bienvenido ${clientData.name}` });
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor",
                variant: "destructive"
            });
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setShowChangePassword(false);
        toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente" });
    };

    return {
        currentUser,
        showChangePassword,
        setShowChangePassword,
        handleLogin,
        handleLogout,
    };
}
