import { useAuth } from '../hooks/useAuth';
import { Button } from './ui';
import { LogOut, User } from 'lucide-react';

export function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-[var(--color-border)] px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Dashboard
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    )}
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            {user?.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            {user?.email}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
        </header>
    );
}
