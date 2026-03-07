import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface ClientBasicInfoProps {
    name: string;
    domain: string;
    logo: string | null;
    onNameChange: (value: string) => void;
    onDomainChange: (value: string) => void;
    onLogoChange: (dataUrl: string) => void;
}

export function ClientBasicInfo({
    name,
    domain,
    logo,
    onNameChange,
    onDomainChange,
    onLogoChange,
}: ClientBasicInfoProps) {
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                onLogoChange(result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Card className="bg-background/30 border-mcs-blue/20">
            <CardHeader>
                <CardTitle className="text-mcs-blue">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="clientName">Nombre del Cliente</Label>
                        <Input
                            id="clientName"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <div>
                        <Label htmlFor="clientDomain">Dominio</Label>
                        <Input
                            id="clientDomain"
                            value={domain}
                            onChange={(e) => onDomainChange(e.target.value)}
                            className="bg-background/50"
                            placeholder="empresa.com"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="logoUpload">Logo del Cliente</Label>
                    <div className="flex items-center space-x-4 mt-2">
                        <img
                            src={logo || '/placeholder.svg'}
                            alt={`${name} logo`}
                            className="w-16 h-16 object-contain border border-mcs-blue/30 rounded-lg p-2"
                        />
                        <div>
                            <input
                                id="logoUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="border-mcs-blue/30"
                                onClick={() => document.getElementById('logoUpload')?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Cambiar Logo
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
