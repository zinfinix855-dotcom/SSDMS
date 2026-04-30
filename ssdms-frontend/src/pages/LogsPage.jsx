import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck,
    Calendar,
    User,
    Terminal,
    Globe,
    ChevronLeft,
    ChevronRight,
    Search,
    AlertCircle,
    Lock
} from 'lucide-react';

export default function LogsPage() {
    const { isAdmin } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 50;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        API.get('/dashboard/logs', { params: { page, limit: LIMIT } })
            .then(res => {
                setLogs(res.data.logs || []);
                setTotal(res.data.total || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    if (!isAdmin) {
        return (
            <Layout title="Audit Logs">
                <div className="animate-fade-in p-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="p-4 rounded-circle bg-danger bg-opacity-10 text-danger d-inline-block mb-4 animate-pulse-slow">
                        <Lock size={64} strokeWidth={1.5} />
                    </div>
                    <h2 className="fw-800 text-dark mb-3">Access Level Insufficient</h2>
                    <p className="text-muted lead mb-4" style={{ maxWidth: '400px' }}>
                        The System Security Vault is restricted to top-level Administrators only.
                        Action attempts are being logged for security auditing.
                    </p>
                    <button className="premium-btn px-5" onClick={() => window.history.back()}>
                        Return to Dashboard
                    </button>
                </div>
            </Layout>
        );
    }

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <Layout title="System Audit Vault">
            <div className="animate-fade-in pb-5">
                {/* Header Stats */}
                <div className="glass-card p-5 mb-5 shadow-xl border-0 overflow-hidden position-relative">
                    <div className="position-absolute top-0 end-0 p-3 opacity-10">
                        <ShieldCheck size={120} />
                    </div>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 position-relative z-index-1">
                        <div className="d-flex align-items-center gap-4">
                            <div className="p-4 rounded-4 bg-primary text-white shadow-lg">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h3 className="fw-800 mb-1">Security Audit Vault</h3>
                                <p className="text-muted mb-0">Immutable tracking of all administrative protocols and workflow lifecycle events.</p>
                            </div>
                        </div>
                        <div className="glass-card shadow-sm border border-opacity-10 px-4 py-3 d-flex align-items-center gap-3">
                            <Terminal size={20} className="text-primary" />
                            <div>
                                <div className="fw-800 text-dark" style={{ fontSize: '18px', lineHeight: 1 }}>{total.toLocaleString()}</div>
                                <div className="extra-small fw-700 text-muted text-uppercase tracking-wider">TOTAL SECURE ENTRIES</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-0 overflow-hidden shadow-xl border-0">
                    <div className="p-4 border-bottom bg-primary bg-opacity-5 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                <Terminal size={20} />
                            </div>
                            <h6 className="mb-0 fw-800">Global Activity Ledger</h6>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-white shadow-sm border btn-sm px-3 fw-700 rounded-pill">Export Logs</button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table premium-table mb-0">
                            <thead>
                                <tr>
                                    <th className="px-4 border-0 text-muted extra-small fw-800 text-uppercase py-3">TIMESTAMP (PKT)</th>
                                    <th className="border-0 text-muted extra-small fw-800 text-uppercase py-3">ACTOR AUTHORITY</th>
                                    <th className="border-0 text-muted extra-small fw-800 text-uppercase py-3">SYSTEM ACTION</th>
                                    <th className="border-0 text-muted extra-small fw-800 text-uppercase py-3">RESOURCE TARGET</th>
                                    <th className="px-4 border-0 text-muted extra-small fw-800 text-uppercase text-end py-3">NETWORK ORIGIN</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: 'none' }}>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm" /></td></tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-5">
                                            <AlertCircle size={32} className="mb-3 opacity-20" />
                                            <p className="fw-600">No security logs identified in the current vault.</p>
                                        </td>
                                    </tr>
                                ) : logs.map(log => (
                                    <tr key={log.id} className="align-middle">
                                        <td className="px-4">
                                            <div className="d-flex align-items-center gap-3 py-2 text-muted fw-700" style={{ fontSize: 13 }}>
                                                <Calendar size={14} className="text-primary opacity-50" />
                                                {new Date(log.created_at).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-2 rounded-circle bg-light text-dark fw-bold border" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                                                    {log.employee_name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <div className="fw-800 text-dark" style={{ fontSize: 13 }}>{log.employee_name || 'System / Automated'}</div>
                                                    <div className="text-muted extra-small fw-700">{log.employee_id || 'ID_SERVICE'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="px-3 py-1 rounded bg-primary bg-opacity-10 text-primary fw-800 font-monospace border border-primary border-opacity-10" style={{ fontSize: 10 }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2 text-muted fw-600" style={{ fontSize: 12 }}>
                                                <Activity size={12} className="text-primary opacity-50" />
                                                {log.target_resource || '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 text-end">
                                            <div className="d-inline-flex align-items-center justify-content-end gap-2 text-muted fw-800 bg-light px-3 py-1 rounded-pill" style={{ fontSize: 11 }}>
                                                <Globe size={11} className="text-primary opacity-50" />
                                                {log.ip_address || 'Internal/Node'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Enhanced Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center px-4 py-4 border-top bg-light bg-opacity-30 gap-3">
                            <div className="text-muted fw-700" style={{ fontSize: 13 }}>
                                PAGE <span className="text-primary fw-800">{page}</span> OF <span className="text-dark fw-800">{totalPages}</span>
                                <span className="ms-3 ps-3 border-start text-muted extra-small font-monospace">[{total.toLocaleString()} SHARED RECORDS]</span>
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-white shadow-sm border px-4 py-2 fw-800 d-flex align-items-center gap-2 transition-all"
                                    disabled={page <= 1}
                                    onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                                    style={{ fontSize: 12, borderRadius: '10px' }}
                                >
                                    <ChevronLeft size={16} /> REVERSE
                                </button>
                                <button
                                    className="btn btn-white shadow-sm border px-4 py-2 fw-800 d-flex align-items-center gap-2 transition-all"
                                    disabled={page >= totalPages}
                                    onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                                    style={{ fontSize: 12, borderRadius: '10px' }}
                                >
                                    FORWARD <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
