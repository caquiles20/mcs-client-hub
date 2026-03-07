import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PasswordInput } from '@/components/shared/PasswordInput';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password matches the stored hash
      // ⚠️ SECURITY TODO: This compares plain-text passwords. Migrate to
      // bcrypt/Argon2 hashing via a Supabase Edge Function for production use.
      const { data: userRow, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .eq('password_hash', currentPassword)
        .single();

      if (fetchError || !userRow) {
        toast({
          title: "Contraseña incorrecta",
          description: "La contraseña actual no es correcta",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPassword })
        .eq('id', userRow.id);

      if (updateError) throw updateError;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-mcs-blue/30">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Lock className="w-5 h-5 text-mcs-blue" />
            <span>Cambiar Contraseña</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Usuario: <span className="text-mcs-cyan font-medium">{userEmail}</span>
          </div>

          <PasswordInput
            id="currentPassword"
            label="Contraseña Actual"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
          />

          <PasswordInput
            id="newPassword"
            label="Nueva Contraseña"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={8}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirmar Nueva Contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            minLength={8}
          />

          <div className="bg-mcs-blue/10 p-3 rounded-lg border border-mcs-blue/30">
            <h4 className="text-sm font-medium text-foreground mb-1">Requisitos de contraseña:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Mínimo 8 caracteres</li>
              <li>• Se recomienda incluir mayúsculas, minúsculas y números</li>
              <li>• Evita usar información personal</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-mcs-blue/30" disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-secondary hover:bg-gradient-primary" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}