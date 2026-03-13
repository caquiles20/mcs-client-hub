import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile, ProfileRole } from '@/hooks/useUsers';

interface UserEditModalProps {
  user: UserProfile;
  onSave: (user: UserProfile) => Promise<void>;
  onClose: () => void;
}

const ROLES: ProfileRole[] = [
  'admin',
  'responsable',
  'visualizador',
  'gerente',
  'Ing. Especialista',
  'Ing. Campo',
  'implementador'
];

export function UserEditModal({ user, onSave, onClose }: UserEditModalProps) {
  const [editedUser, setEditedUser] = useState<UserProfile>(user);

  const handleSave = async () => {
    await onSave(editedUser);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-mcs-blue/30 max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Editar Perfil de Usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editEmail">Correo Electrónico</Label>
            <Input
              id="editEmail"
              type="email"
              value={editedUser.email}
              disabled
              className="bg-background/30 opacity-70"
            />
            <p className="text-[10px] text-muted-foreground mt-1 italic">El correo no puede ser modificado aquí.</p>
          </div>
          <div>
            <Label htmlFor="editFullName">Nombre Completo</Label>
            <Input
              id="editFullName"
              value={editedUser.full_name || ''}
              onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
              className="bg-background/50"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <Label htmlFor="editRole">Rol en el Ecosistema</Label>
            <Select
              value={editedUser.role}
              onValueChange={(value: ProfileRole) =>
                setEditedUser({ ...editedUser, role: value })
              }
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="editClientName">Nombre de Cliente / Empresa</Label>
            <Input
              id="editClientName"
              value={editedUser.client_name || ''}
              onChange={(e) => setEditedUser({ ...editedUser, client_name: e.target.value })}
              className="bg-background/50"
              placeholder="Ej. MCS Networks"
            />
          </div>
          <div>
            <Label htmlFor="editArea">Área / Departamento</Label>
            <Input
              id="editArea"
              value={editedUser.area || ''}
              onChange={(e) => setEditedUser({ ...editedUser, area: e.target.value })}
              className="bg-background/50"
              placeholder="Ej. Sistemas, Contabilidad"
            />
          </div>
          <div>
            <Label htmlFor="editStatus">Estado de Acceso</Label>
            <Select
              value={editedUser.is_active ? 'active' : 'inactive'}
              onValueChange={(value: string) =>
                setEditedUser({ ...editedUser, is_active: value === 'active' })
              }
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Permitido</SelectItem>
                <SelectItem value="inactive">Revocado</SelectItem>
              </SelectContent>
            </Select>
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