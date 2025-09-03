import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Mail } from 'lucide-react';
import nocBackground from '@/assets/noc-background.jpg';
import mcsLogo from '@/assets/mcs-logo.png';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication delay
    setTimeout(() => {
      onLogin(email, password);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${nocBackground})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-mcs-navy/90 via-background/80 to-mcs-navy/90" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-6 shadow-glow p-3">
            <img 
              src={mcsLogo} 
              alt="MCS Logo" 
              className="w-full h-full object-contain filter brightness-0 invert"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Portal de Servicios MCS</h1>
          <p className="text-mcs-cyan">Centro de Operaciones de Red NOC</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-mcs-blue/30 shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-foreground">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-mcs-blue/30 focus:border-mcs-blue"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-mcs-blue/30 focus:border-mcs-blue"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-secondary hover:bg-gradient-primary transition-all duration-300 shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Acceder al Portal'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Portal seguro para clientes MCS</p>
              <p className="text-mcs-cyan">Network Operations Center</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}