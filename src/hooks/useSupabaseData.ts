import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type User = Database['public']['Tables']['users']['Row'];
type Client = Database['public']['Tables']['clients']['Row'] & {
  services?: Service[];
};
type Service = Database['public']['Tables']['services']['Row'] & {
  sub_services?: SubService[];
};
type SubService = Database['public']['Tables']['sub_services']['Row'];

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
          password_hash: userData.password, // In production, hash this properly
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

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          services (
            *,
            sub_services (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: { name: string; logo?: string; domain: string; services: string[] }) => {
    try {
      // First create the client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name,
          logo: clientData.logo || '/placeholder.svg',
          domain: clientData.domain
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      // Then create the services
      if (clientData.services.length > 0) {
        const servicesToInsert = clientData.services.map(serviceName => ({
          client_id: client.id,
          name: serviceName
        }));

        const { error: servicesError } = await supabase
          .from('services')
          .insert(servicesToInsert);

        if (servicesError) throw servicesError;
      }

      await fetchClients(); // Refresh the list
      toast({
        title: "Cliente agregado",
        description: "El cliente se ha creado correctamente",
      });
      return client;
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateClient = async (clientId: number, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchClients(); // Refresh to get updated services
      toast({
        title: "Cliente actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      return data;
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteClient = async (clientId: number) => {
    try {
      // Delete sub-services first
      const { error: subServicesError } = await supabase
        .from('sub_services')
        .delete()
        .in('service_id', 
          await supabase
            .from('services')
            .select('id')
            .eq('client_id', clientId)
            .then(({ data }) => data?.map(s => s.id) || [])
        );

      // Delete services
      const { error: servicesError } = await supabase
        .from('services')
        .delete()
        .eq('client_id', clientId);

      // Delete client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (subServicesError || servicesError || clientError) {
        throw subServicesError || servicesError || clientError;
      }
      
      setClients(prev => prev.filter(client => client.id !== clientId));
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive"
      });
      throw error;
    }
  };

  const addService = async (clientId: number, serviceName: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          client_id: clientId,
          name: serviceName
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchClients();
      return data;
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  };

  const updateService = async (serviceId: number, updates: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchClients();
      return data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  };

  const deleteService = async (serviceId: number) => {
    try {
      // Delete sub-services first
      const { error: subServicesError } = await supabase
        .from('sub_services')
        .delete()
        .eq('service_id', serviceId);

      const { error: serviceError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (subServicesError || serviceError) {
        throw subServicesError || serviceError;
      }
      
      await fetchClients();
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  };

  const addSubService = async (serviceId: number, subServiceData: { name: string; url: string }) => {
    try {
      const { data, error } = await supabase
        .from('sub_services')
        .insert([{
          service_id: serviceId,
          name: subServiceData.name,
          url: subServiceData.url
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchClients();
      return data;
    } catch (error) {
      console.error('Error adding sub-service:', error);
      throw error;
    }
  };

  const updateSubService = async (subServiceId: number, updates: Partial<SubService>) => {
    try {
      const { data, error } = await supabase
        .from('sub_services')
        .update(updates)
        .eq('id', subServiceId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchClients();
      return data;
    } catch (error) {
      console.error('Error updating sub-service:', error);
      throw error;
    }
  };

  const deleteSubService = async (subServiceId: number) => {
    try {
      const { error } = await supabase
        .from('sub_services')
        .delete()
        .eq('id', subServiceId);

      if (error) throw error;
      
      await fetchClients();
    } catch (error) {
      console.error('Error deleting sub-service:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    addService,
    updateService,
    deleteService,
    addSubService,
    updateSubService,
    deleteSubService,
    refetch: fetchClients
  };
}