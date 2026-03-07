import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Client = Database['public']['Tables']['clients']['Row'] & {
    services?: Service[];
};
type Service = Database['public']['Tables']['services']['Row'] & {
    sub_services?: SubService[];
};
type SubService = Database['public']['Tables']['sub_services']['Row'];

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

            await fetchClients();
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

            await fetchClients();
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
            // Fetch service IDs first to cascade-delete sub_services
            const { data: serviceRows, error: fetchError } = await supabase
                .from('services')
                .select('id')
                .eq('client_id', clientId);

            if (fetchError) throw fetchError;

            const serviceIds = serviceRows?.map(s => s.id) || [];

            if (serviceIds.length > 0) {
                const { error: subServicesError } = await supabase
                    .from('sub_services')
                    .delete()
                    .in('service_id', serviceIds);

                if (subServicesError) throw subServicesError;

                const { error: servicesError } = await supabase
                    .from('services')
                    .delete()
                    .eq('client_id', clientId);

                if (servicesError) throw servicesError;
            }

            const { error: clientError } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientId);

            if (clientError) throw clientError;

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
                .insert([{ client_id: clientId, name: serviceName }])
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
            const { error: subServicesError } = await supabase
                .from('sub_services')
                .delete()
                .eq('service_id', serviceId);

            if (subServicesError) throw subServicesError;

            const { error: serviceError } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);

            if (serviceError) throw serviceError;

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

            // Update local state directly to avoid a full refetch
            setClients(prev => prev.map(client => ({
                ...client,
                services: client.services?.map(service => ({
                    ...service,
                    sub_services: service.sub_services?.map(sub =>
                        sub.id === subServiceId ? { ...sub, ...updates } : sub
                    )
                }))
            })));
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
