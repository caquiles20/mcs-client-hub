import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
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
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-background/50 border-mcs-blue/30 focus:border-mcs-blue pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background/50 border-mcs-blue/30 focus:border-mcs-blue pr-10"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background/50 border-mcs-blue/30 focus:border-mcs-blue pr-10"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-mcs-blue/10 p-3 rounded-lg border border-mcs-blue/30">
            <h4 className="text-sm font-medium text-foreground mb-1">Requisitos de contraseña:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Mínimo 8 caracteres</li>
              <li>• Se recomienda incluir mayúsculas, minúsculas y números</li>
              <li>• Evita usar información personal</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-mcs-blue/30"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-secondary hover:bg-gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}