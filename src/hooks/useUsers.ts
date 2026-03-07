import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ProfileRole = 'admin' | 'responsable' | 'visualizador' | 'gerente' | 'Ing. Especialista' | 'Ing. Campo' | 'implementador';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: ProfileRole;
    client_name: string | null;
    is_active: boolean;
    created_at: string;
}

export function useUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data as UserProfile[] || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los perfiles de usuario",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const addUser = async (userData: {
        email: string;
        password?: string;
        full_name: string;
        role: ProfileRole;
        client_name: string | null
    }) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('manage-users', {
                body: {
                    action: 'create',
                    userData: {
                        ...userData,
                        password: userData.password || 'MCS' + Math.random().toString(36).slice(-8)
                    }
                }
            });

            if (error) throw error;

            toast({
                title: "Usuario creado",
                description: `Se ha creado el perfil para ${userData.email} correctamente`,
            });

            await fetchUsers();
            return data;
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast({
                title: "Error al crear usuario",
                description: error.message || "No se pudo crear el usuario en el sistema",
                variant: "destructive"
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            setUsers(prev => prev.map(user => user.id === userId ? (data as UserProfile) : user));
            toast({
                title: "Perfil actualizado",
                description: "Los cambios se han guardado correctamente",
            });
            return data as UserProfile;
        } catch (error) {
            console.error('Error updating user:', error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el perfil",
                variant: "destructive"
            });
            throw error;
        }
    };

    const deleteUser = async (userId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('manage-users', {
                body: {
                    action: 'delete',
                    userId
                }
            });

            if (error) throw error;

            setUsers(prev => prev.filter(user => user.id !== userId));
            toast({
                title: "Usuario eliminado",
                description: "El usuario ha sido borrado permanentemente de todo el sistema",
            });
            return data;
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast({
                title: "Error al eliminar usuario",
                description: error.message || "No se pudo eliminar el usuario",
                variant: "destructive"
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        loading,
        addUser,
        updateUser,
        deleteUser,
        refetch: fetchUsers
    };
}
