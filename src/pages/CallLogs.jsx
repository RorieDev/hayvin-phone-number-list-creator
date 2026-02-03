import { useState, useEffect } from 'react';
import {
    Phone,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Voicemail,
    PhoneMissed,
    PhoneOff
} from 'lucide-react';
import { callLogsApi, campaignsApi } from '../lib/api';
import { socketService } from '../lib/socket';

const OUTCOME_CONFIG = {
    not_yet: { icon: Clock, color: 'var(--text-muted)', label: 'Not Yet' },
    answered: { icon: Phone, color: 'var(--success-500)', label: 'Answered' },
    voicemail: { icon: Voicemail, color: 'var(--warning-500)', label: 'Voicemail' },
    no_answer: { icon: PhoneMissed, color: 'var(--text-muted)', label: 'No Answer' },
    busy: { icon: PhoneOff, color: 'var(--warning-500)', label: 'Busy' },
    callback_scheduled: { icon: Clock, color: '#a855f7', label: 'Callback Scheduled' },
    qualified: { icon: CheckCircle, color: 'var(--success-500)', label: 'Qualified' },
    not_interested: { icon: XCircle, color: 'var(--error-500)', label: 'Not Interested' },
    wrong_number: { icon: PhoneOff, color: 'var(--error-500)', label: 'Wrong Number' },
    do_not_call: { icon: XCircle, color: 'var(--error-500)', label: 'Do Not Call' }
};

export default function CallLogs() {
    const [callLogs, setCallLogs] = useState([]);
    const [setStats, setSetStats] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedCampaign) params.campaign_id = selectedCampaign;
            if (selectedDate) params.date = selectedDate;

            const [logsData, statsData, campaignsData] = await Promise.all([
                callLogsApi.getAll(params),
                callLogsApi.getSetStats(selectedCampaign || null),
                campaignsApi.getAll()
            ]);

            setCallLogs(logsData.callLogs || []);
            setSetStats(statsData);
            setCampaigns(campaignsData);
        } catch (error) {
            console.error('Failed to fetch call logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCampaign, selectedDate]);

    useEffect(() => {
        socketService.onCallLogCreated((callLog) => {
            setCallLogs(prev => [callLog, ...prev]);
            fetchData(); // Refresh stats
        });

        return () => {
            socketService.off('callLog:created');
        };
    }, []);

    const DIAL_GOAL = 100;
    const percent = setStats ? Math.round((setStats.total_calls / DIAL_GOAL) * 100) : 0;
    const dialProgress = percent;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Call Logs</h1>
                    <p className="text-muted">Track your calling activity</p>
                </div>
            </div>

            {/* Set Stats */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                    <Calendar size={18} style={{ display: 'inline', marginRight: 'var(--space-2)' }} />
                    Set Progress
                </h3>

                <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-4)' }}>
                    <div className="stat-value" style={{ fontSize: 'var(--font-size-4xl)' }}>
                        {percent}
                        <span style={{
                            fontSize: 'var(--font-size-xl)',
                            color: 'var(--text-muted)',
                            fontWeight: 400
                        }}>
                            %
                        </span>
                    </div>
                    <div>
                        <div className="text-sm font-medium">Calls Made</div>
                        <div className="text-xs text-muted">
                            {Math.max(0, 100 - (setStats?.total_calls || 0))} remaining
                        </div>
                    </div>
                </div>

                <div className="progress-bar" style={{ height: 12 }}>
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.min(dialProgress, 100)}%` }}
                    ></div>
                </div>

                {/* Outcome breakdown */}
                {setStats && (
                    <div className="grid grid-cols-4" style={{ marginTop: 'var(--space-6)', gap: 'var(--space-3)' }}>
                        {Object.entries(setStats.outcomes || {})
                            .filter(([_, count]) => count > 0)
                            .map(([outcome, count]) => {
                                const config = OUTCOME_CONFIG[outcome];
                                if (!config) return null;
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={outcome}
                                        style={{
                                            padding: 'var(--space-3)',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)'
                                        }}
                                    >
                                        <Icon size={16} style={{ color: config.color }} />
                                        <div>
                                            <div className="text-sm font-medium">{count}</div>
                                            <div className="text-xs text-muted">{config.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
                <div className="flex items-center gap-4">
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <select
                            className="form-select"
                            value={selectedCampaign}
                            onChange={(e) => setSelectedCampaign(e.target.value)}
                        >
                            <option value="">All Campaigns</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {(selectedCampaign || selectedDate) && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                                setSelectedCampaign('');
                                setSelectedDate('');
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Call Logs List */}
            {loading ? (
                <div className="flex items-center justify-center" style={{ height: '40vh' }}>
                    <div className="spinner" style={{ width: 40, height: 40 }}></div>
                </div>
            ) : callLogs.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Phone className="empty-state-icon" />
                        <h3 className="empty-state-title">No calls logged yet</h3>
                        <p className="empty-state-description">
                            Start making calls from the Leads page to see your activity here
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-container" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Business</th>
                                    <th>Phone</th>
                                    <th>Outcome</th>
                                    <th>Notes</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {callLogs.map((log) => {
                                    const config = OUTCOME_CONFIG[log.call_outcome] || {};
                                    const Icon = config.icon || Phone;

                                    return (
                                        <tr key={log.id}>
                                            <td>
                                                <span className="font-medium">
                                                    {log.leads?.business_name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-muted">
                                                    {log.leads?.phone_number || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Icon size={16} style={{ color: config.color }} />
                                                    <span style={{ color: config.color }}>
                                                        {config.label || log.call_outcome}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-sm text-muted truncate" style={{ maxWidth: 200, display: 'block' }}>
                                                    {log.notes || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-sm text-muted">
                                                    {new Date(log.called_at).toLocaleDateString()}
                                                    <br />
                                                    <span className="text-xs">
                                                        {new Date(log.called_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
