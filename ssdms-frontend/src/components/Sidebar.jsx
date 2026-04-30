
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Search,
    Hospital,
    ClipboardList,
    FileEdit,
    CheckCircle2,
    SearchCode,
    MonitorCheck,
    ShieldCheck,
    Banknote,
    Files,
    Archive,
    Users,
    History,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu,
    Download,
    FileSpreadsheet,
    FileType,
    Activity
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const NAV_ITEMS_ALL = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/search', label: 'File Search', icon: Search },
    { path: '/stage/Admission', label: 'Admission', icon: Hospital },
    { path: '/stage/Discharge', label: 'Discharge', icon: ClipboardList },
    { path: '/stage/Pre-Approval', label: 'Pre-Approval', icon: FileEdit },
    { path: '/stage/Approval', label: 'Approval', icon: CheckCircle2 },
    { path: '/stage/File Verification', label: 'File Verification', icon: SearchCode },
    { path: '/stage/E-Claim', label: 'E-Claim', icon: MonitorCheck },
    { path: '/stage/E-Claim Verification', label: 'E-Claim Verify', icon: ShieldCheck },
    { path: '/stage/Finance', label: 'Finance', icon: Banknote },
    { path: '/stage/Segregation', label: 'Segregation', icon: Files },
    { path: '/stage/Indexation', label: 'Indexation', icon: Archive },
];

const NAV_ADMIN = [
    { path: '/admin/users', label: 'Manage Users', icon: Users },
    { path: '/admin/roles', label: 'Manage Permissions', icon: ShieldCheck },
    { path: '/admin/logs', label: 'Audit Logs', icon: History },
    { path: '/admin/health', label: 'System Health', icon: Activity },
];

export default function Sidebar({ isOpen, setIsOpen, isCollapsed }) {
    const { user, isAdmin, isModerator, logout } = useAuth();
    const navigate = useNavigate();

    const assignedSections = (() => {
        try { return JSON.parse(user?.assigned_sections || '[]'); } catch { return []; }
    })();

    const visibleNavItems = NAV_ITEMS_ALL.filter(item => {
        if (isAdmin || isModerator) return true;
        return assignedSections.includes(item.label) || item.path === '/dashboard' || item.path === '/search';
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handlePdfExport = async () => {
        toast.loading('Preparing Summary PDF...');
        try {
            // Fetch all data for summary
            const { data } = await API.get('/files?limit=1000'); // Get top 1000 for summary
            const files = data.files || [];
            
            // We use jspdf from CDN if not installed
            if (!window.jspdf) {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                document.head.appendChild(script);
                script.onload = () => {
                    const autotable = document.createElement('script');
                    autotable.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js";
                    document.head.appendChild(autotable);
                    autotable.onload = () => generatePdf(files);
                };
            } else {
                generatePdf(files);
            }
        } catch {
            toast.dismiss();
            toast.error('Failed to generate PDF summary');
        }
    };

    const generatePdf = (files) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("SSDMS - Global Summary Report", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        
        const tableData = files.map(f => [
            f.visit_number,
            f.patient_name,
            f.mr_number,
            f.current_stage,
            f.status,
            new Date(f.updated_at).toLocaleDateString()
        ]);

        doc.autoTable({
            startY: 40,
            head: [['Visit #', 'Patient Name', 'MR #', 'Stage', 'Status', 'Last Update']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`SSDMS_Summary_${new Date().toISOString().slice(0,10)}.pdf`);
        toast.dismiss();
        toast.success('PDF Exported Successfully');
    };

    return (
        <div className={`ssdms-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="brand d-flex align-items-center justify-content-between gap-2 px-3 py-3 mb-2">
                <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-primary text-white shadow-sm">
                        <ShieldCheck size={20} />
                    </div>
                    {!isCollapsed && (
                        <div className="animate-fade-in">
                            <h5 className="mb-0 fw-800 text-white" style={{ letterSpacing: '-0.5px', fontSize: '18px' }}>SSDMS</h5>
                            <div style={{ color: 'var(--primary)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>V3.0</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="py-2 flex-grow-1 overflow-auto custom-scrollbar">
                {!isCollapsed && (
                    <div className="px-3 py-2">
                        <small style={{ color: 'var(--sidebar-text)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Navigation
                        </small>
                    </div>
                )}
                {visibleNavItems.map(Item => (
                    <NavLink
                        key={Item.path}
                        to={Item.path}
                        title={isCollapsed ? Item.label : ''}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-content-center px-0' : ''}`}
                        onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    >
                        <Item.icon size={18} />
                        {!isCollapsed && <span>{Item.label}</span>}
                    </NavLink>
                ))}

                {(isAdmin) && (
                    <>
                        <div className="px-3 py-2 mt-1">
                            {!isCollapsed ? (
                                <small style={{ color: 'var(--sidebar-text)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Administration
                                </small>
                            ) : (
                                <div className="border-top mx-3 opacity-10" />
                            )}
                        </div>
                        {NAV_ADMIN.map(Item => (
                            <NavLink
                                key={Item.path}
                                to={Item.path}
                                title={isCollapsed ? Item.label : ''}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-content-center px-0' : ''}`}
                                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                            >
                                <Item.icon size={18} />
                                {!isCollapsed && <span>{Item.label}</span>}
                            </NavLink>
                        ))}
                        
                        <div className="px-3 py-2 mt-1">
                            {!isCollapsed ? (
                                <small style={{ color: 'var(--sidebar-text)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    System Exports
                                </small>
                            ) : (
                                <div className="border-top mx-3 opacity-10" />
                            )}
                        </div>
                        <div className="dropdown px-2">
                            <button 
                                className={`nav-link w-100 border-0 bg-transparent d-flex align-items-center gap-2 ${isCollapsed ? 'justify-content-center px-0' : ''}`}
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                title="Download All Data"
                            >
                                <Download size={18} />
                                {!isCollapsed && <span>Download Data</span>}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-dark border-0 shadow-lg p-2" style={{ background: '#1e293b', borderRadius: '12px' }}>
                                <li>
                                    <a className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2" href={`${import.meta.env.VITE_API_URL}/export/excel`} target="_blank" rel="noreferrer">
                                        <FileSpreadsheet size={16} className="text-success" />
                                        <div style={{ fontSize: '12px' }}>
                                            <div className="fw-700">Export to Excel</div>
                                            <div className="extra-small opacity-50">Full Data (.xlsx)</div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <button className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2 mt-1" onClick={handlePdfExport}>
                                        <FileType size={16} className="text-danger" />
                                        <div style={{ fontSize: '12px' }}>
                                            <div className="fw-700">Export to PDF</div>
                                            <div className="extra-small opacity-50">Summary Report (.pdf)</div>
                                        </div>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}>
                <div className={`d-flex align-items-center gap-2 mb-3 ${isCollapsed ? 'justify-content-center' : ''}`}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '8px', minWidth: 32,
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 13, fontWeight: 700
                    }}>
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="animate-fade-in overflow-hidden flex-grow-1">
                            <div className="text-truncate text-white" style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div style={{ color: 'var(--sidebar-text)', fontSize: 11 }}>{user?.role_name}</div>
                                <NavLink to="/profile" className="text-primary extra-small fw-800 text-decoration-none hover-underline">SETTINGS</NavLink>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    className={`btn btn-outline-danger d-flex align-items-center justify-content-center gap-2 ${isCollapsed ? 'w-auto p-2' : 'w-100'}`}
                    style={{ fontSize: 12, borderRadius: '10px' }}
                    onClick={handleLogout}
                    title="Logout"
                >
                    <LogOut size={14} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
