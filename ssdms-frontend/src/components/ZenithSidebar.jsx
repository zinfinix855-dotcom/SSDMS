import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Search, Hospital, ClipboardList, FileEdit, CheckCircle2,
    SearchCode, MonitorCheck, ShieldCheck, Banknote, Files, Archive,
    Users, History, LogOut, Activity, Settings, ChevronLeft, ChevronRight, Shield
} from 'lucide-react';

const NAV_MAIN = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/search', label: 'Registry Search', icon: Search },
];

const NAV_WORKFLOW = [
    { path: '/stage/Admission', label: 'Admission', icon: Hospital },
    { path: '/stage/Discharge', label: 'Discharge', icon: ClipboardList },
    { path: '/stage/Pre-Approval', label: 'Pre-Approval', icon: FileEdit },
    { path: '/stage/Approval', label: 'Approval', icon: CheckCircle2 },
    { path: '/stage/File Verification', label: 'Verification', icon: SearchCode },
    { path: '/stage/E-Claim', label: 'E-Claiming', icon: MonitorCheck },
    { path: '/stage/E-Claim Verification', label: 'Claim Audit', icon: ShieldCheck },
    { path: '/stage/Finance', label: 'Treasury', icon: Banknote },
    { path: '/stage/Segregation', label: 'Classification', icon: Files },
    { path: '/stage/Indexation', label: 'Archival', icon: Archive },
];

const NAV_ADMIN = [
    { path: '/admin/users', label: 'User Control', icon: Users },
    { path: '/admin/roles', label: 'Access Policy', icon: ShieldCheck },
    { path: '/admin/logs', label: 'System Audit', icon: History },
    { path: '/admin/health', label: 'Core Health', icon: Activity },
];

export default function ZenithSidebar({ collapsed, setCollapsed }) {
    const { user, isAdmin, isModerator, logout } = useAuth();
    const navigate = useNavigate();

    const assignedSections = (() => {
        try { return JSON.parse(user?.assigned_sections || '[]'); } catch { return []; }
    })();

    const filterNav = (items) => items.filter(item => {
        if (isAdmin || isModerator) return true;
        return assignedSections.includes(item.label) || item.path === '/dashboard' || item.path === '/search';
    });

    return (
        <aside className="zenith-sidebar" style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}>
            <div className="p-8 d-flex align-items-center gap-3">
                <div className="logo-box">
                    <Shield size={24} className="text-primary" />
                </div>
                {!collapsed && (
                    <div className="animate-fade-in">
                        <h2 className="m-0" style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>SSDMS</h2>
                        <span className="extra-small text-dim fw-700 tracking-widest">ENTERPRISE</span>
                    </div>
                )}
            </div>

            <nav className="flex-grow-1 px-4 custom-scrollbar overflow-y-auto mt-4">
                <div className="nav-group mb-8">
                    {!collapsed && <label className="px-4 opacity-50">Main</label>}
                    {filterNav(NAV_MAIN).map(item => (
                        <SidebarLink key={item.path} {...item} collapsed={collapsed} />
                    ))}
                </div>

                <div className="nav-group mb-8">
                    {!collapsed && <label className="px-4 opacity-50">Workflow</label>}
                    {filterNav(NAV_WORKFLOW).map(item => (
                        <SidebarLink key={item.path} {...item} collapsed={collapsed} />
                    ))}
                </div>

                {isAdmin && (
                    <div className="nav-group mb-8">
                        {!collapsed && <label className="px-4 opacity-50">Admin</label>}
                        {NAV_ADMIN.map(item => (
                            <SidebarLink key={item.path} {...item} collapsed={collapsed} />
                        ))}
                    </div>
                )}
            </nav>

            <div className="p-6 border-top border-light">
                <div className={`d-flex align-items-center gap-4 ${collapsed ? 'justify-content-center' : ''}`}>
                    <div className="zenith-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="m-0 fw-700 text-truncate" style={{ fontSize: '13px' }}>{user?.name}</p>
                            <p className="m-0 text-dim extra-small">{user?.role_name}</p>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="collapse-btn mt-6"
                >
                    {collapsed ? <ChevronRight size={16} /> : <div className="d-flex align-items-center gap-3"><ChevronLeft size={16} /> <span>Collapse</span></div>}
                </button>
            </div>

            <style>{`
                .p-8 { padding: 2rem; }
                .logo-box {
                    width: 40px; height: 40px; background: var(--bg-deep); border-radius: 12px;
                    display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-light);
                }
                .zenith-avatar {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: var(--primary); color: white; display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 14px;
                }
                .collapse-btn {
                    width: 100%; background: transparent; border: 1px solid var(--border-light);
                    color: var(--text-muted); padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 600;
                    cursor: pointer; transition: var(--transition-smooth);
                }
                .collapse-btn:hover { background: var(--border-light); color: var(--text-main); }
            `}</style>
        </aside>
    );
}

function SidebarLink({ path, label, icon: Icon, collapsed }) {
    return (
        <NavLink 
            to={path} 
            className={({ isActive }) => `
                sidebar-link d-flex align-items-center gap-4 py-3 px-4 mb-1 text-decoration-none transition-all
                ${isActive ? 'active' : 'idle'}
                ${collapsed ? 'justify-content-center' : 'rounded-3'}
            `}
        >
            <Icon size={18} className="icon" />
            {!collapsed && <span className="label">{label}</span>}
            
            <style>{`
                .sidebar-link { color: var(--text-muted); font-size: 14px; font-weight: 500; }
                .sidebar-link.idle:hover { color: var(--text-main); background: var(--border-light); }
                .sidebar-link.active { color: var(--primary); background: var(--primary-glow); }
                .sidebar-link.active .icon { color: var(--primary); }
                .sidebar-link .icon { transition: var(--transition-smooth); }
            `}</style>
        </NavLink>
    );
}
