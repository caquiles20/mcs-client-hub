import LoginForm from '@/components/LoginForm';
import AdminPanel from '@/components/AdminPanel';
import ClientPortal from '@/components/ClientPortal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { currentUser, showChangePassword, setShowChangePassword, handleLogin, handleLogout } = useAuth();

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (currentUser.type === 'admin' || currentUser.type === 'client') {
    return (
      <>
        <ClientPortal
          clientName={currentUser.clientName!}
          clientLogo={currentUser.clientLogo}
          clientEmail={currentUser.email}
          availableServices={currentUser.availableServices!}
          onLogout={handleLogout}
          onChangePassword={() => setShowChangePassword(true)}
          isAdmin={currentUser.type === 'admin'}
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
