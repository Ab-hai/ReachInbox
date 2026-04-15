import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'google';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseClasses = 'btn';

    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        google: 'btn-google',
    };

    const sizeClasses = {
        sm: 'text-xs px-3 py-1.5',
        md: '',
        lg: 'text-base px-6 py-3',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className="spinner" />
                    Loading...
                </>
            ) : (
                children
            )}
        </button>
    );
}
