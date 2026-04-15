export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <div
            className={`${sizeClasses[size]} border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin`}
        />
    );
}

export function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-[var(--color-text-secondary)]">Loading...</p>
            </div>
        </div>
    );
}
