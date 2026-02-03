import { useState, useEffect } from 'react';
import {
    Phone,
    X,
    Clock
} from 'lucide-react';
import { callLogsApi } from '../lib/api';

const CALL_OUTCOMES = [
    { value: 'not_yet', label: 'Not Yet', color: 'var(--text-muted)' },
    { value: 'answered', label: 'Answered', color: 'var(--success-500)' },
    { value: 'voicemail', label: 'Left Voicemail', color: 'var(--warning-500)' },
    { value: 'no_answer', label: 'No Answer', color: 'var(--text-muted)' },
    { value: 'busy', label: 'Busy', color: 'var(--warning-500)' },
    { value: 'callback_scheduled', label: 'Demo booked', color: '#a855f7' },
    { value: 'wants_callback', label: 'Wants Callback', color: 'var(--warning-500)' },
    { value: 'sent_number', label: 'Sent Number', color: 'var(--primary-400)' },
    { value: 'need_closing', label: 'Needs Closing', color: 'var(--success-500)' },
    { value: 'closed_won', label: 'Closed Won', color: 'var(--success-600)' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'var(--error-500)' },
    { value: 'not_interested', label: 'Not Interested', color: 'var(--error-500)' },
    { value: 'wrong_number', label: 'Wrong Number', color: 'var(--error-500)' },
    { value: 'do_not_call', label: 'Do Not Call', color: 'var(--error-500)' },
];

export default function LogCallModal({ lead, onClose }) {
    const [outcome, setOutcome] = useState('');
    const [notes, setNotes] = useState('');
    const [scheduledCallback, setScheduledCallback] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!outcome) return;

        setSaving(true);
        try {
            await callLogsApi.create({
                lead_id: lead.id,
                campaign_id: lead.campaign_id,
                call_outcome: outcome,
                notes: notes.trim() || null,
                scheduled_callback: scheduledCallback || null
            });

            onClose();
        } catch (error) {
            console.error('Failed to log call:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal--compact" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(20, 184, 166, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Phone size={20} style={{ color: 'var(--primary-400)' }} />
                        </div>
                        <div>
                            <h2 className="modal-title">Log Call</h2>
                            <p className="text-sm text-muted">{lead.business_name}</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Phone number display */}
                        <div style={{
                            padding: 'var(--space-2)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-2)',
                            textAlign: 'center'
                        }}>
                            <a
                                href={`tel:${lead.phone_number}`}
                                style={{
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 600,
                                    color: 'var(--primary-400)'
                                }}
                            >
                                {lead.phone_number}
                            </a>
                        </div>

                        {/* Outcome Selection */}
                        <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
                            <label className="form-label" style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}>Call Outcome *</label>
                            <div className="grid grid-cols-3" style={{ gap: 'var(--space-1.5)' }}>
                                {CALL_OUTCOMES.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setOutcome(opt.value)}
                                        style={{
                                            padding: 'var(--space-2) var(--space-3)',
                                            background: outcome === opt.value ? 'rgba(20, 184, 166, 0.1)' : 'var(--bg-tertiary)',
                                            border: `1px solid ${outcome === opt.value ? 'var(--primary-500)' : 'var(--border-color)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            color: outcome === opt.value ? opt.color : 'var(--text-secondary)',
                                            fontSize: '11px',
                                            transition: 'all var(--transition-fast)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Callback Scheduling */}
                        {(outcome === 'callback_scheduled' || outcome === 'wants_callback') && (
                            <div className="form-group">
                                <label className="form-label">
                                    <Clock size={14} style={{ display: 'inline', marginRight: 'var(--space-1)' }} />
                                    Schedule Callback
                                </label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={scheduledCallback}
                                    onChange={(e) => setScheduledCallback(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <textarea
                                className="form-textarea"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes about the call..."
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving || !outcome}
                        >
                            {saving ? 'Saving...' : 'Log Call'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
