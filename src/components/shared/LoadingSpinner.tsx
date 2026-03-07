import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    text?: string;
    className?: string;
}

/**
 * Reusable loading spinner with optional label.
 * Replaces the duplicated spinner pattern in ClientManagement and UserManagement.
 */
export function LoadingSpinner({ text, className = '' }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center py-8 ${className}`}>
            <Loader2 className="w-6 h-6 animate-spin text-mcs-blue" />
            {text && <span className="ml-2 text-muted-foreground">{text}</span>}
        </div>
    );
}
