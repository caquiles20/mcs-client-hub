import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: number;
  email: string;
  client: string;
  status: 'active' | 'inactive';
}

interface UserEditModalProps {
  user: User;
  onSave: (user: User) => void;
  onClose: () => void;
}

export function UserEditModal({ user, onSave, onClose }: UserEditModalProps) {
  const [editedUser, setEditedUser] = useState(user);
  const [newPassword, setNewPassword] = useState('');

  const handleSave = () => {
    onSave(editedUser);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-mcs-blue/30">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editEmail">Correo Electrónico</Label>
            <Input
              id="editEmail"
              type="email"
              value={editedUser.email}
              onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="editPassword">Nueva Contraseña (opcional)</Label>
            <Input
              id="editPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="editClient">Cliente</Label>
            <Input
              id="editClient"
              value={editedUser.client}
              onChange={(e) => setEditedUser({...editedUser, client: e.target.value})}
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="editStatus">Estado</Label>
            <Select
              value={editedUser.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setEditedUser({...editedUser, status: value})
              }
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
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