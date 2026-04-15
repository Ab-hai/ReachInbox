import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`input min-h-[120px] resize-y ${error ? 'border-[var(--color-error)]' : ''} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-[var(--color-error)]">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
