import { Badge, EmptyState, Spinner } from './ui';
import { Mail } from 'lucide-react';
import type { Email } from '../types';

interface EmailTableProps {
    emails: Email[];
    isLoading: boolean;
    emptyTitle: string;
    emptyDescription: string;
    showSentAt?: boolean;
}

export function EmailTable({
    emails,
    isLoading,
    emptyTitle,
    emptyDescription,
    showSentAt = false,
}: EmailTableProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    if (emails.length === 0) {
        return (
            <EmptyState
                icon={<Mail className="w-12 h-12" />}
                title={emptyTitle}
                description={emptyDescription}
            />
        );
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>{showSentAt ? 'Sent At' : 'Scheduled At'}</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {emails.map((email) => (
                        <tr key={email.id} className="animate-fade-in">
                            <td>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-medium">
                                        {email.recipientEmail[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm">{email.recipientEmail}</span>
                                </div>
                            </td>
                            <td>
                                <span className="text-sm font-medium">{email.subject}</span>
                            </td>
                            <td>
                                <span className="text-sm text-[var(--color-text-secondary)]">
                                    {formatDate(showSentAt ? email.sentAt : email.scheduledAt)}
                                </span>
                            </td>
                            <td>
                                <Badge status={email.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
