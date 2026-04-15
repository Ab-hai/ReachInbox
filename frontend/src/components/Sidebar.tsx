import { NavLink } from 'react-router-dom';
import { Mail, Clock, Send, PenSquare } from 'lucide-react';
import { Button } from './ui/Button';

interface SidebarProps {
    onCompose: () => void;
}

export function Sidebar({ onCompose }: SidebarProps) {
    const navItems = [
        { to: '/dashboard', icon: Clock, label: 'Scheduled', end: true },
        { to: '/dashboard/sent', icon: Send, label: 'Sent' },
    ];

    return (
        <aside className="w-64 bg-[var(--color-sidebar-bg)] min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">ReachInbox</span>
                </div>
            </div>

            {/* Compose Button */}
            <div className="p-4">
                <Button className="w-full" onClick={onCompose}>
                    <PenSquare size={18} />
                    Compose
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `sidebar-nav-item mb-1 ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 text-center">
                    Email Scheduler v1.0
                </p>
            </div>
        </aside>
    );
}
