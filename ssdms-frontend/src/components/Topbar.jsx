import { useAuth } from '../context/AuthContext';
import { Menu, User, Bell, ShieldCheck } from 'lucide-react';

export default function Topbar({ title, onToggleMobile, onToggleDesktop }) {
    const { user } = useAuth();

    return (
        <div className="ssdms-topbar glass-card border-0 rounded-0 border-bottom">
            <div className="d-flex align-items-center gap-4">
                {/* Mobile Toggle */}
                <button
                    className="btn btn-white shadow-sm border rounded-circle p-2 d-lg-none"
                    onClick={onToggleMobile}
                >
                    <Menu size={20} className="text-primary" />
                </button>
                {/* Desktop Toggle (Replaces Sidebar Chevron) */}
                <button
                    className="btn btn-white shadow-sm border rounded-circle p-2 d-none d-lg-block"
                    onClick={onToggleDesktop}
                >
                    <Menu size={20} className="text-primary" />
                </button>
                <div className="d-flex align-items-center gap-2">
                    <div className="p-1 rounded bg-primary bg-opacity-10 text-primary d-none d-md-block">
                        <ShieldCheck size={14} />
                    </div>
                    <h6 className="page-title mb-0 fw-800 tracking-tight text-dark" style={{ fontSize: '14px' }}>{title.toUpperCase()}</h6>
                </div>
            </div>

            <div className="d-flex align-items-center gap-4">
                <button className="btn btn-white shadow-sm border rounded-circle p-2 position-relative">
                    <Bell size={18} className="text-muted" />
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                        <span className="visually-hidden">New alerts</span>
                    </span>
                </button>

                <div className="d-flex align-items-center gap-3 ps-4 border-start">
                    <div className="text-end d-none d-sm-block">
                        <div className="fw-800 text-dark" style={{ fontSize: 12, lineHeight: 1 }}>{user?.name || 'System Operator'}</div>
                        <div className="extra-small text-muted fw-700 tracking-widest" style={{ fontSize: 9 }}>{user?.employee_id || 'ID_SERVICE'}</div>
                    </div>
                    <div className="p-2 rounded-circle bg-primary text-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                        <User size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
}
