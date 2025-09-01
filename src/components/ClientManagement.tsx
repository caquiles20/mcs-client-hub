import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { ClientEditModal } from './ClientEditModal';
import { useClients } from '@/hooks/useSupabaseData';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'] & {
  services?: Array<Database['public']['Tables']['services']['Row'] & {
    sub_services?: Database['public']['Tables']['sub_services']['Row'][];
  }>;
};

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

export function ClientManagement() {
  const [newClient, setNewClient] = useState({ name: '', domain: '', services: [] as string[] });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { clients, loading, addClient: addClientDB, updateClient: updateClientDB, deleteClient: deleteClientDB } = useClients();

  const handleAddClient = async () => {
    if (newClient.name && newClient.domain) {
      try {
        await addClientDB({
          name: newClient.name,
          domain: newClient.domain,
          services: newClient.services
        });
        setNewClient({ name: '', domain: '', services: [] });
      } catch (error) {
        // Error is handled in the hook
      }
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

  const handleDeleteClient = async (clientId: number) => {
    try {
      await deleteClientDB(clientId);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      await updateClientDB(updatedClient.id, updatedClient);
      setEditingClient(null);
    } catch (error) {
      // Error is handled in the hook
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="clientDomain">Dominio</Label>
              <Input
                id="clientDomain"
                value={newClient.domain}
                onChange={(e) => setNewClient({...newClient, domain: e.target.value})}
                placeholder="empresa.com"
                className="bg-background/50"
              />
            </div>
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
            onClick={handleAddClient}
            className="bg-gradient-secondary hover:bg-gradient-primary"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-mcs-blue" />
              <span className="ml-2 text-muted-foreground">Cargando clientes...</span>
            </div>
          ) : (
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
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.services?.map((service) => (
                    <Badge key={service.id} variant="secondary" className="bg-mcs-blue/20 text-mcs-blue">
                      {service.name} ({service.sub_services?.length || 0} subservicios)
                    </Badge>
                  )) || <span className="text-muted-foreground text-sm">No hay servicios configurados</span>}
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingClient && (
        <ClientEditModal
          client={editingClient}
          availableServiceNames={availableServiceNames}
          onSave={handleUpdateClient}
          onClose={() => setEditingClient(null)}
        />
      )}
    </div>
  );
}