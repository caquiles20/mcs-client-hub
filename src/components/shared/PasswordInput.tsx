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
    leftIcon?: React.ReactNode;
}

/**
 * Password input with show/hide toggle.
 * Enhanced with optional left icon support and improved hit area.
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
    leftIcon,
}: PasswordInputProps) {
    const [show, setShow] = useState(false);

    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                        {leftIcon}
                    </div>
                )}
                <Input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`bg-background/50 border-mcs-blue/30 focus:border-mcs-blue pr-10 ${leftIcon ? 'pl-10' : ''}`}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 hover:bg-transparent text-muted-foreground hover:text-foreground z-20"
                    onClick={() => setShow(prev => !prev)}
                    aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {show ? (
                        <EyeOff className="w-4 h-4" />
                    ) : (
                        <Eye className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
