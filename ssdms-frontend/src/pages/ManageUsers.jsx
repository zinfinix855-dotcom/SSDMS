import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    UserPlus,
    User,
    Mail,
    Lock,
    Shield,
    CheckCircle2,
    XCircle,
    ChevronDown,
    Search,
    ShieldAlert,
    X,
    Plus,
    IdCard as IdentificationCard
} from 'lucide-react';

export default function ManageUsers() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ employee_id: '', name: '', email: '', password: '', role_id: '', assigned_sections: [] });
    const [message, setMessage] = useState(null);

    const SECTIONS = ['Admission', 'Discharge', 'Pre-Approval', 'Approval', 'File Verification', 'E-Claim', 'E-Claim Verification', 'Finance', 'Segregation', 'Indexation'];

    useEffect(() => {
        API.get('/users')
            .then(res => {
                setUsers(res.data.users || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSectionToggle = (section) => {
        setForm(prev => {
            const sections = [...prev.assigned_sections];
            const idx = sections.indexOf(section);
            if (idx === -1) sections.push(section);
            else sections.splice(idx, 1);
            return { ...prev, assigned_sections: sections };
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/users', { ...form });
            setMessage({ type: 'success', text: 'New employee has been successfully registered.' });
            setShowForm(false);
            setForm({ employee_id: '', name: '', email: '', password: '', role_id: '', assigned_sections: [] });
            const res = await API.get('/users');
            setUsers(res.data.users || []);
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Authorization failed. Could not create user.' });
        }
    };

    if (!isAdmin) {
        return (
            <Layout title="Access Denied">
                <div className="animate-fade-in p-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="p-4 rounded-circle bg-danger bg-opacity-10 text-danger d-inline-block mb-4 animate-pulse-slow">
                        <ShieldAlert size={64} strokeWidth={1.5} />
                    </div>
                    <h2 className="fw-800 text-dark mb-3">Security Protocol Active</h2>
                    <p className="text-muted lead mb-4" style={{ maxWidth: '400px' }}>
                        Your current credentials do not grant access to the Staff Directory.
                        Please contact the System Administrator if you believe this is an error.
                    </p>
                    <button className="premium-btn px-5" onClick={() => window.history.back()}>
                        Return to Dashboard
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Staff Directory Management">
            <div className="animate-fade-in pb-5">
                {message && (
                    <div className={`alert alert-${message.type} glass-card border-0 shadow-lg d-flex align-items-center justify-content-between p-3 mb-4 animate-slide-in-right`}>
                        <div className="d-flex align-items-center gap-3">
                            <div className={`p-2 rounded-circle ${message.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            </div>
                            <span className="fw-600">{message.text}</span>
                        </div>
                        <button className="btn-close" onClick={() => setMessage(null)} />
                    </div>
                )}

                <div className="glass-card p-5 mb-5 shadow-xl border-0 overflow-hidden position-relative">
                    <div className="position-absolute top-0 end-0 p-3 opacity-10">
                        <Users size={120} />
                    </div>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 position-relative z-index-1">
                        <div className="d-flex align-items-center gap-4">
                            <div className="p-4 rounded-4 bg-primary text-white shadow-lg">
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 className="fw-800 mb-1">Human Resources & Access</h3>
                                <p className="text-muted mb-0">Centralized staff credential management and section scope assignment.</p>
                            </div>
                        </div>
                        <button
                            className={`premium-btn ${showForm ? 'bg-danger' : ''} px-4 py-3`}
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? <><X size={20} /> Close Entry Form</> : <><Plus size={20} /> Register New Employee</>}
                        </button>
                    </div>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="animate-fade-in mb-5">
                        <div className="glass-card shadow-lg border-0 overflow-hidden">
                            <div className="p-4 border-bottom bg-primary bg-opacity-10 d-flex align-items-center gap-3">
                                <div className="p-2 rounded-3 bg-primary text-white">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-800">Employee Registration Form</h5>
                                    <p className="text-muted extra-small mb-0">Fill in the credentials to grant system access</p>
                                </div>
                            </div>
                            <div className="p-5">
                                <form onSubmit={handleCreate}>
                                    <div className="row g-4">
                                        <div className="col-md-4">
                                            <label className="premium-label">EMPLOYEE IDENTIFIER</label>
                                            <div className="premium-input-group">
                                                <span className="input-icon"><IdentificationCard size={18} /></span>
                                                <input type="text" className="premium-input" placeholder="e.g. EMP-101" value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} required />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="premium-label">LEGAL FULL NAME</label>
                                            <div className="premium-input-group">
                                                <span className="input-icon"><User size={18} /></span>
                                                <input type="text" className="premium-input" placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="premium-label">OFFICIAL EMAIL</label>
                                            <div className="premium-input-group">
                                                <span className="input-icon"><Mail size={18} /></span>
                                                <input type="email" className="premium-input" placeholder="john@ssdms.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="premium-label">SYSTEM AUTHORIZATION ROLE</label>
                                            <div className="premium-input-group">
                                                <span className="input-icon"><Shield size={18} /></span>
                                                <select className="premium-input" value={form.role_id} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))} required>
                                                    <option value="">Select privilege level...</option>
                                                    <option value="1">Administrator - Unrestricted</option>
                                                    <option value="2">Moderator - High Authority</option>
                                                    <option value="3">Standard Employee - Basic</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="premium-label">SECURE ACCESS KEY</label>
                                            <div className="premium-input-group">
                                                <span className="input-icon"><Lock size={18} /></span>
                                                <input type="password" className="premium-input" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="premium-label mb-3">AUTHORIZED SECTION SCOPE</label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {SECTIONS.map(sec => (
                                                    <button
                                                        key={sec} type="button"
                                                        className={`btn rounded-pill px-3 py-2 fw-600 transition-all d-flex align-items-center gap-2 ${form.assigned_sections.includes(sec) ? 'btn-primary shadow-sm' : 'bg-white border text-muted'}`}
                                                        onClick={() => handleSectionToggle(sec)}
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {form.assigned_sections.includes(sec) && <CheckCircle2 size={14} />}
                                                        {sec}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 text-end">
                                        <button className="premium-btn px-5 py-3" type="submit">
                                            Register Account
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="glass-card p-0 overflow-hidden shadow-xl border-0">
                    <div className="p-4 border-bottom bg-primary bg-opacity-5 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                <Users size={20} />
                            </div>
                            <h6 className="mb-0 fw-800">Active Staff Directory</h6>
                        </div>
                        <div className="search-box-premium d-flex align-items-center bg-white border border-opacity-10 shadow-sm px-3 py-2 rounded-pill">
                            <Search size={16} className="text-muted mx-2" />
                            <input type="text" className="border-0 small fw-600" placeholder="Search accounts..." style={{ outline: 'none', background: 'transparent' }} />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table premium-table mb-0">
                            <thead>
                                <tr>
                                    <th className="px-4 border-0 text-muted extra-small fw-800 text-uppercase py-3">STAFF MEMBER IDENTIFICATION</th>
                                    <th className="border-0 text-muted extra-small fw-800 text-uppercase py-3">AUTHORIZATION LEVEL</th>
                                    <th className="border-0 text-muted extra-small fw-800 text-uppercase py-3 text-center">ACCESS STATUS</th>
                                    <th className="border-0 text-muted extra-small fw-800 text-uppercase py-3">WORKFLOW ASSIGNMENTS</th>
                                    <th className="px-4 border-0 text-muted extra-small fw-800 text-uppercase text-end py-3">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: 'none' }}>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm" /></td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-5 text-muted">No staff records found in directory.</td></tr>
                                ) : users.map(u => (
                                    <tr key={u.employee_id} className="align-middle">
                                        <td className="px-4">
                                            <div className="d-flex align-items-center gap-3 py-2">
                                                <div className="p-2 rounded-circle bg-primary text-white fw-bold shadow-sm" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="fw-800 text-dark" style={{ fontSize: '15px' }}>{u.name}</div>
                                                    <div className="text-muted extra-small fw-600 d-flex align-items-center gap-1">
                                                        <IdentificationCard size={12} className="text-primary" /> {u.employee_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className={`badge px-3 py-2 rounded-pill shadow-sm`} style={{
                                                    fontSize: '10px',
                                                    width: 'fit-content',
                                                    background: u.role_name === 'Admin' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : u.role_name === 'Moderator' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'linear-gradient(135deg, #64748b, #475569)',
                                                    color: '#fff'
                                                }}>
                                                    {u.role_name}
                                                </span>
                                                <div className="text-muted extra-small mt-2 fw-600">{u.email}</div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {u.is_active ? (
                                                <div className="d-inline-flex align-items-center gap-2 text-success fw-800 p-2 px-3 rounded-pill bg-success bg-opacity-10" style={{ fontSize: '10px' }}>
                                                    <div className="bg-success rounded-circle shadow-success" style={{ width: 8, height: 8 }}></div>
                                                    AUTHENTICATED
                                                </div>
                                            ) : (
                                                <div className="d-inline-flex align-items-center gap-2 text-danger fw-800 p-2 px-3 rounded-pill bg-danger bg-opacity-10" style={{ fontSize: '10px' }}>
                                                    <div className="bg-danger rounded-circle shadow-danger" style={{ width: 8, height: 8 }}></div>
                                                    RESTRICTED
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="text-muted text-wrap d-flex flex-wrap gap-1" style={{ fontSize: 11, maxWidth: 220 }}>
                                                {(() => {
                                                    try {
                                                        const s = JSON.parse(u.assigned_sections || '[]');
                                                        if (s.includes('*')) return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10">All Portal Sections</span>;
                                                        return s.length > 0 ? s.map(sec => <span key={sec} className="badge bg-light text-dark border">{sec}</span>) : <span className="text-muted opacity-50 fst-italic">No assignments</span>;
                                                    } catch { return 'ERROR'; }
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-4 text-end">
                                            <button className="btn btn-white shadow-sm border p-2 rounded-3 hover-shadow transition-all">
                                                <ChevronDown size={18} className="text-muted" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
