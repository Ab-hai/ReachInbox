import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`input ${error ? 'border-[var(--color-error)]' : ''} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-[var(--color-error)]">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
