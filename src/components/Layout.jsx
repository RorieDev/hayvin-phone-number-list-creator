import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Search,
    Megaphone,
    Phone,
    Zap,
    Menu,
    X,
    Edit2,
    Save
} from 'lucide-react';
import { socketService } from '../lib/socket';
import { callLogsApi } from '../lib/api';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scraper', label: 'Scraper', icon: Search },
    { path: '/leads', label: 'Leads', icon: Users },
    { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { path: '/call-logs', label: 'Call Logs', icon: Phone },
];

export default function Layout({ children }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dialsInSet, setDialsInSet] = useState(0);
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Fetch dial count for the current set and subscribe to real-time updates
    useEffect(() => {
        let mounted = true;

        async function fetchToday() {
            try {
                const data = await callLogsApi.getSetStats();
                if (!mounted) return;
                setDialsInSet(data.total_calls || 0);
            } catch (err) {
                console.error('Failed to fetch set stats', err);
            }
        }

        fetchToday();

        const onNewCall = async () => {
            // When a new call log is created, refetch to get accurate unique lead count
            try {
                const data = await callLogsApi.getSetStats();
                setDialsInSet(data.total_calls || 0);
            } catch (err) {
                console.error('Failed to fetch set stats', err);
            }
        };

        socketService.onCallLogCreated(onNewCall);

        return () => {
            mounted = false;
            socketService.off('callLog:created');
        };
    }, []);

    // Close menu when clicking outside (on overlay)
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const [openingScript, setOpeningScript] = useState(
        localStorage.getItem('opening_script') ||
        "Hi, it's Rorie here, am I speaking to the owner of [Business Name]? Great, have you ever thought of using voice AI to answer your calls and sell your services?"
    );
    const [isEditingScript, setIsEditingScript] = useState(false);
    const [tempScript, setTempScript] = useState(openingScript);

    const handleSaveScript = () => {
        setOpeningScript(tempScript);
        localStorage.setItem('opening_script', tempScript);
        setIsEditingScript(false);
    };

    return (
        <div className={`layout ${isMenuOpen ? 'menu-open' : ''}`}>
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="sidebar-logo" style={{ marginBottom: 0 }}>
                    <Zap size={24} fill="var(--primary-400)" stroke="var(--primary-400)" />
                    <span>Hayvin</span>
                </div>
                <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Backdrop Overlay */}
            {isMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <Zap size={28} fill="var(--primary-400)" stroke="var(--primary-400)" />
                    <span>Hayvin CRM</span>
                </div>

                <div className="sidebar-stats">
                    <div className="sidebar-stat-item">
                        <div className="sidebar-stat-value">{dialsInSet}</div>
                        <div className="sidebar-stat-label">Dials in set</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Opening Line Script */}
                <div className="sidebar-script" style={{
                    margin: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    background: 'rgba(20, 184, 166, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--primary-400)',
                    position: 'relative'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-2)'
                    }}>
                        <div style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 600,
                            color: 'var(--primary-400)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            📞 Opening Line
                        </div>
                        <button
                            onClick={() => {
                                if (isEditingScript) {
                                    handleSaveScript();
                                } else {
                                    setTempScript(openingScript);
                                    setIsEditingScript(true);
                                }
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color var(--transition-fast)'
                            }}
                            className="hover-text-primary"
                        >
                            {isEditingScript ? <Save size={14} /> : <Edit2 size={14} />}
                        </button>
                    </div>

                    {isEditingScript ? (
                        <textarea
                            value={tempScript}
                            onChange={(e) => setTempScript(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--primary-400)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-sm)',
                                fontFamily: 'inherit',
                                padding: 'var(--space-2)',
                                minHeight: '100px',
                                outline: 'none',
                                resize: 'none'
                            }}
                            autoFocus
                        />
                    ) : (
                        <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            margin: 0,
                            whiteSpace: 'pre-wrap'
                        }}>
                            {openingScript.split(/(\[Business Name\])/g).map((part, i) =>
                                part === '[Business Name]' ? (
                                    <strong key={i} style={{ color: 'var(--primary-400)' }}>{part}</strong>
                                ) : part
                            )}
                        </p>
                    )}
                </div>

                <div className="sidebar-footer" style={{
                    marginTop: 'auto',
                    paddingTop: 'var(--space-6)',
                    borderTop: '1px solid var(--border-color-light)'
                }}>
                    <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-muted)',
                        textAlign: 'center'
                    }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{dialsInSet}</strong> Dials in this set of leads
                    </div>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

