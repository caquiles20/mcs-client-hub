import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ClientEditModal } from './ClientEditModal';

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

const availableServiceNames = [
  'Mesa de Servicios ITSM',
  'Reportes de Servicio',
  'Monitoreo',
  'Reportes QBR',
  'Alcances del Servicio (SLA)',
  'Matriz de Escalación',
  'Estatus de Implementaciones',
  'Gestión de Recursos',
  'Estatus de Polizas de Servicio'
];

interface ClientManagementProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
}

export function ClientManagement({ clients, setClients }: ClientManagementProps) {
  const [newClient, setNewClient] = useState({ name: '', services: [] as string[] });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const addClient = () => {
    if (newClient.name) {
      const clientServices = newClient.services.map((serviceName, index) => ({
        id: Date.now() + index,
        name: serviceName,
        subServices: []
      }));

      setClients([...clients, { 
        id: Date.now(), 
        name: newClient.name, 
        logo: '/placeholder.svg',
        services: clientServices
      }]);
      setNewClient({ name: '', services: [] });
    }
  };

  const toggleService = (service: string) => {
    setNewClient(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const deleteClient = (clientId: number) => {
    setClients(clients.filter(client => client.id !== clientId));
  };

  const updateClient = (updatedClient: Client) => {
    setClients(clients.map(client => client.id === updatedClient.id ? updatedClient : client));
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Client Form */}
      <Card className="bg-card/80 backdrop-blur-sm border-mcs-blue/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-mcs-blue" />
            <span>Agregar Nuevo Cliente</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientName">Nombre del Cliente</Label>
            <Input
              id="clientName"
              value={newClient.name}
              onChange={(e) => setNewClient({...newClient, name: e.target.value})}
              placeholder="Nombre de la empresa"
              className="bg-background/50"
            />
          </div>
          
          <div>
            <Label>Servicios Disponibles</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {availableServiceNames.map((service) => (
                <Button
                  key={service}
                  type="button"
                  variant={newClient.services.includes(service) ? "secondary" : "outline"}
                  className={`justify-start text-left h-auto p-3 ${
                    newClient.services.includes(service) 
                      ? 'bg-mcs-teal/20 border-mcs-teal text-mcs-teal' 
                      : 'border-mcs-blue/30'
                  }`}
                  onClick={() => toggleService(service)}
                >
                  {service}
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={addClient}
            className="bg-gradient-secondary hover:bg-gradient-primary"
          >
            Agregar Cliente
          </Button>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card className="bg-card/80 backdrop-blur-sm border-mcs-blue/30">
        <CardHeader>
          <CardTitle>Clientes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="p-4 bg-background/30 rounded-lg border border-mcs-blue/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={client.logo} 
                      alt={`${client.name} logo`}
                      className="w-8 h-8 object-contain"
                    />
                    <h4 className="font-semibold text-foreground">{client.name}</h4>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingClient(client)}
                      className="border-mcs-blue/30"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteClient(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.services.map((service) => (
                    <Badge key={service.id} variant="secondary" className="bg-mcs-blue/20 text-mcs-blue">
                      {service.name} ({service.subServices.length} subservicios)
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {editingClient && (
        <ClientEditModal
          client={editingClient}
          availableServiceNames={availableServiceNames}
          onSave={updateClient}
          onClose={() => setEditingClient(null)}
        />
      )}
    </div>
  );
}