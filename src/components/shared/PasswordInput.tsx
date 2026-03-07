import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    minLength?: number;
    placeholder?: string;
    className?: string;
}

/**
 * Password input with show/hide toggle.
 * Replaces the 3 identical patterns in ChangePasswordModal.
 */
export function PasswordInput({
    id,
    label,
    value,
    onChange,
    required,
    minLength,
    placeholder = '••••••••',
    className = '',
}: PasswordInputProps) {
    const [show, setShow] = useState(false);

    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-background/50 border-mcs-blue/30 focus:border-mcs-blue pr-10"
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShow(prev => !prev)}
                    aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {show ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                </Button>
            </div>
        </div>
    );
}
