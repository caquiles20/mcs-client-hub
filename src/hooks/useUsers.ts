import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type User = Database['public']['Tables']['users']['Row'];

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los usuarios",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const addUser = async (userData: { email: string; password: string; client: string }) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    email: userData.email,
                    // ⚠️ SECURITY TODO: Hash the password server-side (bcrypt/Argon2) before storing.
                    password_hash: userData.password,
                    client: userData.client,
                    status: 'active'
                }])
                .select()
                .single();

            if (error) throw error;

            setUsers(prev => [data, ...prev]);
            toast({
                title: "Usuario agregado",
                description: "El usuario se ha creado correctamente",
            });
            return data;
        } catch (error) {
            console.error('Error adding user:', error);
            toast({
                title: "Error",
                description: "No se pudo agregar el usuario",
                variant: "destructive"
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userId: number, updates: Partial<User>) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            setUsers(prev => prev.map(user => user.id === userId ? data : user));
            toast({
                title: "Usuario actualizado",
                description: "Los cambios se han guardado correctamente",
            });
            return data;
        } catch (error) {
            console.error('Error updating user:', error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el usuario",
                variant: "destructive"
            });
            throw error;
        }
    };

    const deleteUser = async (userId: number) => {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev => prev.filter(user => user.id !== userId));
            toast({
                title: "Usuario eliminado",
                description: "El usuario se ha eliminado correctamente",
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({
                title: "Error",
                description: "No se pudo eliminar el usuario",
                variant: "destructive"
            });
            throw error;
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
