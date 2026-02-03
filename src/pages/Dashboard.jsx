import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Phone,
    Target,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight
} from 'lucide-react';
import { leadsApi, callLogsApi, campaignsApi } from '../lib/api';
import { socketService } from '../lib/socket';

export default function Dashboard() {
    const [leadStats, setLeadStats] = useState(null);
    const [setStats, setSetStats] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [recentCalls, setRecentCalls] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [leadsData, todayData, campaignsData, callsData] = await Promise.all([
                leadsApi.getStats(),
                callLogsApi.getSetStats(),
                campaignsApi.getAll(),
                callLogsApi.getAll({ limit: 5 })
            ]);

            setLeadStats(leadsData);
            setSetStats(todayData);
            setCampaigns(campaignsData);
            setRecentCalls(callsData.callLogs || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to relevant rooms
        socketService.subscribe('leads');
        socketService.subscribe('call-logs');
        socketService.subscribe('campaigns');

        // Real-time updates
        socketService.onLeadUpdated(() => fetchData());
        socketService.onCallLogCreated(() => fetchData());
        socketService.onCallLogDeleted(() => fetchData());
        socketService.onLeadBulkCreated(() => fetchData());
        socketService.onCampaignCreated(() => fetchData());
        socketService.onCampaignUpdated(() => fetchData());
        socketService.onCampaignDeleted(() => fetchData());

        return () => {
            socketService.off('lead:updated');
            socketService.off('callLog:created');
            socketService.off('callLog:deleted');
            socketService.off('lead:bulk-created');
            socketService.off('campaign:created');
            socketService.off('campaign:updated');
            socketService.off('campaign:deleted');
        };
    }, []);

    const DIAL_GOAL = 100;
    const percent = setStats ? Math.round((setStats.total_calls / DIAL_GOAL) * 100) : 0;
    const dialProgress = percent;

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '50vh' }}>
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--space-8)' }}>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="stat-value">{leadStats?.total || 0}</div>
                            <div className="stat-label">Total Leads</div>
                        </div>
                        <div className="stat-icon">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
                                {percent}
                                <span style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-muted)' }}>%</span>
                            </div>
                            <div className="stat-label">Calls in this set</div>
                        </div>
                        <div className="stat-icon">
                            <Phone size={24} />
                        </div>
                    </div>
                    <div className="progress-bar" style={{ marginTop: 'var(--space-3)' }}>
                        <div className="progress-fill" style={{ width: `${Math.min(dialProgress, 100)}%` }}></div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="stat-value" style={{ color: 'var(--warning-500)' }}>
                                {leadStats?.callback || 0}
                            </div>
                            <div className="stat-label">Demos booked</div>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-2">
                {/* Recent Activity */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Calls</h3>
                        <Link to="/call-logs" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {recentCalls.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
                            <Phone className="empty-state-icon" size={40} style={{ margin: '0 auto var(--space-3)' }} />
                            <p className="text-muted">No calls logged yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recentCalls.map((call) => (
                                <div
                                    key={call.id}
                                    className="flex items-center justify-between"
                                    style={{
                                        padding: 'var(--space-3)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 'var(--radius-full)',
                                            background: call.call_outcome === 'callback_scheduled' ? 'rgba(245, 158, 11, 0.2)' :
                                                call.call_outcome === 'answered' ? 'rgba(20, 184, 166, 0.2)' :
                                                    'rgba(100, 116, 139, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {call.call_outcome === 'callback_scheduled' ? <Clock size={16} style={{ color: 'var(--warning-500)' }} /> :
                                                call.call_outcome === 'not_interested' ? <XCircle size={16} style={{ color: 'var(--error-500)' }} /> :
                                                    <Phone size={16} style={{ color: 'var(--text-muted)' }} />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{call.leads?.business_name || 'Unknown'}</div>
                                            <div className="text-xs text-muted">{call.call_outcome.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted">
                                        {new Date(call.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lead Status Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Lead Status Breakdown</h3>
                        <Link to="/leads" className="btn btn-ghost btn-sm">
                            Manage <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="flex flex-col gap-4">
                        {[
                            { status: 'new', label: 'Open', color: 'var(--info-500)', icon: AlertCircle },
                            { status: 'contacted', label: 'Contacted', color: 'var(--warning-500)', icon: Phone },
                            { status: 'not_interested', label: 'Not Interested', color: 'var(--error-500)', icon: XCircle },
                            { status: 'callback', label: 'Demo booked', color: '#a855f7', icon: Clock },
                            { status: 'need_closing', label: 'Needs Closing', color: 'var(--success-500)', icon: Target },
                            { status: 'closed_won', label: 'Closed Won', color: 'var(--success-600)', icon: CheckCircle },
                            { status: 'closed_lost', label: 'Closed Lost', color: 'var(--error-500)', icon: XCircle },
                        ].map(({ status, label, color, icon: Icon }) => {
                            const count = leadStats?.[status] || 0;
                            const percentage = leadStats?.total ? (count / leadStats.total * 100).toFixed(1) : 0;

                            return (
                                <div key={status}>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} style={{ color }} />
                                            <span className="text-sm">{label}</span>
                                        </div>
                                        <span className="text-sm font-medium">{count}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${percentage}%`,
                                                background: color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Active Campaigns */}
            {campaigns.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                    <div className="card-header">
                        <h3 className="card-title">Active Campaigns</h3>
                        <Link to="/campaigns" className="btn btn-ghost btn-sm">
                            Manage <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-3">
                        {campaigns.filter(c => c.status === 'active').slice(0, 3).map((campaign) => (
                            <div
                                key={campaign.id}
                                style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-color-light)'
                                }}
                            >
                                <h4 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                                    {campaign.name}
                                </h4>
                                <p className="text-sm text-muted truncate" style={{ marginBottom: 'var(--space-3)' }}>
                                    {campaign.description || 'No description'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted">
                                    <Target size={14} />
                                    <span>{campaign.daily_dial_target} dials/day</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
