import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, Settings, Plus, Shield, LogOut } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const mockUsers = [
  { id: 1, email: 'juan@empresa1.com', client: 'Empresa 1', status: 'active' },
  { id: 2, email: 'maria@empresa2.com', client: 'Empresa 2', status: 'active' },
];

const mockClients = [
  { id: 1, name: 'Empresa 1', logo: '/placeholder.svg', services: ['Mesa de Servicios ITSM', 'Monitoreo'] },
  { id: 2, name: 'Empresa 2', logo: '/placeholder.svg', services: ['Reportes de Servicio', 'Reportes QBR'] },
];

const availableServices = [
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

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [users, setUsers] = useState(mockUsers);
  const [clients, setClients] = useState(mockClients);
  const [newUser, setNewUser] = useState({ email: '', password: '', client: '' });
  const [newClient, setNewClient] = useState({ name: '', services: [] as string[] });

  const addUser = () => {
    if (newUser.email && newUser.password && newUser.client) {
      setUsers([...users, { 
        id: Date.now(), 
        email: newUser.email, 
        client: newUser.client, 
        status: 'active' 
      }]);
      setNewUser({ email: '', password: '', client: '' });
    }
  };

  const addClient = () => {
    if (newClient.name) {
      setClients([...clients, { 
        id: Date.now(), 
        name: newClient.name, 
        logo: '/placeholder.svg',
        services: newClient.services 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-mcs-navy via-background to-mcs-navy">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-mcs-blue/30 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-mcs-blue" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Panel de Administración MCS</h1>
              <p className="text-mcs-cyan text-sm">Gestión de Clientes y Usuarios</p>
            </div>
          </div>
          <Button 
            onClick={onLogout}
            variant="outline" 
            size="sm"
            className="border-mcs-blue/30 hover:bg-mcs-blue/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card/50">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Clientes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Add User Form */}
            <Card className="bg-card/80 backdrop-blur-sm border-mcs-blue/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-mcs-blue" />
                  <span>Agregar Nuevo Usuario</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="userEmail">Correo Electrónico</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="usuario@empresa.com"
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPassword">Contraseña</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="••••••••"
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userClient">Cliente</Label>
                    <Input
                      id="userClient"
                      value={newUser.client}
                      onChange={(e) => setNewUser({...newUser, client: e.target.value})}
                      placeholder="Nombre del cliente"
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <Button 
                  onClick={addUser}
                  className="bg-gradient-secondary hover:bg-gradient-primary"
                >
                  Agregar Usuario
                </Button>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card className="bg-card/80 backdrop-blur-sm border-mcs-blue/30">
              <CardHeader>
                <CardTitle>Usuarios Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-mcs-blue/20">
                      <div>
                        <p className="font-medium text-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.client}</p>
                      </div>
                      <Badge variant="secondary" className="bg-mcs-teal/20 text-mcs-teal">
                        {user.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
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
                    {availableServices.map((service) => (
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
                      <h4 className="font-semibold text-foreground mb-2">{client.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {client.services.map((service) => (
                          <Badge key={service} variant="secondary" className="bg-mcs-blue/20 text-mcs-blue">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}