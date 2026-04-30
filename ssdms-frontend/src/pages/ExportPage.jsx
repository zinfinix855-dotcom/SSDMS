import { useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Download,
    Calendar,
    Layers,
    Info,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Search,
    Clock,
    ShieldAlert
} from 'lucide-react';
import { STAGES } from '../constants/stages';

export default function ExportPage() {
    const { isAdmin, isModerator } = useAuth();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stage, setStage] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    if (!isAdmin && !isModerator) {
        return (
            <Layout title="Export Restricted">
                <div className="animate-fade-in p-5 text-center">
                    <div className="p-4 rounded-circle bg-danger-light text-danger d-inline-block mb-4">
                        <ShieldAlert size={48} />
                    </div>
                    <h4 className="fw-800 text-dark">Administrative Privilege Required</h4>
                    <p className="text-muted">You do not have the clearance to perform high-level data extraction.</p>
                </div>
            </Layout>
        );
    }

    const handleExport = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (stage) params.stage = stage;

            const res = await API.get('/export/excel', {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            const filename = `SSDMS_Audit_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: `Intelligence report "${filename}" has been generated and downloaded.` });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'danger', text: 'Data extraction failed. Please verify server connectivity.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Data Extraction & Reporting">
            <div className="animate-fade-in">
                {message && (
                    <div className={`alert alert-${message.type} border-0 shadow-sm d-flex align-items-center justify-content-between p-3 mb-4`}>
                        <div className="d-flex align-items-center gap-2">
                            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <span className="fw-600 font-inter">{message.text}</span>
                        </div>
                        <button type="button" className="btn-close" onClick={() => setMessage(null)} />
                    </div>
                )}

                <div className="glass-card p-4 mb-5">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-3 rounded-circle bg-primary-light text-primary shadow-sm">
                                <FileSpreadsheet size={28} />
                            </div>
                            <div>
                                <h4 className="fw-800 mb-0">Cross-Platform Reporting</h4>
                                <p className="text-muted small mb-0">Generate comprehensive Excel dossiers for auditing and analytics</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-5">
                    {/* Export Form */}
                    <div className="col-lg-7">
                        <div className="stat-card p-0 overflow-hidden shadow-sm h-100">
                            <div className="p-4 border-bottom bg-light d-flex align-items-center gap-2">
                                <div className="p-2 rounded bg-primary text-white">
                                    <Download size={20} />
                                </div>
                                <h5 className="mb-0 fw-bold">Extraction Parameters</h5>
                            </div>
                            <div className="p-4 p-md-5">
                                <form onSubmit={handleExport}>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-800 extra-small text-uppercase text-muted mb-2 ls-1">Date Horizon: Start</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><Calendar size={18} className="text-muted" /></span>
                                                <input
                                                    type="date" className="form-control border-start-0 font-inter"
                                                    value={startDate} onChange={e => setStartDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-800 extra-small text-uppercase text-muted mb-2 ls-1">Date Horizon: End</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><Calendar size={18} className="text-muted" /></span>
                                                <input
                                                    type="date" className="form-control border-start-0 font-inter"
                                                    value={endDate} onChange={e => setEndDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-800 extra-small text-uppercase text-muted mb-2 ls-1">Categorical Filter: Workflow Stage</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><Layers size={18} className="text-muted" /></span>
                                                <select className="form-select border-start-0 fw-600 text-dark" value={stage} onChange={e => setStage(e.target.value)}>
                                                    <option value="">Consolidated (Full Scope)</option>
                                                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="small text-muted mt-2 ps-1">
                                                <Info size={12} className="me-1 mb-1" /> Choosing "Consolidated" will merge records from all lifecycle stages.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg w-100 py-3 shadow-lg fw-bold d-flex align-items-center justify-content-center gap-2"
                                            disabled={loading}
                                            style={{ borderRadius: '12px' }}
                                        >
                                            {loading ? (
                                                <><span className="spinner-border spinner-border-sm" /> Processing Dossier...</>
                                            ) : (
                                                <><Download size={20} /> Generate Intelligence Export <ArrowRight size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="col-lg-5">
                        <div className="d-flex flex-column gap-4">
                            <div className="glass-card shadow-sm border-0 border-top border-4 border-primary">
                                <div className="p-4">
                                    <h6 className="fw-800 mb-3 text-dark d-flex align-items-center gap-2">
                                        <FileSpreadsheet className="text-primary" size={20} /> Dossier Architecture
                                    </h6>
                                    <div className="d-flex flex-column gap-3">
                                        <div className="p-3 bg-light-soft rounded-4 border border-white">
                                            <div className="fw-700 text-dark mb-1" style={{ fontSize: 13 }}>Segment Alpha: Patient Records</div>
                                            <p className="small text-muted mb-0">Contains granular statistics including visit logs, CNIC validation, and status attribution.</p>
                                        </div>
                                        <div className="p-3 bg-light-soft rounded-4 border border-white">
                                            <div className="fw-700 text-dark mb-1" style={{ fontSize: 13 }}>Segment Beta: Audit Trail</div>
                                            <p className="small text-muted mb-0">A complete temporal log of every file movement, actor identification, and remarks.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-4 shadow-sm border-0 border-top border-4 border-info">
                                <h6 className="fw-800 mb-3 text-dark d-flex align-items-center gap-2">
                                    <Clock className="text-info" size={20} /> Strategic Guidance
                                </h6>
                                <p className="small text-muted mb-3 font-inter">
                                    Reports are generated in <code>.xlsx</code> format, compatible with Microsoft Excel, Google Sheets, and Power BI.
                                </p>
                                <div className="p-3 bg-info-light rounded-4 border border-white d-flex align-items-start gap-3">
                                    <Search size={24} className="text-info mt-1" />
                                    <div>
                                        <div className="fw-700 text-info mb-1" style={{ fontSize: 13 }}>Search Optimization</div>
                                        <p className="extra-small text-dark opacity-75 mb-0 font-inter">
                                            For historical analysis, leave the Start/End dates blank to retrieve the entire database state.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
