import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClients } from '@/hooks/useSupabaseData';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'] & {
  services?: Array<Database['public']['Tables']['services']['Row'] & {
    sub_services?: Database['public']['Tables']['sub_services']['Row'][];
  }>;
};
type Service = Database['public']['Tables']['services']['Row'] & {
  sub_services?: Database['public']['Tables']['sub_services']['Row'][];
};
type SubService = Database['public']['Tables']['sub_services']['Row'];

interface ClientEditModalProps {
  client: Client;
  availableServiceNames: string[];
  onSave: (client: Client) => Promise<void>;
  onClose: () => void;
}

export function ClientEditModal({ client, availableServiceNames, onSave, onClose }: ClientEditModalProps) {
  const [editedClient, setEditedClient] = useState<Client>(client);
  const { addService, updateService, deleteService, addSubService, updateSubService, deleteSubService } = useClients();

  useEffect(() => {
    setEditedClient(client);
  }, [client]);

  const handleAddService = async (serviceName: string) => {
    try {
      await addService(client.id, serviceName);
      // The client data will be refreshed by the parent component
      onClose(); // Close modal to refresh data
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleRemoveService = async (serviceId: number) => {
    try {
      await deleteService(serviceId);
      // The client data will be refreshed by the parent component
      onClose(); // Close modal to refresh data
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };

  const handleAddSubService = async (serviceId: number) => {
    try {
      await addSubService(serviceId, { name: 'Nuevo Subservicio', url: 'https://' });
      // The client data will be refreshed by the parent component
      onClose(); // Close modal to refresh data
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
      // The client data will be refreshed by the parent component
      onClose(); // Close modal to refresh data
    } catch (error) {
      console.error('Error removing sub-service:', error);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a temporary URL for preview
      const imageUrl = URL.createObjectURL(file);
      
      // Create FormData to simulate file upload (in a real app, you'd upload to server)
      const formData = new FormData();
      formData.append('logo', file);
      
      // For now, we'll use the object URL for preview
      // In a production app, you'd upload to your server/storage and get back a URL
      setEditedClient(prev => ({
        ...prev,
        logo: imageUrl
      }));
      
      // Clean up the object URL when component unmounts
      // You might want to store this in a ref to clean up properly
    }
  };

  const handleSave = async () => {
    await onSave(editedClient);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-mcs-blue/30 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-background/30 border-mcs-blue/20">
            <CardHeader>
              <CardTitle className="text-mcs-blue">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Nombre del Cliente</Label>
                  <Input
                    id="clientName"
                    value={editedClient.name}
                    onChange={(e) => setEditedClient(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="clientDomain">Dominio</Label>
                  <Input
                    id="clientDomain"
                    value={editedClient.domain}
                    onChange={(e) => setEditedClient(prev => ({ ...prev, domain: e.target.value }))}
                    className="bg-background/50"
                    placeholder="empresa.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="logoUpload">Logo del Cliente</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <img 
                    src={editedClient.logo || '/placeholder.svg'} 
                    alt={`${editedClient.name} logo`}
                    className="w-16 h-16 object-contain border border-mcs-blue/30 rounded-lg p-2"
                  />
                  <label htmlFor="logoUpload" className="cursor-pointer">
                    <Button type="button" variant="outline" className="border-mcs-blue/30">
                      <Upload className="w-4 h-4 mr-2" />
                      Cambiar Logo
                    </Button>
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Services Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Servicios Configurados</h4>
            </div>
            
            {editedClient.services?.map((service) => (
              <Card key={service.id} className="bg-background/30 border-mcs-blue/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-mcs-blue">{service.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddSubService(service.id)}
                        className="border-mcs-blue/30"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Subservicio
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveService(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.sub_services?.map((subService) => (
                    <div key={subService.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-card/50 rounded border border-mcs-blue/10">
                      <div>
                        <Label className="text-xs text-muted-foreground">Nombre del Subservicio</Label>
                        <Input
                          value={subService.name}
                          onChange={(e) => handleUpdateSubService(subService.id, 'name', e.target.value)}
                          placeholder="Nombre del subservicio"
                          className="bg-background/50 text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">URL del Subservicio</Label>
                          <Input
                            value={subService.url}
                            onChange={(e) => handleUpdateSubService(subService.id, 'url', e.target.value)}
                            placeholder="https://..."
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveSubService(subService.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) || []}
                  {(!service.sub_services || service.sub_services.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay subservicios configurados. Haz clic en "Subservicio" para agregar uno.
                    </p>
                  )}
                </CardContent>
              </Card>
            )) || <p className="text-muted-foreground">No hay servicios configurados</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t border-mcs-blue/20">
            <Button 
              onClick={handleSave}
              className="bg-gradient-secondary hover:bg-gradient-primary"
            >
              Guardar Cambios
            </Button>
            <Button 
              onClick={onClose}
              variant="outline" 
              className="border-mcs-blue/30"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}