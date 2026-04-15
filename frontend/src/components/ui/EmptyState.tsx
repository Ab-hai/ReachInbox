import type { ReactNode } from 'react';
import { Mail } from 'lucide-react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            {icon || <Mail />}
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
