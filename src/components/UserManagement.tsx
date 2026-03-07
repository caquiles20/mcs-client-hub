import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { UserEditModal } from './UserEditModal';
import { useUsers } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

export function UserManagement() {
  const [newUser, setNewUser] = useState({ email: '', password: '', client: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { users, loading, addUser: addUserDB, updateUser: updateUserDB, deleteUser: deleteUserDB } = useUsers();
  const { toast } = useToast();
  const isFormValid = newUser.email.trim() !== '' && newUser.password.trim() !== '' && newUser.client.trim() !== '';

  const handleAddUser = async () => {
    console.log('handleAddUser called', newUser);

    if (!newUser.email || !newUser.password || !newUser.client) {
      console.log('Validation failed:', {
        hasEmail: !!newUser.email,
        hasPassword: !!newUser.password,
        hasClient: !!newUser.client
      });
      return;
    }

    try {
      console.log('Calling addUserDB...');
      await addUserDB(newUser);
      setNewUser({ email: '', password: '', client: '' });
      console.log('User added successfully');
    } catch (error) {
      console.error('Error in handleAddUser:', error);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateUserDB(user.id, {
        status: user.status === 'active' ? 'inactive' : 'active'
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteUser = async (userId: number) => {
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
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
                className="bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="userClient">Cliente</Label>
              <Input
                id="userClient"
                value={newUser.client}
                onChange={(e) => setNewUser({ ...newUser, client: e.target.value })}
                placeholder="Nombre del cliente"
                className="bg-background/50"
              />
            </div>
          </div>
          <Button
            onClick={() => {
              if (isFormValid) {
                handleAddUser();
              } else {
                toast({
                  title: 'Faltan datos',
                  description: 'Completa correo, contraseña y cliente',
                  variant: 'destructive'
                });
              }
            }}
            className="bg-gradient-secondary hover:bg-gradient-primary"
            disabled={loading || !isFormValid}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
          {loading ? (
            <LoadingSpinner text="Cargando usuarios..." />
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-mcs-blue/20">
                  <div>
                    <p className="font-medium text-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.client}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={`${user.status === 'active'
                          ? 'bg-mcs-teal/20 text-mcs-teal'
                          : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {user.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleUserStatus(user)}
                      className="border-mcs-blue/30"
                    >
                      {user.status === 'active' ? 'Desactivar' : 'Activar'}
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