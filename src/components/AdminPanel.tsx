import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, Shield, LogOut } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { ClientManagement } from './ClientManagement';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {

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
            <UserManagement />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <ClientManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}