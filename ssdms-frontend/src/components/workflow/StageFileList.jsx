import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { Calendar, User, Hash, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const SLA_COLORS = {
    Normal:   { bg: '#ecfdf5', text: '#10b981', label: 'OK' },
    Warning:  { bg: '#fffbeb', text: '#f59e0b', label: 'WARNING' },
    Urgent:   { bg: '#fff7ed', text: '#ea580c', label: 'URGENT' },
    Violated: { bg: '#fff1f2', text: '#f43f5e', label: 'BREACH' },
};

const getPriorityColor = (score) => {
    if (score >= 15) return '#ef4444'; // Extreme
    if (score >= 10) return '#f97316'; // High
    if (score >= 5)  return '#2563eb'; // Medium
    return '#64748b'; // Low
};

const PAGE_SIZE = 15;

const RowSkeleton = () => (
    <>
        {[1, 2, 3, 4, 5].map(i => (
            <tr key={i}>
                {[140, 120, 100, 80, 60, 80].map((w, j) => (
                    <td key={j} className="py-3 px-4">
                        <div className="bg-light rounded animate-pulse" style={{ height: 16, width: w }} />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

/**
 * StageFileList — paginated table of all files currently at the given stage.
 * Clicking any row calls onSelectFile(visitNumber) to open the workspace.
 *
 * Backend API: GET /api/files?stage={stageName}&page={page}&limit={PAGE_SIZE}
 * Response:    { files: [], total: N, page: N, totalPages: N }
 */
export default function StageFileList({ stageName, onSelectFile }) {
    const [files, setFiles]         = useState([]);
    const [total, setTotal]         = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    const load = useCallback(async (targetPage = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await API.get('/files', {
                params: { stage: stageName, page: targetPage, limit: PAGE_SIZE }
            });
            const data = res.data;
            // The backend returns { status, message, results, data: [], pagination: { total, ... } }
            setFiles(data.data || []);
            setTotal(data.pagination?.total || 0);
            setTotalPages(data.pagination?.pages || 1);
            setPage(targetPage);
        } catch {
            setError('Failed to load files for this stage. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [stageName]);

    // Reload when stage changes
    useEffect(() => { load(1); }, [load]);

    return (
        <div className="glass-card overflow-hidden border-0 shadow-sm mb-4">
            {/* ── Header ── */}
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between"
                style={{ background: 'rgba(37,99,235,0.03)' }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                        <Hash size={18} />
                    </div>
                    <div>
                        <h6 className="fw-800 mb-0">Files at {stageName}</h6>
                        <p className="extra-small text-muted mb-0 fw-600">
                            {loading ? 'LOADING...' : `${total} RECORDS IN QUEUE`}
                        </p>
                    </div>
                </div>
                <button
                    className="btn btn-light border rounded-pill px-3 py-1 d-flex align-items-center gap-2 fw-700"
                    style={{ fontSize: 11 }}
                    onClick={() => load(page)}
                    disabled={loading}
                >
                    <RefreshCw size={12} className={loading ? 'spin' : ''} />
                    REFRESH
                </button>
            </div>

            {/* ── Error state ── */}
            {error && (
                <div className="p-4 d-flex align-items-center gap-3 text-danger bg-danger bg-opacity-5">
                    <AlertCircle size={18} />
                    <span className="fw-600" style={{ fontSize: 13 }}>{error}</span>
                </div>
            )}

            {/* ── Table ── */}
            <div className="table-responsive p-4 pt-0">
                <table className="table premium-table mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                    <thead>
                        <tr className="bg-transparent">
                            <th className="px-3 border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">VISIT REF</th>
                            <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">PRIORITY</th>
                            <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">MR NO</th>
                            <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">PATIENT RECIPIENT</th>
                            <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">SLA DEADLINE</th>
                            <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">TYPE</th>
                            <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">SLA</th>
                            <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase text-end px-3">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <RowSkeleton />
                        ) : files.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-5 glass-card bg-light bg-opacity-50 border-0">
                                    <div className="p-4 bg-white rounded-circle d-inline-block shadow-sm mb-3">
                                        <CheckCircle2 size={48} className="text-success opacity-50" />
                                    </div>
                                    <p className="fw-900 text-dark mb-1">SECTION QUEUE CLEAR</p>
                                    <p className="extra-small text-muted text-uppercase tracking-wider">No workflows currently require intervention at {stageName}</p>
                                </td>
                            </tr>
                        ) : files.map(file => {
                            return (
                                <tr
                                    key={file.visit_number}
                                    className="align-middle shadow-sm transition-all"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => onSelectFile(file.visit_number)}
                                >
                                    <td className="px-3 fw-900 text-primary bg-white rounded-start" style={{ fontSize: 12, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        {file.visit_number}
                                    </td>
                                    <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        <div className="d-flex align-items-center gap-1">
                                            <div className="rounded-circle" style={{ width: 8, height: 8, background: getPriorityColor(file.priority_score) }} />
                                            <span className="fw-900" style={{ fontSize: 12, color: getPriorityColor(file.priority_score) }}>{file.priority_score?.toFixed(1) || '0.0'}</span>
                                        </div>
                                    </td>
                                    <td className="bg-white fw-800 text-dark" style={{ fontSize: 12, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        {file.mr_number || '—'}
                                    </td>
                                    <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="p-1.5 rounded-circle bg-primary bg-opacity-5 text-primary border border-primary border-opacity-10">
                                                <User size={12} />
                                            </div>
                                            <div>
                                                <div className="fw-800 text-dark" style={{ fontSize: 11 }}>{file.patient_name}</div>
                                                <div className="text-muted extra-small fw-700 tracking-tight opacity-75" style={{ fontSize: 8 }}>{file.cnic}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        <div className="d-flex flex-column">
                                            <div className="d-flex align-items-center gap-1 text-dark fw-900" style={{ fontSize: 11 }}>
                                                <Calendar size={11} className="text-primary opacity-50" />
                                                {file.deadline_at ? new Date(file.deadline_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </div>
                                            <div className="extra-small text-muted fw-700">
                                                {file.deadline_at ? new Date(file.deadline_at).toLocaleDateString() : 'NO LIMIT'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        <span
                                            className="badge rounded-pill px-2 py-1 fw-800 border border-opacity-25"
                                            style={{
                                                fontSize: 9,
                                                background: file.status === 'Objected' ? '#fff1f2' : '#f0fdf4',
                                                color: file.status === 'Objected' ? '#f43f5e' : '#10b981',
                                                borderColor: file.status === 'Objected' ? '#fecdd3' : '#bcf0da'
                                            }}
                                        >
                                            {file.status === 'Objected' ? 'RETURN' : 'FRESH'}
                                        </span>
                                    </td>
                                    <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        {(() => {
                                            const now = new Date();
                                            const deadline = file.deadline_at ? new Date(file.deadline_at) : null;
                                            let slaStatus = file.last_sla_status || 'Normal';
                                            
                                            if (deadline && now > deadline) slaStatus = 'Violated';
                                            else if (deadline && (deadline - now) < (6 * 3600000)) slaStatus = 'Urgent';
                                            else if (deadline && (deadline - now) < (12 * 3600000)) slaStatus = 'Warning';

                                            const currentSla = SLA_COLORS[slaStatus] || SLA_COLORS.Normal;
                                            
                                            return (
                                                <span
                                                    className="badge rounded-pill px-2 py-1 fw-900"
                                                    style={{ fontSize: 9, background: currentSla.bg, color: currentSla.text, border: `1px solid ${currentSla.text}22` }}
                                                >
                                                    <div className="d-flex align-items-center gap-1">
                                                        <div className={`rounded-circle ${slaStatus === 'Violated' ? 'glowing-border' : ''}`} style={{ width: 5, height: 5, background: currentSla.text }} />
                                                        {currentSla.label}
                                                    </div>
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-3 text-end bg-white rounded-end" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        <button
                                            className="btn btn-sm btn-white border shadow-sm rounded-pill px-3 fw-800 d-flex align-items-center gap-1 ms-auto"
                                            style={{ fontSize: 10 }}
                                            onClick={(e) => { e.stopPropagation(); onSelectFile(file.visit_number); }}
                                        >
                                            INIT <ArrowRight size={12} className="text-primary" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && !loading && (
                <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between bg-light">
                    <span className="extra-small text-muted fw-700">
                        Page {page} of {totalPages} &bull; {total} total records
                    </span>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-sm btn-light border rounded-pill px-3 fw-700 d-flex align-items-center gap-1"
                            onClick={() => load(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft size={14} /> PREV
                        </button>
                        <button
                            className="btn btn-sm btn-light border rounded-pill px-3 fw-700 d-flex align-items-center gap-1"
                            onClick={() => load(page + 1)}
                            disabled={page >= totalPages}
                        >
                            NEXT <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
