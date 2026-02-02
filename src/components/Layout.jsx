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
    X
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
    const [todayDials, setTodayDials] = useState(0);
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Fetch today's dial count and subscribe to real-time updates
    useEffect(() => {
        let mounted = true;

        async function fetchToday() {
            try {
                const data = await callLogsApi.getTodayStats();
                if (!mounted) return;
                setTodayDials(data.total_calls || 0);
            } catch (err) {
                console.error('Failed to fetch today stats', err);
            }
        }

        fetchToday();

        const onNewCall = async () => {
            // When a new call log is created, refetch to get accurate unique lead count
            try {
                const data = await callLogsApi.getTodayStats();
                setTodayDials(data.total_calls || 0);
            } catch (err) {
                console.error('Failed to fetch today stats', err);
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

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-logo">
                    <Zap size={24} style={{ color: 'var(--primary-400)' }} />
                    <span>Hayvin</span>
                </div>
                <button
                    className="menu-toggle"
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Backdrop Overlay */}
            {isMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)} />
            )}

            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <Zap size={28} strokeWidth={2.5} className="text-primary" style={{ color: 'var(--primary-400)' }} />
                    <span>Hayvin CRM</span>
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
                        <strong style={{ color: 'var(--text-primary)' }}>{todayDials}</strong> Dials Today
                    </div>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

