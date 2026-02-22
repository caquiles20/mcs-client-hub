import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, 
  BarChart3, 
  Activity, 
  FileBarChart, 
  Clock, 
  Users, 
  Settings, 
  FileText, 
  Database,
  LogOut,
  User,
  ExternalLink
} from 'lucide-react';
import nocBackground from '@/assets/noc-background.jpg';
import { ChatWidget } from '@/components/chat';

interface SubService {
  name: string;
  url: string;
}

interface Service {
  name: string;
  sub_services?: SubService[];
}

interface ClientPortalProps {
  clientName: string;
  clientLogo?: string;
  clientEmail: string;
  availableServices: Service[];
  onLogout: () => void;
  onChangePassword: () => void;
}

const serviceIcons: { [key: string]: any } = {
  'Mesa de Servicios ITSM': Shield,
  'Reportes de Servicio': FileBarChart,
  'Monitoreo': Activity,
  'Reportes QBR': BarChart3,
  'Alcances del Servicio (SLA)': Clock,
  'Matriz de Escalación': Users,
  'Estatus de Implementaciones': Settings,
  'Gestión de Recursos': Database,
  'Estatus de Polizas de Servicio': FileText,
};

const serviceDescriptions: { [key: string]: string } = {
  'Mesa de Servicios ITSM': 'Gestión completa de tickets y solicitudes de servicio',
  'Reportes de Servicio': 'Reportes detallados del desempeño de servicios',
  'Monitoreo': 'Supervisión en tiempo real de infraestructura y servicios',
  'Reportes QBR': 'Revisiones trimestrales de negocio y métricas',
  'Alcances del Servicio (SLA)': 'Definición y seguimiento de niveles de servicio',
  'Matriz de Escalación': 'Procedimientos y contactos para escalación',
  'Estatus de Implementaciones': 'Seguimiento de proyectos e implementaciones',
  'Gestión de Recursos': 'Administración de recursos y capacidades',
  'Estatus de Polizas de Servicio': 'Estado y vigencia de pólizas de servicio',
};

export default function ClientPortal({ 
  clientName, 
  clientLogo,
  clientEmail, 
  availableServices, 
  onLogout,
  onChangePassword 
}: ClientPortalProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubServicesDialogOpen, setIsSubServicesDialogOpen] = useState(false);
  
  const handleServiceClick = (service: Service) => {
    if (!service.sub_services || service.sub_services.length === 0) {
      alert(`Accediendo a: ${service.name}\n\nEsta funcionalidad estará disponible una vez que se conecte la base de datos.`);
      return;
    }

    // If there's only one subservice, open it directly in new window
    if (service.sub_services.length === 1) {
      window.open(service.sub_services[0].url, '_blank', 'noopener,noreferrer');
      return;
    }

    // If there are multiple subservices, show dialog
    setSelectedService(service);
    setIsSubServicesDialogOpen(true);
  };

  const handleSubServiceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsSubServicesDialogOpen(false);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${nocBackground})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-mcs-navy/95 via-background/90 to-mcs-navy/95" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-mcs-blue/30 shadow-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {clientLogo ? (
                <div className="h-12 px-3 rounded-lg overflow-hidden shadow-glow border-2 border-mcs-blue/30 bg-white/10 flex items-center justify-center">
                  <img 
                    src={clientLogo} 
                    alt={`${clientName} logo`}
                    className="max-h-10 max-w-[120px] w-auto h-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{clientName}</h1>
                <p className="text-mcs-cyan text-sm">Portal de Servicios NOC</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right mr-3">
                <p className="text-sm text-foreground font-medium">{clientEmail}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={onChangePassword}
                  className="text-mcs-cyan hover:text-mcs-blue p-0 h-auto"
                >
                  Cambiar contraseña
                </Button>
              </div>
              
              <Button 
                onClick={onLogout}
                variant="outline" 
                size="sm"
                className="border-mcs-blue/30 hover:bg-mcs-blue/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
              {/* Welcome Section */}
              <div className="mb-8">
                <Card className="bg-gradient-secondary/20 backdrop-blur-sm border-mcs-teal/30 shadow-card">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Bienvenido al Portal de Servicios
                      </h2>
                      <p className="text-mcs-cyan">
                        Accede a todos los servicios de NOC disponibles para tu organización
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableServices.map((service) => {
                  const Icon = serviceIcons[service.name] || Settings;
                  const description = serviceDescriptions[service.name] || 'Servicio disponible';
                  const hasSubServices = service.sub_services && service.sub_services.length > 0;
                  
                  return (
                    <Card 
                      key={service.name} 
                      className="bg-card/80 backdrop-blur-sm border-mcs-blue/30 shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer group"
                      onClick={() => handleServiceClick(service)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center group-hover:bg-gradient-primary transition-all duration-300">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="bg-mcs-teal/20 text-mcs-teal border-mcs-teal/30"
                          >
                            {hasSubServices ? `${service.sub_services.length} subservicio${service.sub_services.length > 1 ? 's' : ''}` : 'Activo'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-foreground group-hover:text-mcs-cyan transition-colors">
                          {service.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                          {description}
                        </p>
                        <Button 
                          className="w-full bg-gradient-secondary hover:bg-gradient-primary transition-all duration-300"
                          size="sm"
                        >
                          Acceder al Servicio
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Footer Info */}
              <div className="mt-12">
                <Card className="bg-card/60 backdrop-blur-sm border-mcs-blue/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Shield className="w-5 h-5 text-mcs-blue" />
                      <span className="text-foreground font-semibold">MCS Network Solution</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Centro de Operaciones de Red (NOC)
                    </p>
                    <p className="text-mcs-cyan text-xs mt-2">
                      Portal seguro - Conexión cifrada SSL/TLS
                    </p>
                  </CardContent>
                </Card>
              </div>
        </main>
      </div>

      {/* Subservices Dialog */}
      <Dialog open={isSubServicesDialogOpen} onOpenChange={setIsSubServicesDialogOpen}>
        <DialogContent className="bg-card border-mcs-blue/30">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectedService?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecciona el subservicio al que deseas acceder
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            {selectedService?.sub_services?.map((subService) => (
              <Button
                key={subService.name}
                onClick={() => handleSubServiceClick(subService.url)}
                className="w-full bg-gradient-secondary hover:bg-gradient-primary transition-all duration-300 justify-between"
              >
                <span>{subService.name}</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Widget */}
      <ChatWidget 
        userDomain={clientEmail.split('@')[1] || ''} 
        clientName={clientName} 
      />
    </div>
  );
}