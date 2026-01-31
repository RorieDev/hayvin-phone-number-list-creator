import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Phone,
    ExternalLink,
    Star,
    MapPin,
    MoreVertical,
    Trash2,
    ClipboardList,
    Mail,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import { leadsApi, callLogsApi } from '../lib/api';
import { socketService } from '../lib/socket';
import LogCallModal from '../components/LogCallModal';
import LeadInsightPanel from '../components/LeadInsightPanel';
import LeadScoreBadge from '../components/LeadScoreBadge';
import { useResizableColumns, ResizableHeader } from '../hooks/useResizableColumns';
import { scoreLead } from '../lib/leadScoring';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'callback', label: 'Callback' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'not_interested', label: 'Not Interested' },
];

// Default column widths
const DEFAULT_COLUMN_WIDTHS = {
    phone: 120,
    email: 90,
    score: 80,
    business: 220,
    rating: 90,
    status: 110,
    actions: 90
};

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [total, setTotal] = useState(0);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showCallModal, setShowCallModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [panelLead, setPanelLead] = useState(null);

    // Resizable columns hook
    const { columnWidths, handleResizeStart, resetWidths } = useResizableColumns(
        'leads-column-widths',
        DEFAULT_COLUMN_WIDTHS,
        60 // minimum width
    );

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (statusFilter) params.status = statusFilter;

            const data = await leadsApi.getAll(params);
            let fetchedLeads = data.leads || [];

            // Sort by score descending
            fetchedLeads = fetchedLeads.sort((a, b) => {
                const scoreA = scoreLead(a).score;
                const scoreB = scoreLead(b).score;
                return scoreB - scoreA;
            });

            setLeads(fetchedLeads);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [statusFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchLeads();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    useEffect(() => {
        socketService.onLeadUpdated((lead) => {
            setLeads(prev => {
                const updated = prev.map(l => l.id === lead.id ? lead : l);
                return updated.sort((a, b) => scoreLead(b).score - scoreLead(a).score);
            });
            if (panelLead?.id === lead.id) {
                setPanelLead(lead);
            }
        });

        socketService.onLeadDeleted(({ id }) => {
            setLeads(prev => prev.filter(l => l.id !== id));
            if (panelLead?.id === id) {
                setPanelLead(null);
            }
        });

        socketService.onLeadBulkCreated(() => {
            fetchLeads();
        });

        return () => {
            socketService.off('lead:updated');
            socketService.off('lead:deleted');
            socketService.off('lead:bulk-created');
        };
    }, [panelLead?.id]);

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await leadsApi.update(leadId, { status: newStatus });
            setActiveDropdown(null);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async (leadId) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;

        try {
            await leadsApi.delete(leadId);
            setActiveDropdown(null);
        } catch (error) {
            console.error('Failed to delete lead:', error);
        }
    };

    const handleLogCall = (lead) => {
        setSelectedLead(lead);
        setShowCallModal(true);
        setActiveDropdown(null);
    };

    const handleRowClick = (lead, e) => {
        if (e.target.closest('button') || e.target.closest('a')) {
            return;
        }
        setPanelLead(lead);
    };

    const handleLeadUpdate = async (leadId, updates) => {
        try {
            await leadsApi.update(leadId, updates);
        } catch (error) {
            console.error('Failed to update lead:', error);
            throw error;
        }
    };

    return (
        <div className={`leads-layout ${panelLead ? 'leads-layout--panel-open' : ''}`}>
            <div className="leads-main" style={{ flex: 1 }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Leads</h1>
                        <p className="text-muted">{total} total leads</p>
                    </div>
                    <button
                        className="btn btn-ghost btn-sm hidden-mobile"
                        onClick={resetWidths}
                        title="Reset column widths"
                    >
                        <RotateCcw size={14} />
                        Reset Columns
                    </button>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
                    <div className="flex items-center gap-4">
                        <div className="search-input-wrapper" style={{ flex: 1 }}>
                            <Search size={18} />
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-muted" />
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ minWidth: 150 }}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Leads Table */}
                {loading ? (
                    <div className="flex items-center justify-center" style={{ height: '40vh' }}>
                        <div className="spinner" style={{ width: 40, height: 40 }}></div>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <Search className="empty-state-icon" />
                            <h3 className="empty-state-title">No leads found</h3>
                            <p className="empty-state-description">
                                {searchQuery || statusFilter
                                    ? 'Try adjusting your filters'
                                    : 'Start by scraping some leads from Google Places'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table table-resizable">
                            <thead>
                                <tr>
                                    <ResizableHeader
                                        columnId="phone"
                                        width={columnWidths.phone}
                                        onResizeStart={handleResizeStart}
                                    >
                                        Number
                                    </ResizableHeader>
                                    <ResizableHeader
                                        columnId="email"
                                        width={columnWidths.email}
                                        onResizeStart={handleResizeStart}
                                        className="text-center"
                                        style={{ paddingLeft: 0, paddingRight: 0 }}
                                    >
                                        <div style={{ width: '100%', textAlign: 'center' }}>Email</div>
                                    </ResizableHeader>
                                    <ResizableHeader
                                        columnId="score"
                                        width={columnWidths.score}
                                        onResizeStart={handleResizeStart}
                                    >
                                        Score
                                    </ResizableHeader>
                                    <ResizableHeader
                                        columnId="business"
                                        width={columnWidths.business}
                                        onResizeStart={handleResizeStart}
                                    >
                                        Business
                                    </ResizableHeader>
                                    <ResizableHeader
                                        columnId="rating"
                                        width={columnWidths.rating}
                                        onResizeStart={handleResizeStart}
                                    >
                                        Rating
                                    </ResizableHeader>
                                    <ResizableHeader
                                        columnId="status"
                                        width={columnWidths.status}
                                        onResizeStart={handleResizeStart}
                                    >
                                        Status
                                    </ResizableHeader>
                                    <th style={{ width: columnWidths.actions, minWidth: columnWidths.actions }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        className={`clickable-row ${panelLead?.id === lead.id ? 'selected' : ''}`}
                                        onClick={(e) => handleRowClick(lead, e)}
                                    >
                                        <td style={{ width: columnWidths.phone, maxWidth: columnWidths.phone }}>
                                            {lead.phone_number ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="hidden-mobile" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.phone_number}</span>
                                                    <a
                                                        href={`tel:${lead.phone_number}`}
                                                        className="mobile-only"
                                                        style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-400)', textDecoration: 'none' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {lead.phone_number.replace(/\s+/g, '').substring(0, 5)}...
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-muted">No phone</span>
                                            )}
                                        </td>
                                        <td style={{ width: columnWidths.email, maxWidth: columnWidths.email, paddingLeft: 0, paddingRight: 0 }}>
                                            <div className="flex items-center justify-center" style={{ width: '100%' }}>
                                                {lead.email ? (
                                                    <a
                                                        href={`mailto:${lead.email}?body=${encodeURIComponent("Hi \n\n\n\n\nCheers Rorie from Hayvin.co.uk")}`}
                                                        className="btn btn-ghost btn-icon"
                                                        style={{ color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title={`Email ${lead.email}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Mail size={18} />
                                                    </a>
                                                ) : (
                                                    <div className="text-muted" title="No email address available" style={{ opacity: 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Mail size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ width: columnWidths.score, maxWidth: columnWidths.score }}>
                                            <LeadScoreBadge lead={lead} showBand={false} compact />
                                        </td>
                                        <td style={{ width: columnWidths.business, maxWidth: columnWidths.business }}>
                                            <div className="flex items-center gap-2">
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div className="font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {lead.business_name}
                                                    </div>
                                                    {lead.website && (
                                                        <a
                                                            href={lead.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs flex items-center gap-1 hidden-mobile"
                                                            style={{ color: 'var(--primary-400)' }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Visit website <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ width: columnWidths.rating, maxWidth: columnWidths.rating }}>
                                            {lead.rating ? (
                                                <div className="flex items-center gap-1">
                                                    <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24', flexShrink: 0 }} />
                                                    <span>{lead.rating}</span>
                                                    <span className="text-muted text-xs">({lead.total_ratings})</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td style={{ width: columnWidths.status, maxWidth: columnWidths.status }}>
                                            <span className={`badge badge-${lead.status}`}>
                                                {lead.status?.replace('_', ' ')}
                                            </span>
                                        </td>

                                        <td style={{ width: columnWidths.actions }}>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleLogCall(lead)}
                                                    title="Log Call"
                                                >
                                                    <ClipboardList size={16} />
                                                </button>
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => setActiveDropdown(activeDropdown === lead.id ? null : lead.id)}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {activeDropdown === lead.id && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            right: 0,
                                                            top: '100%',
                                                            background: 'var(--bg-secondary)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: 'var(--radius-md)',
                                                            boxShadow: 'var(--shadow-xl)',
                                                            zIndex: 50,
                                                            minWidth: 180,
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                padding: 'var(--space-2) var(--space-4)',
                                                                fontSize: 'var(--font-size-xs)',
                                                                color: 'var(--text-muted)',
                                                            }}>
                                                                Change Status
                                                            </div>

                                                            {STATUS_OPTIONS.filter(s => s.value && s.value !== lead.status).map(status => (
                                                                <button
                                                                    key={status.value}
                                                                    className="w-full"
                                                                    style={{
                                                                        padding: 'var(--space-2) var(--space-4)',
                                                                        color: 'var(--text-secondary)',
                                                                        border: 'none',
                                                                        background: 'none',
                                                                        cursor: 'pointer',
                                                                        textAlign: 'left',
                                                                        fontSize: 'var(--font-size-sm)'
                                                                    }}
                                                                    onClick={() => handleStatusChange(lead.id, status.value)}
                                                                    onMouseOver={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                                                                    onMouseOut={(e) => e.target.style.background = 'none'}
                                                                >
                                                                    {status.label}
                                                                </button>
                                                            ))}

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
                                                                onClick={() => handleDelete(lead.id)}
                                                                onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                onMouseOut={(e) => e.target.style.background = 'none'}
                                                            >
                                                                <Trash2 size={16} />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronRight size={16} className="text-muted" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Lead Insight Panel */}
            {panelLead && (
                <>
                    <div
                        className="lead-insight-overlay"
                        onClick={() => setPanelLead(null)}
                    />
                    <LeadInsightPanel
                        lead={panelLead}
                        onClose={() => setPanelLead(null)}
                        onUpdate={handleLeadUpdate}
                        onLogCall={(lead) => {
                            setSelectedLead(lead);
                            setShowCallModal(true);
                        }}
                    />
                </>
            )}

            {/* Log Call Modal */}
            {showCallModal && selectedLead && (
                <LogCallModal
                    lead={selectedLead}
                    onClose={() => {
                        setShowCallModal(false);
                        setSelectedLead(null);
                    }}
                />
            )}

            {/* Click outside to close dropdown */}
            {activeDropdown && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setActiveDropdown(null)}
                />
            )}
        </div>
    );
}
