import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload } from 'lucide-react';

interface SubService {
  id: number;
  name: string;
  url: string;
}

interface Service {
  id: number;
  name: string;
  subServices: SubService[];
}

interface Client {
  id: number;
  name: string;
  logo: string;
  services: Service[];
}

interface ClientEditModalProps {
  client: Client;
  availableServiceNames: string[];
  onSave: (client: Client) => void;
  onClose: () => void;
}

export function ClientEditModal({ client, availableServiceNames, onSave, onClose }: ClientEditModalProps) {
  const [editedClient, setEditedClient] = useState<Client>(JSON.parse(JSON.stringify(client)));

  const handleSave = () => {
    onSave(editedClient);
  };

  const addService = (serviceName: string) => {
    const newService: Service = {
      id: Date.now(),
      name: serviceName,
      subServices: []
    };
    setEditedClient({
      ...editedClient,
      services: [...editedClient.services, newService]
    });
  };

  const removeService = (serviceId: number) => {
    setEditedClient({
      ...editedClient,
      services: editedClient.services.filter(s => s.id !== serviceId)
    });
  };

  const addSubService = (serviceId: number) => {
    const newSubService: SubService = {
      id: Date.now(),
      name: '',
      url: ''
    };
    setEditedClient({
      ...editedClient,
      services: editedClient.services.map(service =>
        service.id === serviceId
          ? { ...service, subServices: [...service.subServices, newSubService] }
          : service
      )
    });
  };

  const updateSubService = (serviceId: number, subServiceId: number, field: 'name' | 'url', value: string) => {
    setEditedClient({
      ...editedClient,
      services: editedClient.services.map(service =>
        service.id === serviceId
          ? {
              ...service,
              subServices: service.subServices.map(sub =>
                sub.id === subServiceId ? { ...sub, [field]: value } : sub
              )
            }
          : service
      )
    });
  };

  const removeSubService = (serviceId: number, subServiceId: number) => {
    setEditedClient({
      ...editedClient,
      services: editedClient.services.map(service =>
        service.id === serviceId
          ? {
              ...service,
              subServices: service.subServices.filter(sub => sub.id !== subServiceId)
            }
          : service
      )
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditedClient({ ...editedClient, logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const availableServicesToAdd = availableServiceNames.filter(
    serviceName => !editedClient.services.some(s => s.name === serviceName)
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-mcs-blue/30 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editClientName">Nombre del Cliente</Label>
              <Input
                id="editClientName"
                value={editedClient.name}
                onChange={(e) => setEditedClient({...editedClient, name: e.target.value})}
                className="bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="logoUpload">Logo del Cliente</Label>
              <div className="flex items-center space-x-2">
                <img 
                  src={editedClient.logo} 
                  alt="Client logo"
                  className="w-10 h-10 object-contain border rounded"
                />
                <label htmlFor="logoUpload" className="cursor-pointer">
                  <Button type="button" size="sm" variant="outline" className="border-mcs-blue/30">
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
          </div>

          {/* Add Service */}
          {availableServicesToAdd.length > 0 && (
            <Card className="bg-background/30 border-mcs-blue/20">
              <CardHeader>
                <CardTitle className="text-sm">Agregar Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableServicesToAdd.map((serviceName) => (
                    <Button
                      key={serviceName}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addService(serviceName)}
                      className="justify-start text-left border-mcs-blue/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {serviceName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Servicios Configurados</h3>
            {editedClient.services.map((service) => (
              <Card key={service.id} className="bg-background/30 border-mcs-blue/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeService(service.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.subServices.map((subService) => (
                    <div key={subService.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Nombre del Subservicio</Label>
                        <Input
                          value={subService.name}
                          onChange={(e) => updateSubService(service.id, subService.id, 'name', e.target.value)}
                          placeholder="Nombre del subservicio"
                          className="bg-background/50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">URL del Servicio</Label>
                        <Input
                          value={subService.url}
                          onChange={(e) => updateSubService(service.id, subService.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="bg-background/50"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeSubService(service.id, subService.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addSubService(service.id)}
                    className="border-mcs-blue/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Subservicio
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex space-x-2 pt-4">
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