import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { UserEditModal } from './UserEditModal';

interface User {
  id: number;
  email: string;
  client: string;
  status: 'active' | 'inactive';
}

interface UserManagementProps {
  users: User[];
  setUsers: (users: User[]) => void;
}

export function UserManagement({ users, setUsers }: UserManagementProps) {
  const [newUser, setNewUser] = useState({ email: '', password: '', client: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const addUser = () => {
    if (newUser.email && newUser.password && newUser.client) {
      setUsers([...users, { 
        id: Date.now(), 
        email: newUser.email, 
        client: newUser.client, 
        status: 'active' 
      }]);
      setNewUser({ email: '', password: '', client: '' });
    }
  };

  const toggleUserStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const deleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const updateUser = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setEditingUser(null);
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
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
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
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="••••••••"
                className="bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="userClient">Cliente</Label>
              <Input
                id="userClient"
                value={newUser.client}
                onChange={(e) => setNewUser({...newUser, client: e.target.value})}
                placeholder="Nombre del cliente"
                className="bg-background/50"
              />
            </div>
          </div>
          <Button 
            onClick={addUser}
            className="bg-gradient-secondary hover:bg-gradient-primary"
          >
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
                    className={`${
                      user.status === 'active' 
                        ? 'bg-mcs-teal/20 text-mcs-teal' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {user.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleUserStatus(user.id)}
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
                    onClick={() => deleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {editingUser && (
        <UserEditModal
          user={editingUser}
          onSave={updateUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}