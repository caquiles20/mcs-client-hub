import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import AdminPanel from '@/components/AdminPanel';
import ClientPortal from '@/components/ClientPortal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { useToast } from '@/hooks/use-toast';

type UserType = 'guest' | 'admin' | 'client';

interface User {
  email: string;
  type: UserType;
  clientName?: string;
  availableServices?: string[];
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

  const handleLogin = (email: string, password: string) => {
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

    // Client login - extract domain from email
    const domain = email.split('@')[1];
    const clientData = mockClientData[domain];

    if (clientData) {
      // Simulate password validation - in real app this would be checked against database
      if (password.length >= 6) { // Simple validation for demo
        setCurrentUser({
          email,
          type: 'client',
          clientName: clientData.name,
          availableServices: clientData.services
        });
        toast({
          title: "Acceso autorizado",
          description: `Bienvenido ${clientData.name}`,
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Credenciales incorrectas",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error de acceso",
        description: "Dominio no registrado o credenciales incorrectas",
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
