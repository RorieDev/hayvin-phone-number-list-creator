import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Search,
    Megaphone,
    Phone,
    Zap
} from 'lucide-react';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scraper', label: 'Scraper', icon: Search },
    { path: '/leads', label: 'Leads', icon: Users },
    { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { path: '/call-logs', label: 'Call Logs', icon: Phone },
];

export default function Layout({ children }) {
    const location = useLocation();

    return (
        <div className="app-layout">
            <aside className="sidebar">
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
                        100 Dials/Day Goal
                    </div>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
