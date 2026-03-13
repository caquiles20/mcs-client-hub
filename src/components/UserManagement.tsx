import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Edit, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserEditModal } from './UserEditModal';
import { useUsers, UserProfile, ProfileRole } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type User = UserProfile;

export function UserManagement() {
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', role: 'visualizador' as ProfileRole, clientName: '', area: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { users, loading, addUser: addUserDB, updateUser: updateUserDB, deleteUser: deleteUserDB } = useUsers();
  const { toast } = useToast();
  const isFormValid = newUser.email.trim() !== '' && newUser.fullName.trim() !== '';

  const handleAddUser = async () => {
    if (!isFormValid) return;

    try {
      await addUserDB({
        email: newUser.email,
        password: newUser.password || undefined,
        full_name: newUser.fullName,
        role: newUser.role,
        client_name: newUser.clientName || null,
        area: newUser.area || null
      });
      setNewUser({ email: '', password: '', fullName: '', role: 'visualizador', clientName: '', area: '' });
    } catch (error) {
      // Error handled in hook
    }
  };


  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateUserDB(user.id, {
        is_active: !user.is_active
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserDB(userId);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await updateUserDB(updatedUser.id, updatedUser);
      setEditingUser(null);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Add User Form */}
      <Card className="bg-card/80 backdrop-blur-sm border-mcs-blue/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-mcs-blue">
            <Plus className="w-5 h-5" />
            <span>Crear Nuevo Colaborador / Cliente</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="Ej. Juan Pérez"
                className="bg-background/50 h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="userEmail">Correo Electrónico</Label>
              <Input
                id="userEmail"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="usuario@mcs.com.mx"
                className="bg-background/50 h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="userRole">Rol en el Ecosistema</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: ProfileRole) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger className="bg-background/50 h-9">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="responsable">Responsable</SelectItem>
                  <SelectItem value="visualizador">Visualizador (Default)</SelectItem>
                  <SelectItem value="implementador">Implementador</SelectItem>
                  <SelectItem value="Ing. Especialista">Ing. Especialista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientName">Empresa / Cliente</Label>
              <Input
                id="clientName"
                value={newUser.clientName}
                onChange={(e) => setNewUser({ ...newUser, clientName: e.target.value })}
                placeholder="Ej. MCS Networks"
                className="bg-background/50 h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="userArea">Área / Departamento</Label>
              <Input
                id="userArea"
                value={newUser.area}
                onChange={(e) => setNewUser({ ...newUser, area: e.target.value })}
                placeholder="Ej. Sistemas, Contabilidad"
                className="bg-background/50 h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tempPassword">Contraseña Temporal (Opcional)</Label>
              <Input
                id="tempPassword"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Dejar vacío para auto-generar"
                className="bg-background/50 h-9"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddUser}
                disabled={loading || !isFormValid}
                className="w-full bg-gradient-secondary hover:bg-gradient-primary h-9"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Crear Usuario
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic pt-2">
            * Al crear el usuario, se le asignará el acceso a las aplicaciones correspondientes según su dominio y rol.
          </p>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-card/80 backdrop-blur-sm border-mcs-blue/30">
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner text="Cargando usuarios..." />
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-mcs-blue/20">
                  <div>
                    <p className="font-medium text-foreground">{user.full_name || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="flex flex-col space-y-1 mt-1">
                      <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold text-mcs-blue border-mcs-blue/30">
                        {user.role}
                      </Badge>
                      {user.area && (
                        <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold text-mcs-teal border-mcs-teal/30">
                          Área: {user.area}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={`${user.is_active
                        ? 'bg-mcs-teal/20 text-mcs-teal'
                        : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleUserStatus(user)}
                      className="border-mcs-blue/30"
                    >
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(user)}
                      className="border-mcs-blue/30"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <UserEditModal
          user={editingUser}
          onSave={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}