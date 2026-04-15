import { useState, useRef } from 'react';
import { X, Upload, Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import { emailApi } from '../services/api';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const styles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(2px)',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto' as const,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
    },
    title: {
        fontSize: '1.125rem',
        fontWeight: 600,
        color: '#111827',
    },
    closeBtn: {
        padding: '0.5rem',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        padding: '1.5rem',
    },
    error: {
        marginBottom: '1rem',
        padding: '0.75rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#991b1b',
        fontSize: '0.875rem',
    },
    label: {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '0.5rem',
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#111827',
        outline: 'none',
        marginBottom: '1rem',
        boxSizing: 'border-box' as const,
    },
    textarea: {
        width: '100%',
        padding: '0.75rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#111827',
        outline: 'none',
        marginBottom: '1rem',
        minHeight: '100px',
        resize: 'vertical' as const,
        boxSizing: 'border-box' as const,
    },
    uploadBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#374151',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
    },
    uploadSuccess: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.75rem',
        padding: '0.75rem',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        color: '#166534',
        fontSize: '0.875rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
    },
    cancelBtn: {
        padding: '0.625rem 1.25rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#374151',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
    },
    submitBtn: {
        padding: '0.625rem 1.25rem',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#22c55e',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
    },
};

export function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);
    const [fileName, setFileName] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [delayBetweenEmails, setDelayBetweenEmails] = useState(2);
    const [hourlyLimit, setHourlyLimit] = useState(200);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('File selected:', file.name);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            console.log('File content:', text.substring(0, 200));

            // Parse CSV or text file for emails - handle various formats
            const emails = text
                .split(/[\n\r,;]+/)
                .map((line) => {
                    // Extract email from line (handle "Name <email>" format too)
                    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
                    return emailMatch ? emailMatch[0].trim().toLowerCase() : '';
                })
                .filter((email) => email.length > 0 && email.includes('@'));

            console.log('Parsed emails:', emails);
            setRecipients([...new Set(emails)]); // Remove duplicates
            setError('');
        };
        reader.onerror = () => {
            setError('Failed to read file');
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!subject.trim()) {
            setError('Subject is required');
            return;
        }

        if (!body.trim()) {
            setError('Body is required');
            return;
        }

        if (recipients.length === 0) {
            setError('Please upload a CSV file with email addresses');
            return;
        }

        if (!scheduledDate || !scheduledTime) {
            setError('Please select a scheduled date and time');
            return;
        }

        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

        setIsLoading(true);

        try {
            await emailApi.schedule({
                subject,
                body,
                recipients,
                scheduledAt,
                delayBetweenEmails: delayBetweenEmails * 1000,
                hourlyLimit,
            });

            // Reset form
            setSubject('');
            setBody('');
            setRecipients([]);
            setFileName('');
            setScheduledDate('');
            setScheduledTime('');

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Schedule error:', err);
            setError(err.response?.data?.error || 'Failed to schedule emails');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    // Get minimum datetime (now)
    const now = new Date();
    const minDate = now.toISOString().split('T')[0];

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={handleClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>Compose New Email</h2>
                    <button style={styles.closeBtn} onClick={handleClose}>
                        <X size={20} color="#6b7280" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div style={styles.body}>
                        {error && <div style={styles.error}>{error}</div>}

                        {/* Recipients Upload */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={styles.label}>Recipients</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv,.txt"
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                style={styles.uploadBtn}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={16} />
                                Upload CSV
                            </button>

                            {recipients.length > 0 && (
                                <div style={styles.uploadSuccess}>
                                    <CheckCircle size={18} />
                                    <FileText size={16} />
                                    <span><strong>{fileName}</strong> - {recipients.length} email{recipients.length !== 1 ? 's' : ''} detected</span>
                                </div>
                            )}

                            {recipients.length > 0 && (
                                <div style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    maxHeight: '60px',
                                    overflowY: 'auto'
                                }}>
                                    {recipients.slice(0, 5).join(', ')}
                                    {recipients.length > 5 && ` and ${recipients.length - 5} more...`}
                                </div>
                            )}
                        </div>

                        {/* Subject */}
                        <div>
                            <label style={styles.label}>Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter email subject"
                                style={styles.input}
                            />
                        </div>

                        {/* Body */}
                        <div>
                            <label style={styles.label}>Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Enter email body"
                                style={styles.textarea}
                                rows={4}
                            />
                        </div>

                        {/* Schedule Date/Time */}
                        <div style={styles.grid}>
                            <div>
                                <label style={styles.label}>
                                    <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={minDate}
                                    style={{ ...styles.input, marginBottom: 0 }}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>
                                    <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    style={{ ...styles.input, marginBottom: 0 }}
                                />
                            </div>
                        </div>

                        {/* Advanced Options */}
                        <div style={{ ...styles.grid, marginTop: '1rem' }}>
                            <div>
                                <label style={styles.label}>Delay between emails (s)</label>
                                <input
                                    type="number"
                                    value={delayBetweenEmails}
                                    onChange={(e) => setDelayBetweenEmails(parseInt(e.target.value) || 2)}
                                    min={1}
                                    max={60}
                                    style={{ ...styles.input, marginBottom: 0 }}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Hourly Limit</label>
                                <input
                                    type="number"
                                    value={hourlyLimit}
                                    onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 200)}
                                    min={1}
                                    max={1000}
                                    style={{ ...styles.input, marginBottom: 0 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <button
                            type="button"
                            style={styles.cancelBtn}
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                ...styles.submitBtn,
                                opacity: isLoading ? 0.7 : 1,
                                cursor: isLoading ? 'wait' : 'pointer',
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Scheduling...' : 'Schedule Emails'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
