import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div
                className="modal-content animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}
