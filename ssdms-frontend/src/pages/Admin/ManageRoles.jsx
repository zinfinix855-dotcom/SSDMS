import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { 
    Users, 
    ShieldCheck, 
    CheckCircle2, 
    XCircle, 
    Search, 
    Edit2, 
    Save, 
    X,
    Filter,
    ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = [
    'Admission', 'Discharge', 'Pre-Approval', 'Approval', 
    'File Verification', 'E-Claim', 'E-Claim Verification', 
    'Finance', 'Segregation', 'Indexation'
];

export default function ManageRoles() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [tempSections, setTempSections] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await API.get('/admin/users');
            setUsers(data.users || []);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleEditStart = (user) => {
        setEditingUser(user);
        try {
            setTempSections(JSON.parse(user.assigned_sections || '[]'));
        } catch {
            setTempSections([]);
        }
    };

    const toggleSection = (section) => {
        setTempSections(prev => 
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const handleSave = async () => {
        toast.loading('Updating permissions...');
        try {
            await API.patch(`/admin/users/${editingUser.employee_id}`, {
                assigned_sections: JSON.stringify(tempSections)
            });
            toast.dismiss();
            toast.success('Permissions updated successfully');
            setEditingUser(null);
            fetchUsers();
        } catch {
            toast.dismiss();
            toast.error('Failed to update permissions');
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.employee_id.includes(search)
    );

    return (
        <Layout title="Visual RBAC Manager">
            <div className="animate-fade-in">
                {/* ── Search and Filter Bar ── */}
                <div className="glass-card p-3 mb-4 d-flex align-items-center gap-3">
                    <div className="premium-input-group flex-grow-1" style={{ maxWidth: 400 }}>
                        <span className="input-icon">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            className="premium-input"
                            placeholder="Search employees..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="ms-auto d-flex align-items-center gap-2">
                        <div className="badge bg-light text-muted border px-3 py-2 rounded-pill fw-800" style={{ fontSize: 10 }}>
                            TOTAL USERS: {users.length}
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-12">
                        <div className="glass-card overflow-hidden">
                            <table className="premium-table w-100">
                                <thead>
                                    <tr>
                                        <th>Employee Details</th>
                                        <th>System Role</th>
                                        <th>Assigned Departments</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-5">
                                            <div className="spinner-border text-primary" />
                                        </td></tr>
                                    ) : filteredUsers.map(user => (
                                        <tr key={user.employee_id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="avatar-small bg-primary bg-opacity-10 text-primary fw-900 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, fontSize: 12 }}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-900 small">{user.name}</div>
                                                        <div className="extra-small text-muted">{user.employee_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.role_name === 'Admin' ? 'bg-danger' : user.role_name === 'Moderator' ? 'bg-warning text-dark' : 'bg-primary'} bg-opacity-10 text-uppercase fw-800 rounded-pill px-3 py-1`} style={{ fontSize: 9 }}>
                                                    {user.role_name}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {(() => {
                                                        try {
                                                            const sections = JSON.parse(user.assigned_sections || '[]');
                                                            return sections.length > 0 ? sections.map(s => (
                                                                <span key={s} className="extra-small px-2 py-0.5 bg-light rounded text-muted fw-700">{s}</span>
                                                            )) : <span className="extra-small text-muted opacity-50">No assignments</span>;
                                                        } catch { return 'Error'; }
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    className="btn btn-icon-only text-primary hover-bg" 
                                                    onClick={() => handleEditStart(user)}
                                                    title="Edit Permissions"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Edit Permissions Modal (Overlay) ── */}
            {editingUser && (
                <div className="modal-custom-overlay animate-fade-in d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="glass-card animate-slide-up overflow-hidden" style={{ width: '100%', maxWidth: 500 }}>
                        <div className="p-4 border-bottom bg-light d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <ShieldCheck size={24} className="text-primary" />
                                <div>
                                    <h5 className="fw-900 mb-0">Manage Permissions</h5>
                                    <p className="extra-small text-muted mb-0 fw-700">{editingUser.name} ({editingUser.employee_id})</p>
                                </div>
                            </div>
                            <button className="btn btn-icon-only text-muted" onClick={() => setEditingUser(null)}><X size={20}/></button>
                        </div>
                        <div className="p-4">
                            <p className="fw-800 small mb-4 text-muted">Toggle authorized departmental sections:</p>
                            <div className="row g-2">
                                {STAGES.map(stage => (
                                    <div className="col-6" key={stage}>
                                        <div 
                                            className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                                                tempSections.includes(stage) ? 'bg-primary bg-opacity-10 border-primary text-primary' : 'bg-white border-light text-muted opacity-75'
                                            }`}
                                            onClick={() => toggleSection(stage)}
                                            style={{ fontSize: 11, fontWeight: 700 }}
                                        >
                                            {stage}
                                            {tempSections.includes(stage) ? <CheckCircle2 size={14} /> : <div style={{width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor'}} />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 d-flex gap-3">
                                <button className="btn btn-primary flex-grow-1 rounded-pill fw-800 py-2 d-flex align-items-center justify-content-center gap-2" onClick={handleSave}>
                                    <Save size={16} /> SAVE CHANGES
                                </button>
                                <button className="btn btn-light px-4 rounded-pill fw-800" onClick={() => setEditingUser(null)}>CANCEL</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
