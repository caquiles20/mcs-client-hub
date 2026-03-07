import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Service = Database['public']['Tables']['services']['Row'] & {
    sub_services?: Database['public']['Tables']['sub_services']['Row'][];
};

interface ClientServicesConfigProps {
    services: Service[] | undefined;
    localSubServiceValues: Record<number, { name: string; url: string }>;
    onLocalSubServiceChange: (id: number, field: 'name' | 'url', value: string) => void;
    onAddSubService: (serviceId: number) => void;
    onUpdateSubService: (subServiceId: number, field: 'name' | 'url', value: string) => void;
    onRemoveSubService: (subServiceId: number) => void;
    onRemoveService: (serviceId: number) => void;
}

export function ClientServicesConfig({
    services,
    localSubServiceValues,
    onLocalSubServiceChange,
    onAddSubService,
    onUpdateSubService,
    onRemoveSubService,
    onRemoveService,
}: ClientServicesConfigProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-foreground">Servicios Configurados</h4>
            </div>

            {services?.map((service) => (
                <Card key={service.id} className="bg-background/30 border-mcs-blue/20">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base text-mcs-blue">{service.name}</CardTitle>
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onAddSubService(service.id)}
                                    className="border-mcs-blue/30"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Subservicio
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onRemoveService(service.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {service.sub_services?.map((subService) => (
                            <div key={subService.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-card/50 rounded border border-mcs-blue/10">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Nombre del Subservicio</Label>
                                    <Input
                                        value={localSubServiceValues[subService.id]?.name ?? subService.name}
                                        onChange={(e) => onLocalSubServiceChange(subService.id, 'name', e.target.value)}
                                        onBlur={() => {
                                            const local = localSubServiceValues[subService.id];
                                            if (local && local.name !== subService.name) {
                                                onUpdateSubService(subService.id, 'name', local.name);
                                            }
                                        }}
                                        placeholder="Nombre del subservicio"
                                        className="bg-background/50 text-sm"
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">URL del Subservicio</Label>
                                        <Input
                                            value={localSubServiceValues[subService.id]?.url ?? subService.url}
                                            onChange={(e) => onLocalSubServiceChange(subService.id, 'url', e.target.value)}
                                            onBlur={() => {
                                                const local = localSubServiceValues[subService.id];
                                                if (local && local.url !== subService.url) {
                                                    onUpdateSubService(subService.id, 'url', local.url);
                                                }
                                            }}
                                            placeholder="https://..."
                                            className="bg-background/50 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => onRemoveSubService(subService.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )) || []}
                        {(!service.sub_services || service.sub_services.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay subservicios configurados. Haz clic en "Subservicio" para agregar uno.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )) || <p className="text-muted-foreground">No hay servicios configurados</p>}
        </div>
    );
}
