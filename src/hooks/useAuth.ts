import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserType = 'guest' | 'admin' | 'client';

interface ServiceWithSubServices {
    name: string;
    sub_services?: { name: string; url: string }[];
}

interface AuthUser {
    id: string;
    email: string;
    type: UserType;
    full_name?: string | null;
    clientName?: string;
    clientLogo?: string;
    area?: string | null;
    availableServices?: ServiceWithSubServices[];
}

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !profile) {
                console.error("Profile not found in public.profiles:", error);
                return null;
            }

            // Determine target client name for service fetching
            // Admins fetch from 'MCS' company by default
            const targetClientName = (profile.role === 'admin') ? 'MCS' : (profile.client_name || '');

            const { data: clientData } = await supabase
                .from('clients')
                .select(`
                    name,
                    logo,
                    services(
                        name,
                        allowed_areas,
                        sub_services(name, url)
                    )
                `)
                .eq('name', targetClientName)
                .single();

            // Filter services based on area if user is not an admin
            const filteredServices = (clientData?.services || []).filter((service: any) => {
                if (profile.role === 'admin') return true;
                if (!service.allowed_areas || service.allowed_areas.length === 0) return true;
                if (!profile.area) return false;
                return service.allowed_areas.includes(profile.area);
            });

            return {
                id: userId,
                email,
                type: (profile.role === 'admin' ? 'admin' : 'client') as UserType,
                full_name: profile.full_name,
                clientName: clientData?.name || profile.client_name || (profile.role === 'admin' ? 'MCS' : 'MCS Client'),
                clientLogo: clientData?.logo,
                area: profile.area,
                availableServices: filteredServices
            };
        } catch (err) {
            console.error("Error fetching profile:", err);
            return null;
        }
    };

    const handleLogin = async (email: string, password: string) => {
        try {
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

            if (authData.user) {
                const profile = await fetchProfile(authData.user.id, authData.user.email!);
                if (profile) {
                    setCurrentUser(profile);
                    toast({ title: "Acceso autorizado", description: `Bienvenido ${profile.full_name || email}` });
                } else {
                    toast({
                        title: "Acceso limitado",
                        description: "Tu cuenta no tiene un perfil configurado en el sistema.",
                        variant: "destructive"
                    });
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor",
                variant: "destructive"
            });
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setShowChangePassword(false);
        toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente" });
    };

    // Auto-restore session on refresh
    useEffect(() => {
        const restoreSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await fetchProfile(session.user.id, session.user.email!);
                setCurrentUser(profile);
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

    return {
        currentUser,
        loading,
        showChangePassword,
        setShowChangePassword,
        handleLogin,
        handleLogout,
    };
}
