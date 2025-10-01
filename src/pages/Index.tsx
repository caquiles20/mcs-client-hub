import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import AdminPanel from '@/components/AdminPanel';
import ClientPortal from '@/components/ClientPortal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'guest' | 'admin' | 'client';

interface ServiceWithSubServices {
  name: string;
  sub_services?: { name: string; url: string }[];
}

interface User {
  email: string;
  type: UserType;
  clientName?: string;
  clientLogo?: string;
  availableServices?: ServiceWithSubServices[];
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { toast } = useToast();

  // Mock client data - this would come from the database
  const mockClientData: { [key: string]: { name: string; services: string[] } } = {
    'empresa1.com': {
      name: 'Empresa 1',
      services: ['Mesa de Servicios ITSM', 'Monitoreo', 'Reportes de Servicio']
    },
    'empresa2.com': {
      name: 'Empresa 2', 
      services: ['Reportes QBR', 'Alcances del Servicio (SLA)', 'Matriz de Escalación']
    },
    'empresa3.com': {
      name: 'Empresa 3',
      services: ['Estatus de Implementaciones', 'Gestión de Recursos', 'Estatus de Polizas de Servicio']
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      // Admin login
      if (email === 'admin@mcs.com.mx' && password === 'MCSadmin2025$') {
        setCurrentUser({
          email,
          type: 'admin'
        });
        toast({
          title: "Acceso autorizado",
          description: "Bienvenido al panel de administración",
        });
        return;
      }

      // Client login - check database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password) // In production, use proper password hashing
        .eq('status', 'active')
        .single();

      if (error || !user) {
        toast({
          title: "Error de acceso",
          description: "Credenciales incorrectas o usuario inactivo",
          variant: "destructive"
        });
        return;
      }

      // Get client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          name,
          domain,
          logo,
          services(
            name,
            sub_services(name, url)
          )
        `)
        .eq('name', user.client)
        .single();

      if (clientError || !clientData) {
        toast({
          title: "Error de acceso",
          description: "No se encontró información del cliente",
          variant: "destructive"
        });
        return;
      }

      const availableServices = clientData.services || [];

      setCurrentUser({
        email,
        type: 'client',
        clientName: clientData.name,
        clientLogo: clientData.logo,
        availableServices
      });

      toast({
        title: "Acceso autorizado",
        description: `Bienvenido ${clientData.name}`,
      });

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowChangePassword(false);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
  };

  // Render based on user state
  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (currentUser.type === 'admin') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  if (currentUser.type === 'client') {
    return (
      <>
        <ClientPortal
          clientName={currentUser.clientName!}
          clientLogo={currentUser.clientLogo}
          clientEmail={currentUser.email}
          availableServices={currentUser.availableServices!}
          onLogout={handleLogout}
          onChangePassword={handleChangePassword}
        />
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          userEmail={currentUser.email}
        />
      </>
    );
  }

  return null;
};

export default Index;
