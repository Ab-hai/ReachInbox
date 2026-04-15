import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Mail, Clock, Send, ArrowLeft, X, Upload, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Link2, Strikethrough, ChevronDown, User, Paperclip, FileText, Star, Trash2, Archive, Search, Filter, RefreshCw, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { emailApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Email } from '../types';

interface AttachedFile {
    name: string;
    size: number;
    type: string;
    file: File;
}

interface EmailCounts {
    scheduled: number;
    sent: number;
}

interface OutletContextType {
    onEmailSelect: (email: Email) => void;
    searchQuery: string;
}

// Rich Text Editor Component with working formatting
function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const isInitialized = useRef(false);

    // Set initial content only once
    useEffect(() => {
        if (editorRef.current && !isInitialized.current && value) {
            editorRef.current.innerHTML = value;
            isInitialized.current = true;
        }
    }, [value]);

    // Update parent value when content changes
    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    // Check which formats are active at cursor position
    const updateActiveFormats = () => {
        const formats = new Set<string>();
        if (document.queryCommandState('bold')) formats.add('bold');
        if (document.queryCommandState('italic')) formats.add('italic');
        if (document.queryCommandState('underline')) formats.add('underline');
        if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
        if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
        if (document.queryCommandState('insertOrderedList')) formats.add('ol');
        setActiveFormats(formats);
    };

    // Execute formatting command
    const execFormat = (command: string, formatValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, formatValue);
        handleInput();
        updateActiveFormats();
    };

    // Handle link insertion
    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execFormat('createLink', url);
        }
    };

    const ToolbarButton = ({
        command,
        icon: Icon,
        title,
        onClick
    }: {
        command: string;
        icon: React.ElementType;
        title: string;
        onClick?: () => void;
    }) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
            onClick={(e) => {
                e.preventDefault();
                if (onClick) {
                    onClick();
                } else {
                    execFormat(command);
                }
            }}
            className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${activeFormats.has(command.toLowerCase()) ? 'bg-gray-200 text-gray-900' : 'text-gray-500'
                }`}
            title={title}
        >
            <Icon size={16} />
        </button>
    );

    return (
        <div className="flex-1 mt-4 border border-gray-200 rounded-lg flex flex-col min-h-64">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-200 flex-wrap bg-white rounded-t-lg">
                <ToolbarButton command="bold" icon={Bold} title="Bold (Ctrl+B)" />
                <ToolbarButton command="italic" icon={Italic} title="Italic (Ctrl+I)" />
                <ToolbarButton command="underline" icon={Underline} title="Underline (Ctrl+U)" />
                <ToolbarButton command="strikeThrough" icon={Strikethrough} title="Strikethrough" />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton command="justifyLeft" icon={AlignLeft} title="Align Left" />
                <ToolbarButton command="justifyCenter" icon={AlignCenter} title="Align Center" />
                <ToolbarButton command="justifyRight" icon={AlignRight} title="Align Right" />
                <ToolbarButton command="justifyFull" icon={AlignJustify} title="Justify" />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton command="insertUnorderedList" icon={List} title="Bullet List" />
                <ToolbarButton command="insertOrderedList" icon={ListOrdered} title="Numbered List" />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton command="formatBlock" icon={Quote} title="Block Quote" onClick={() => execFormat('formatBlock', 'blockquote')} />
                <ToolbarButton command="createLink" icon={Link2} title="Insert Link" onClick={insertLink} />
            </div>

            {/* Editable Content Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onSelect={updateActiveFormats}
                onKeyUp={updateActiveFormats}
                onMouseUp={updateActiveFormats}
                data-placeholder="Type Your Reply..."
                className="flex-1 p-4 text-sm leading-relaxed text-gray-700 outline-none overflow-y-auto min-h-48 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                style={{ wordBreak: 'break-word' }}
                suppressContentEditableWarning
            />
        </div>
    );
}

function Sidebar({ onCompose, counts }: { onCompose: () => void; counts: EmailCounts }) {
    return (
        <aside className="w-52 bg-gray-800 flex flex-col min-h-screen">
            {/* Logo */}
            <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                    <Mail size={16} className="text-white" />
                </div>
                <span className="text-base font-semibold text-white">ReachInbox</span>
            </div>

            {/* User info */}
            <div className="p-3 border-b border-gray-700">
                <UserCompact />
            </div>

            {/* Compose Button */}
            <div className="p-2">
                <button
                    onClick={onCompose}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border-2 border-green-500 text-green-500 text-sm font-medium hover:bg-green-500 hover:text-white transition-colors"
                >
                    Compose
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2">
                <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">Core</div>
                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-md text-sm mb-1 transition-colors ${isActive ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`
                    }
                >
                    <div className="flex items-center gap-3">
                        <Clock size={18} />
                        Scheduled
                    </div>
                    {counts.scheduled > 0 && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {counts.scheduled}
                        </span>
                    )}
                </NavLink>
                <NavLink
                    to="/dashboard/sent"
                    className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors ${isActive ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`
                    }
                >
                    <div className="flex items-center gap-3">
                        <Send size={18} />
                        Sent
                    </div>
                    {counts.sent > 0 && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {counts.sent}
                        </span>
                    )}
                </NavLink>
            </nav>
        </aside>
    );
}

function UserCompact() {
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 w-full hover:bg-gray-700 rounded-md p-1 transition-colors"
            >
                {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                        {user?.name?.[0]?.toUpperCase() || <User size={14} />}
                    </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                    <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-gray-700 rounded-md shadow-lg z-50 overflow-hidden">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-gray-600 transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function SearchBar({
    value,
    onChange,
    onRefresh
}: {
    value: string;
    onChange: (value: string) => void;
    onRefresh: () => void;
}) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
            </div>
            <button className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                <Filter size={18} />
            </button>
            <button
                onClick={onRefresh}
                className="p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
                <RefreshCw size={18} />
            </button>
        </div>
    );
}

function EmailDetailView({ email, onBack }: { email: Email; onBack: () => void }) {
    const [isStarred, setIsStarred] = useState(false);
    const { user } = useAuth();

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="flex-1 bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-base font-medium text-gray-900">
                        {email.recipientEmail.split('@')[0]}, hello there! | {email.subject}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsStarred(!isStarred)}
                        className={`p-2 rounded hover:bg-gray-100 ${isStarred ? 'text-yellow-500' : 'text-gray-400'}`}
                    >
                        <Star size={18} fill={isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button className="p-2 rounded hover:bg-gray-100 text-gray-400">
                        <Archive size={18} />
                    </button>
                    <button className="p-2 rounded hover:bg-gray-100 text-gray-400">
                        <Trash2 size={18} />
                    </button>
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full ml-2" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium ml-2">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl">
                    {/* Sender info */}
                    <div className="flex items-start gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{user?.name || 'You'}</span>
                                <span className="text-gray-500 text-sm">&lt;{user?.email || 'sender@example.com'}&gt;</span>
                            </div>
                            <div className="text-sm text-gray-500">to {email.recipientEmail}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                            {formatDate(email.sentAt || email.scheduledAt)}
                        </div>
                    </div>

                    {/* Email body */}
                    <div
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: email.body || '' }}
                    />

                    {/* Status */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${email.status === 'sent' ? 'bg-green-100 text-green-700' :
                            email.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SendLaterPopover({
    isOpen,
    onClose,
    onSchedule,
    selectedDateTime,
    setSelectedDateTime
}: {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: () => void;
    selectedDateTime: string;
    setSelectedDateTime: (dt: string) => void;
}) {
    if (!isOpen) return null;

    const getPresetTime = (preset: string) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (preset) {
            case 'tomorrow':
                tomorrow.setHours(9, 0, 0, 0);
                return tomorrow.toISOString().slice(0, 16);
            case 'tomorrow10':
                tomorrow.setHours(10, 0, 0, 0);
                return tomorrow.toISOString().slice(0, 16);
            case 'tomorrow11':
                tomorrow.setHours(11, 0, 0, 0);
                return tomorrow.toISOString().slice(0, 16);
            case 'tomorrow3pm':
                tomorrow.setHours(15, 0, 0, 0);
                return tomorrow.toISOString().slice(0, 16);
            default:
                return '';
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 w-72 z-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">Send Later</div>

                <input
                    type="datetime-local"
                    value={selectedDateTime}
                    onChange={(e) => setSelectedDateTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm text-gray-700 mb-3"
                    placeholder="Pick date & time"
                />

                {['tomorrow', 'tomorrow10', 'tomorrow11', 'tomorrow3pm'].map((preset) => (
                    <button
                        key={preset}
                        onClick={() => setSelectedDateTime(getPresetTime(preset))}
                        className="block w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 mb-0.5"
                    >
                        {preset === 'tomorrow' && 'Tomorrow'}
                        {preset === 'tomorrow10' && 'Tomorrow, 10:00 AM'}
                        {preset === 'tomorrow11' && 'Tomorrow, 11:00 AM'}
                        {preset === 'tomorrow3pm' && 'Tomorrow, 3:00 PM'}
                    </button>
                ))}

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                        Cancel
                    </button>
                    <button
                        onClick={onSchedule}
                        className="px-4 py-2 text-sm font-medium text-green-600 border border-green-500 rounded-md hover:bg-green-50"
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function ComposeView({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
    const [recipients, setRecipients] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [delayBetweenEmails, setDelayBetweenEmails] = useState(0);
    const [hourlyLimit, setHourlyLimit] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSendLater, setShowSendLater] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [attachments, setAttachments] = useState<AttachedFile[]>([]);
    const [uploadingList, setUploadingList] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const handleListUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingList(true);
        setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
            const foundEmails = text.match(emailRegex) || [];
            const uniqueEmails = [...new Set(foundEmails.map(e => e.toLowerCase()))];

            if (uniqueEmails.length === 0) {
                setError('No valid email addresses found in the file');
                setUploadingList(false);
                return;
            }

            const newRecipients = [...new Set([...recipients, ...uniqueEmails])];
            setRecipients(newRecipients);
            setUploadingList(false);
        };

        reader.onerror = () => {
            setError('Failed to read the file');
            setUploadingList(false);
        };

        reader.readAsText(file);
        e.target.value = '';
    };

    const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newAttachments: AttachedFile[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            newAttachments.push({
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
            });
        }

        setAttachments([...attachments, ...newAttachments]);
        e.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addEmail();
        }
    };

    const addEmail = () => {
        const email = emailInput.trim().toLowerCase();
        const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;

        if (email && emailRegex.test(email) && !recipients.includes(email)) {
            setRecipients([...recipients, email]);
            setEmailInput('');
        }
    };

    const removeRecipient = (email: string) => {
        setRecipients(recipients.filter(r => r !== email));
    };

    const handleSchedule = async () => {
        setError('');

        if (recipients.length === 0) {
            setError('Please add at least one recipient');
            return;
        }
        if (!subject.trim()) {
            setError('Subject is required');
            return;
        }
        if (!body.trim()) {
            setError('Email body is required');
            return;
        }
        if (!scheduledDateTime) {
            setError('Please select a date and time');
            return;
        }

        setIsLoading(true);

        try {
            await emailApi.schedule({
                subject,
                body,
                recipients,
                scheduledAt: new Date(scheduledDateTime).toISOString(),
                delayBetweenEmails: delayBetweenEmails * 1000,
                hourlyLimit: hourlyLimit || 200,
            });

            setShowSendLater(false);
            onSuccess();
            onBack();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to schedule emails');
        } finally {
            setIsLoading(false);
        }
    };

    const visibleRecipients = recipients.slice(0, 3);
    const hiddenCount = recipients.length - 3;

    return (
        <div className="flex-1 bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3 text-base font-medium text-gray-900">
                    <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded">
                        <ArrowLeft size={20} />
                    </button>
                    <span>Compose New Email</span>
                </div>
                <div className="flex items-center gap-2 relative">
                    <input type="file" ref={attachmentInputRef} onChange={handleAttachment} multiple className="hidden" />
                    <button
                        onClick={() => attachmentInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Attach file"
                    >
                        <Paperclip size={18} />
                    </button>
                    <button
                        onClick={() => setShowSendLater(true)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Schedule"
                    >
                        <Clock size={18} />
                    </button>
                    <button
                        onClick={() => setShowSendLater(true)}
                        disabled={isLoading}
                        className="px-4 py-2 border border-green-500 rounded-full text-green-600 text-sm font-medium hover:bg-green-50 disabled:opacity-50"
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>

                    <SendLaterPopover
                        isOpen={showSendLater}
                        onClose={() => setShowSendLater(false)}
                        onSchedule={handleSchedule}
                        selectedDateTime={scheduledDateTime}
                        setSelectedDateTime={setScheduledDateTime}
                    />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-4 flex flex-col overflow-y-auto">
                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* From */}
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500 w-14">From</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-700">
                        <span>{user?.email || 'ethereal@test.io'}</span>
                        <ChevronDown size={14} />
                    </div>
                </div>

                {/* To */}
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500 w-14">To</span>
                    <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                        {visibleRecipients.map((email) => (
                            <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
                                {email}
                                <button onClick={() => removeRecipient(email)} className="hover:text-green-900">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {hiddenCount > 0 && (
                            <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600">
                                +{hiddenCount}
                            </span>
                        )}
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={handleEmailInputKeyDown}
                            onBlur={addEmail}
                            placeholder={recipients.length === 0 ? "Type email and press Enter" : ""}
                            className="flex-1 min-w-40 border-none outline-none text-sm text-gray-700 bg-transparent py-1"
                        />
                    </div>

                    <input type="file" ref={fileInputRef} onChange={handleListUpload} accept=".csv,.txt" className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingList}
                        className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:text-green-700 disabled:opacity-50"
                    >
                        <Upload size={16} />
                        {uploadingList ? 'Loading...' : 'Upload List'}
                    </button>
                </div>

                {/* Subject */}
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500 w-14">Subject</span>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject"
                        className="flex-1 border-none outline-none text-sm text-gray-900 bg-transparent"
                    />
                </div>

                {/* Delay & Hourly Limit */}
                <div className="flex items-center gap-6 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Delay between 2 emails</span>
                        <input
                            type="number"
                            value={delayBetweenEmails}
                            onChange={(e) => setDelayBetweenEmails(parseInt(e.target.value) || 0)}
                            className="w-12 px-2 py-1 border border-gray-200 rounded text-sm text-center text-gray-700"
                            min={0}
                            placeholder="00"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Hourly Limit</span>
                        <input
                            type="number"
                            value={hourlyLimit}
                            onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 0)}
                            className="w-12 px-2 py-1 border border-gray-200 rounded text-sm text-center text-gray-700"
                            min={0}
                            placeholder="00"
                        />
                    </div>
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-3 border-b border-gray-100">
                        {attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm">
                                <FileText size={16} className="text-gray-500" />
                                <span className="text-gray-700">{file.name}</span>
                                <span className="text-gray-400 text-xs">({formatFileSize(file.size)})</span>
                                <button onClick={() => removeAttachment(index)} className="text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rich Text Editor */}
                <RichTextEditor value={body} onChange={setBody} />
            </div>
        </div>
    );
}

function EmailRow({
    email,
    showSentAt: _showSentAt,
    onClick,
    isStarred,
    onToggleStar
}: {
    email: Email;
    showSentAt: boolean;
    onClick: () => void;
    isStarred: boolean;
    onToggleStar: (e: React.MouseEvent) => void;
}) {
    // Strip HTML tags for preview
    const stripHtml = (html: string) => {
        return html
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/p>/gi, ' ')
            .replace(/<\/div>/gi, ' ')
            .replace(/<\/li>/gi, ' ')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const bodyPreview = stripHtml(email.body || '').substring(0, 60);

    const statusBadge = email.status === 'sent'
        ? 'Sent'
        : email.status === 'failed'
            ? 'Failed'
            : 'Scheduled';

    const badgeColors = email.status === 'sent'
        ? 'bg-green-100 text-green-700'
        : email.status === 'failed'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700';

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        >
            {/* Recipient */}
            <div className="flex items-center gap-3 w-48 shrink-0">
                <span className="text-sm text-gray-700">To: {email.recipientEmail.split('@')[0]}</span>
            </div>

            {/* Status Badge */}
            <div className="w-24 shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${badgeColors}`}>
                    {statusBadge}
                </span>
            </div>

            {/* Subject & Preview */}
            <div className="flex-1 min-w-0 truncate">
                <span className="text-sm font-medium text-gray-900">{email.subject}</span>
                <span className="text-sm text-gray-500"> - {bodyPreview}...</span>
            </div>

            {/* Star */}
            <button
                onClick={onToggleStar}
                className={`p-1 rounded hover:bg-gray-100 shrink-0 ${isStarred ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
            >
                <Star size={16} fill={isStarred ? 'currentColor' : 'none'} />
            </button>
        </div>
    );
}

function EmailList({
    emails,
    isLoading,
    emptyTitle,
    emptyDescription,
    showSentAt = false,
    onEmailSelect,
    searchQuery,
    onRefresh
}: {
    emails: Email[];
    isLoading: boolean;
    emptyTitle: string;
    emptyDescription: string;
    showSentAt?: boolean;
    onEmailSelect: (email: Email) => void;
    searchQuery: string;
    onRefresh: () => void;
}) {
    const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set());
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    const toggleStar = (e: React.MouseEvent, emailId: string) => {
        e.stopPropagation();
        setStarredEmails(prev => {
            const newSet = new Set(prev);
            if (newSet.has(emailId)) {
                newSet.delete(emailId);
            } else {
                newSet.add(emailId);
            }
            return newSet;
        });
    };

    const filteredEmails = emails.filter(email => {
        if (!localSearchQuery) return true;
        const query = localSearchQuery.toLowerCase();
        return (
            email.recipientEmail.toLowerCase().includes(query) ||
            email.subject.toLowerCase().includes(query) ||
            email.body?.toLowerCase().includes(query)
        );
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                    <SearchBar value={localSearchQuery} onChange={setLocalSearchQuery} onRefresh={onRefresh} />
                </div>
                <div className="text-center py-12">
                    <div className="w-7 h-7 border-3 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 text-sm mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <SearchBar value={localSearchQuery} onChange={setLocalSearchQuery} onRefresh={onRefresh} />
            </div>

            {filteredEmails.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-base font-medium text-gray-600 mb-1">{emptyTitle}</h3>
                    <p className="text-sm text-gray-400">{emptyDescription}</p>
                </div>
            ) : (
                <div>
                    {filteredEmails.map((email) => (
                        <EmailRow
                            key={email.id}
                            email={email}
                            showSentAt={showSentAt}
                            onClick={() => onEmailSelect(email)}
                            isStarred={starredEmails.has(email.id)}
                            onToggleStar={(e) => toggleStar(e, email.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function DashboardLayout() {
    const [showCompose, setShowCompose] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [counts, setCounts] = useState<EmailCounts>({ scheduled: 0, sent: 0 });
    const [searchQuery, _setSearchQuery] = useState('');

    const fetchCounts = useCallback(async () => {
        try {
            const [scheduledRes, sentRes] = await Promise.all([
                emailApi.getScheduled(),
                emailApi.getSent()
            ]);
            setCounts({
                scheduled: scheduledRes.emails.length,
                sent: sentRes.emails.length
            });
        } catch (error) {
            console.error('Failed to fetch counts:', error);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
        const handleUpdate = () => fetchCounts();
        window.addEventListener('emails-updated', handleUpdate);
        const interval = setInterval(fetchCounts, 5000);
        return () => {
            window.removeEventListener('emails-updated', handleUpdate);
            clearInterval(interval);
        };
    }, [fetchCounts]);

    const handleComposeSuccess = () => {
        window.dispatchEvent(new CustomEvent('emails-updated'));
    };

    const handleEmailSelect = (email: Email) => {
        setSelectedEmail(email);
    };

    // Show compose view
    if (showCompose) {
        return (
            <div className="flex min-h-screen font-sans">
                <Sidebar onCompose={() => { }} counts={counts} />
                <ComposeView onBack={() => setShowCompose(false)} onSuccess={handleComposeSuccess} />
            </div>
        );
    }

    // Show email detail view
    if (selectedEmail) {
        return (
            <div className="flex min-h-screen font-sans">
                <Sidebar onCompose={() => setShowCompose(true)} counts={counts} />
                <EmailDetailView email={selectedEmail} onBack={() => setSelectedEmail(null)} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen font-sans">
            <Sidebar onCompose={() => setShowCompose(true)} counts={counts} />
            <div className="flex-1 flex flex-col bg-gray-50">
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet context={{ onEmailSelect: handleEmailSelect, searchQuery }} />
                </main>
            </div>
        </div>
    );
}

export function ScheduledEmailsPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { onEmailSelect, searchQuery } = useOutletContext<OutletContextType>();

    const fetchEmails = useCallback(async () => {
        try {
            const response = await emailApi.getScheduled();
            setEmails(response.emails);
        } catch (error) {
            console.error('Failed to fetch scheduled emails:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmails();
        const handleUpdate = () => fetchEmails();
        window.addEventListener('emails-updated', handleUpdate);
        const interval = setInterval(fetchEmails, 5000);
        return () => {
            window.removeEventListener('emails-updated', handleUpdate);
            clearInterval(interval);
        };
    }, [fetchEmails]);

    return (
        <EmailList
            emails={emails}
            isLoading={isLoading}
            emptyTitle="No scheduled emails"
            emptyDescription="Schedule your first email campaign to get started"
            onEmailSelect={onEmailSelect}
            searchQuery={searchQuery}
            onRefresh={fetchEmails}
        />
    );
}

export function SentEmailsPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { onEmailSelect, searchQuery } = useOutletContext<OutletContextType>();

    const fetchEmails = useCallback(async () => {
        try {
            const response = await emailApi.getSent();
            setEmails(response.emails);
        } catch (error) {
            console.error('Failed to fetch sent emails:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmails();
        const handleUpdate = () => fetchEmails();
        window.addEventListener('emails-updated', handleUpdate);
        const interval = setInterval(fetchEmails, 5000);
        return () => {
            window.removeEventListener('emails-updated', handleUpdate);
            clearInterval(interval);
        };
    }, [fetchEmails]);

    return (
        <EmailList
            emails={emails}
            isLoading={isLoading}
            emptyTitle="No sent emails"
            emptyDescription="Sent emails will appear here once they've been delivered"
            showSentAt
            onEmailSelect={onEmailSelect}
            searchQuery={searchQuery}
            onRefresh={fetchEmails}
        />
    );
}
