import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { ClientBasicInfo } from './client-edit/ClientBasicInfo';
import { ClientServicesConfig } from './client-edit/ClientServicesConfig';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'] & {
  services?: Array<Database['public']['Tables']['services']['Row'] & {
    sub_services?: Database['public']['Tables']['sub_services']['Row'][];
  }>;
};

interface ClientEditModalProps {
  client: Client;
  availableServiceNames: string[];
  onSave: (client: Client) => Promise<void>;
  onClose: () => void;
}

export function ClientEditModal({ client, availableServiceNames, onSave, onClose }: ClientEditModalProps) {
  const [editedClient, setEditedClient] = useState<Client>(client);
  const [localSubServiceValues, setLocalSubServiceValues] = useState<Record<number, { name: string; url: string }>>({});
  const { clients, addService, deleteService, addSubService, updateSubService, deleteSubService } = useClients();

  const initLocalSubServiceValues = useCallback((clientData: Client) => {
    const values: Record<number, { name: string; url: string }> = {};
    clientData.services?.forEach(service => {
      service.sub_services?.forEach(sub => {
        values[sub.id] = { name: sub.name, url: sub.url };
      });
    });
    setLocalSubServiceValues(values);
  }, []);

  useEffect(() => {
    setEditedClient(client);
    initLocalSubServiceValues(client);
  }, [client, initLocalSubServiceValues]);

  useEffect(() => {
    const updatedClient = clients.find(c => c.id === client.id);
    if (updatedClient) {
      setEditedClient(updatedClient);
      initLocalSubServiceValues(updatedClient);
    }
  }, [clients, client.id, initLocalSubServiceValues]);

  const handleAddService = async (serviceName: string) => {
    try {
      await addService(client.id, serviceName);
      onClose();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleRemoveService = async (serviceId: number) => {
    try {
      await deleteService(serviceId);
      onClose();
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };

  const handleAddSubService = async (serviceId: number) => {
    try {
      await addSubService(serviceId, { name: 'Nuevo Subservicio', url: 'https://' });
    } catch (error) {
      console.error('Error adding sub-service:', error);
    }
  };

  const handleUpdateSubService = async (subServiceId: number, field: 'name' | 'url', value: string) => {
    try {
      await updateSubService(subServiceId, { [field]: value });
    } catch (error) {
      console.error('Error updating sub-service:', error);
    }
  };

  const handleRemoveSubService = async (subServiceId: number) => {
    try {
      await deleteSubService(subServiceId);
    } catch (error) {
      console.error('Error removing sub-service:', error);
    }
  };

  const handleLocalSubServiceChange = useCallback((id: number, field: 'name' | 'url', value: string) => {
    setLocalSubServiceValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  }, []);

  const handleSave = async () => {
    const clientData = {
      id: editedClient.id,
      name: editedClient.name,
      domain: editedClient.domain,
      logo: editedClient.logo,
      created_at: editedClient.created_at,
      updated_at: editedClient.updated_at
    };
    await onSave(clientData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-mcs-blue/30 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <ClientBasicInfo
            name={editedClient.name}
            domain={editedClient.domain}
            logo={editedClient.logo}
            onNameChange={(value) => setEditedClient(prev => ({ ...prev, name: value }))}
            onDomainChange={(value) => setEditedClient(prev => ({ ...prev, domain: value }))}
            onLogoChange={(dataUrl) => setEditedClient(prev => ({ ...prev, logo: dataUrl }))}
          />

          {/* Available Services to Add */}
          <Card className="bg-background/30 border-mcs-blue/20">
            <CardHeader>
              <CardTitle className="text-mcs-blue">Servicios Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableServiceNames.map((serviceName) => {
                  const hasService = editedClient.services?.some(service => service.name === serviceName);
                  return (
                    <div key={serviceName} className="flex items-center justify-between p-2 border border-mcs-blue/20 rounded">
                      <span className="text-foreground">{serviceName}</span>
                      {hasService ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const service = editedClient.services?.find(s => s.name === serviceName);
                            if (service) handleRemoveService(service.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddService(serviceName)}
                          className="border-mcs-blue/30"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <ClientServicesConfig
            services={editedClient.services}
            localSubServiceValues={localSubServiceValues}
            onLocalSubServiceChange={handleLocalSubServiceChange}
            onAddSubService={handleAddSubService}
            onUpdateSubService={handleUpdateSubService}
            onRemoveSubService={handleRemoveSubService}
            onRemoveService={handleRemoveService}
          />

          <div className="flex space-x-2 pt-4 border-t border-mcs-blue/20">
            <Button onClick={handleSave} className="bg-gradient-secondary hover:bg-gradient-primary">
              Guardar Cambios
            </Button>
            <Button onClick={onClose} variant="outline" className="border-mcs-blue/30">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}