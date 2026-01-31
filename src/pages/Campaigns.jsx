import { useState, useEffect } from 'react';
import {
    Plus,
    Megaphone,
    Target,
    Calendar,
    Users,
    MoreVertical,
    Edit2,
    Trash2,
    Play,
    Pause,
    CheckCircle
} from 'lucide-react';
import { campaignsApi } from '../lib/api';
import { socketService } from '../lib/socket';

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const fetchCampaigns = async () => {
        try {
            const data = await campaignsApi.getAll();
            setCampaigns(data);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();

        socketService.onCampaignCreated((campaign) => {
            setCampaigns(prev => [campaign, ...prev]);
        });

        socketService.onCampaignUpdated((campaign) => {
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? campaign : c));
        });

        socketService.onCampaignDeleted(({ id }) => {
            setCampaigns(prev => prev.filter(c => c.id !== id));
        });

        return () => {
            socketService.off('campaign:created');
            socketService.off('campaign:updated');
            socketService.off('campaign:deleted');
        };
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;

        try {
            await campaignsApi.delete(id);
            setActiveDropdown(null);
        } catch (error) {
            console.error('Failed to delete campaign:', error);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await campaignsApi.update(id, { status: newStatus });
            setActiveDropdown(null);
        } catch (error) {
            console.error('Failed to update campaign:', error);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <Play size={14} style={{ color: 'var(--success-500)' }} />;
            case 'paused': return <Pause size={14} style={{ color: 'var(--warning-500)' }} />;
            case 'completed': return <CheckCircle size={14} style={{ color: 'var(--primary-400)' }} />;
            default: return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'var(--success-500)';
            case 'paused': return 'var(--warning-500)';
            case 'completed': return 'var(--primary-400)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Campaigns</h1>
                    <p className="text-muted">{campaigns.length} campaigns</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingCampaign(null);
                        setShowModal(true);
                    }}
                >
                    <Plus size={18} />
                    New Campaign
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: '40vh' }}>
                    <div className="spinner" style={{ width: 40, height: 40 }}></div>
                </div>
            ) : campaigns.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Megaphone className="empty-state-icon" />
                        <h3 className="empty-state-title">No campaigns yet</h3>
                        <p className="empty-state-description">
                            Create your first campaign to organize your calling efforts
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={18} />
                            Create Campaign
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2">
                    {campaigns.map((campaign) => (
                        <div key={campaign.id} className="card" style={{ position: 'relative' }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgba(20, 184, 166, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Megaphone size={20} style={{ color: 'var(--primary-400)' }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{campaign.name}</h3>
                                        <div className="flex items-center gap-1 text-xs" style={{ color: getStatusColor(campaign.status) }}>
                                            {getStatusIcon(campaign.status)}
                                            <span style={{ textTransform: 'capitalize' }}>{campaign.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => setActiveDropdown(activeDropdown === campaign.id ? null : campaign.id)}
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {activeDropdown === campaign.id && (
                                        <div style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '100%',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            boxShadow: 'var(--shadow-xl)',
                                            zIndex: 50,
                                            minWidth: 160,
                                            overflow: 'hidden'
                                        }}>
                                            <button
                                                className="flex items-center gap-2 w-full"
                                                style={{
                                                    padding: 'var(--space-3) var(--space-4)',
                                                    color: 'var(--text-primary)',
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontSize: 'var(--font-size-sm)'
                                                }}
                                                onClick={() => {
                                                    setEditingCampaign(campaign);
                                                    setShowModal(true);
                                                    setActiveDropdown(null);
                                                }}
                                                onMouseOver={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                                                onMouseOut={(e) => e.target.style.background = 'none'}
                                            >
                                                <Edit2 size={16} />
                                                Edit
                                            </button>

                                            {campaign.status === 'active' && (
                                                <button
                                                    className="flex items-center gap-2 w-full"
                                                    style={{
                                                        padding: 'var(--space-3) var(--space-4)',
                                                        color: 'var(--warning-500)',
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: 'var(--font-size-sm)'
                                                    }}
                                                    onClick={() => handleStatusChange(campaign.id, 'paused')}
                                                    onMouseOver={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.1)'}
                                                    onMouseOut={(e) => e.target.style.background = 'none'}
                                                >
                                                    <Pause size={16} />
                                                    Pause
                                                </button>
                                            )}

                                            {campaign.status === 'paused' && (
                                                <button
                                                    className="flex items-center gap-2 w-full"
                                                    style={{
                                                        padding: 'var(--space-3) var(--space-4)',
                                                        color: 'var(--success-500)',
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: 'var(--font-size-sm)'
                                                    }}
                                                    onClick={() => handleStatusChange(campaign.id, 'active')}
                                                    onMouseOver={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.1)'}
                                                    onMouseOut={(e) => e.target.style.background = 'none'}
                                                >
                                                    <Play size={16} />
                                                    Resume
                                                </button>
                                            )}

                                            <button
                                                className="flex items-center gap-2 w-full"
                                                style={{
                                                    padding: 'var(--space-3) var(--space-4)',
                                                    color: 'var(--error-500)',
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontSize: 'var(--font-size-sm)',
                                                    borderTop: '1px solid var(--border-color-light)'
                                                }}
                                                onClick={() => handleDelete(campaign.id)}
                                                onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                onMouseOut={(e) => e.target.style.background = 'none'}
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {campaign.description && (
                                <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                                    {campaign.description}
                                </p>
                            )}

                            <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)' }}>
                                <div className="flex items-center gap-2 text-sm">
                                    <Target size={16} className="text-muted" />
                                    <span>{campaign.daily_dial_target} dials/day</span>
                                </div>

                                {campaign.start_date && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size={16} className="text-muted" />
                                        <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Click outside to close dropdown */}
            {activeDropdown && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setActiveDropdown(null)}
                />
            )}

            {/* Campaign Modal */}
            {showModal && (
                <CampaignModal
                    campaign={editingCampaign}
                    onClose={() => {
                        setShowModal(false);
                        setEditingCampaign(null);
                    }}
                />
            )}
        </div>
    );
}

function CampaignModal({ campaign, onClose }) {
    const [name, setName] = useState(campaign?.name || '');
    const [description, setDescription] = useState(campaign?.description || '');
    const [dailyDialTarget, setDailyDialTarget] = useState(campaign?.daily_dial_target || 100);
    const [startDate, setStartDate] = useState(campaign?.start_date?.split('T')[0] || '');
    const [endDate, setEndDate] = useState(campaign?.end_date?.split('T')[0] || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) return;

        setSaving(true);
        try {
            const data = {
                name: name.trim(),
                description: description.trim(),
                daily_dial_target: dailyDialTarget,
                start_date: startDate || null,
                end_date: endDate || null
            };

            if (campaign) {
                await campaignsApi.update(campaign.id, data);
            } else {
                await campaignsApi.create(data);
            }

            onClose();
        } catch (error) {
            console.error('Failed to save campaign:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {campaign ? 'Edit Campaign' : 'New Campaign'}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Campaign Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Q1 Plumber Outreach"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Campaign goals and notes..."
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Daily Dial Target</label>
                            <input
                                type="number"
                                className="form-input"
                                min={1}
                                max={500}
                                value={dailyDialTarget}
                                onChange={(e) => setDailyDialTarget(parseInt(e.target.value) || 100)}
                            />
                        </div>

                        <div className="grid grid-cols-2" style={{ gap: 'var(--space-4)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
                            {saving ? 'Saving...' : campaign ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
