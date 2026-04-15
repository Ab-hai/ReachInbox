interface BadgeProps {
    status: 'scheduled' | 'processing' | 'sent' | 'failed';
}

export function Badge({ status }: BadgeProps) {
    const statusConfig = {
        scheduled: {
            className: 'badge-scheduled',
            label: 'Scheduled',
        },
        processing: {
            className: 'badge-processing',
            label: 'Processing',
        },
        sent: {
            className: 'badge-sent',
            label: 'Sent',
        },
        failed: {
            className: 'badge-failed',
            label: 'Failed',
        },
    };

    const config = statusConfig[status];

    return <span className={`badge ${config.className}`}>{config.label}</span>;
}
