import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import FileService from '../services/FileService';
import WorkflowService from '../services/WorkflowService';
import useDebounce from '../hooks/useDebounce';
import {
    Search, FileText, ArrowRight, Calendar, User, Fingerprint,
    X, ShieldAlert, Archive, RotateCcw, Hash, ChevronRight,
    Filter, ChevronDown, ChevronUp, SlidersHorizontal
} from 'lucide-react';

const STATUS_CLASS = {
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed',
    'Objected': 'status-objected',
    'Returned': 'status-returned',
};

export default function SearchPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Read ?status= query param from URL (set by dashboard stat cards)
    const urlParams = new URLSearchParams(location.search);
    const statusFilter = urlParams.get('status') || '';

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    
    // Phase 7: Advanced Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        min_priority: ''
    });

    const debouncedQuery = useDebounce(query, 500);

    const doSearch = useCallback(async (searchQuery = query, searchStatus = statusFilter) => {
        // Don't search if both are empty
        if (!searchQuery.trim() && !searchStatus) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);
        setSelectedFiles([]);
        try {
            const params = {};
            if (searchQuery.trim()) params.query = searchQuery.trim();
            if (searchStatus) params.status = searchStatus;
            
            // Phase 7: Advanced Filters
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.min_priority) params.min_priority = filters.min_priority;

            const data = await FileService.getAll(params);
            // The backend returns { status, data: [], pagination: { ... } }
            // If the response is already data, use data.data
            const files = data.data || data.files || [];
            setResults(files);
        } catch (err) {
            console.error(err);
            toast.error('Failed to search files. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-trigger search when debounced query OR status filter changes
    useEffect(() => {
        doSearch(debouncedQuery, statusFilter);
    }, [debouncedQuery, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim() && !statusFilter) return;
        doSearch(query, statusFilter);
    };

    const toggleSelect = (vn) => {
        setSelectedFiles(prev =>
            prev.includes(vn) ? prev.filter(id => id !== vn) : [...prev, vn]
        );
    };

    const handleBulkAction = async (action) => {
        if (!selectedFiles.length) return;
        const confirm = window.confirm(`Are you sure you want to ${action} ${selectedFiles.length} files?`);
        if (!confirm) return;

        setBulkActionLoading(true);
        try {
            const data = await WorkflowService.bulkAction(selectedFiles, action);
            toast.success(`Successfully processed ${data.results?.success?.length ?? 0} files.`);
            if (data.results?.failed?.length > 0) {
                toast.error(`${data.results.failed.length} files failed.`);
            }
            setSelectedFiles([]);
            doSearch(query, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bulk action failed');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const clearStatusFilter = () => {
        setQuery('');
        navigate('/search');
    };

    const ResultsSkeleton = () => (
        <>
            {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="bg-light rounded" style={{ height: 20, width: 20 }} /></td>
                    <td><div className="bg-light rounded" style={{ height: 20, width: 120 }} /></td>
                    <td><div className="bg-light rounded" style={{ height: 20, width: 100 }} /></td>
                    <td>
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-light rounded-circle" style={{ height: 32, width: 32 }} />
                            <div>
                                <div className="bg-light rounded mb-1" style={{ height: 14, width: 100 }} />
                                <div className="bg-light rounded" style={{ height: 10, width: 80 }} />
                            </div>
                        </div>
                    </td>
                    <td><div className="bg-light rounded-pill" style={{ height: 24, width: 100 }} /></td>
                    <td><div className="bg-light rounded-pill" style={{ height: 24, width: 80 }} /></td>
                    <td className="px-4"><div className="bg-light rounded ms-auto" style={{ height: 14, width: 100 }} /></td>
                </tr>
            ))}
        </>
    );

    return (
        <Layout title="Global File Search">
            <div className="animate-fade-in">
                {/* Search Card */}
                <div className="glass-card p-4 mb-4 shadow-sm border-0 overflow-hidden position-relative animate-fade-in">
                    <div className="position-absolute top-0 end-0 p-3 opacity-05">
                        <Search size={80} />
                    </div>
                    <div className="d-flex align-items-center gap-3 mb-4 position-relative z-index-1">
                        <div className="p-3 rounded-3 bg-primary text-white shadow-sm">
                            <Search size={20} />
                        </div>
                        <div>
                            <h4 className="fw-900 mb-0">Global Repository Search</h4>
                            <p className="extra-small text-muted mb-0">
                                Accelerated retrieval across all patient files, visits, and clinical identifiers.
                            </p>
                        </div>
                    </div>

                    {/* Active Status Filter Banner */}
                    {statusFilter && (
                        <div className="d-flex align-items-center gap-3 mb-4 p-3 px-4 rounded-pill glass-card bg-primary bg-opacity-5 animate-slide-in-right">
                            <span className="text-primary fw-800 extra-small text-uppercase tracking-wider">
                                ACTIVE FILTER:
                            </span>
                            <span className={`badge px-3 py-2 rounded-pill shadow-sm bg-primary text-white`} style={{ fontSize: 11 }}>
                                {statusFilter}
                            </span>
                            <button
                                className="btn btn-white btn-sm px-3 rounded-pill shadow-sm border ms-auto d-flex align-items-center gap-2 fw-700"
                                style={{ fontSize: 11 }}
                                onClick={clearStatusFilter}
                            >
                                <X size={14} /> REMOVE FILTER
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSearch} className="row g-3 position-relative z-index-1">
                        <div className="col-md-10">
                            <div className="premium-input-group mb-0">
                                <span className="input-icon" style={{ padding: '0 12px' }}>
                                    <Search size={18} className="text-primary" />
                                </span>
                                <input
                                    type="text"
                                    className="premium-input py-2"
                                    placeholder="Enter Visit ID, SSC Number, CNIC, or Patient Name..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    style={{ fontSize: 13, paddingLeft: '40px' }}
                                />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <button
                                type="submit"
                                className="premium-btn w-100 py-2 shadow-sm"
                                disabled={loading}
                                style={{ fontSize: 12 }}
                            >
                                {loading
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : statusFilter ? 'REFRESH' : 'SEARCH'}
                            </button>
                        </div>
                    </form>

                    {/* Phase 7: Advanced Filter Toggle */}
                    <div className="mt-3">
                        <button 
                            className={`btn btn-link p-0 extra-small fw-800 text-decoration-none d-flex align-items-center gap-2 ${showFilters ? 'text-primary' : 'text-muted'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={14} />
                            {showFilters ? 'HIDE ADVANCED FILTERS' : 'SHOW ADVANCED FILTERS'}
                            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showFilters && (
                            <div className="mt-3 p-4 bg-light bg-opacity-50 rounded-4 border border-dashed animate-slide-down">
                                <div className="row g-4">
                                    <div className="col-md-4">
                                        <label className="extra-small fw-800 text-muted mb-2 tracking-widest">CREATION DATE (FROM)</label>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm rounded-pill px-3 border-0 shadow-sm" 
                                            value={filters.date_from}
                                            onChange={e => setFilters({...filters, date_from: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="extra-small fw-800 text-muted mb-2 tracking-widest">CREATION DATE (TO)</label>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm rounded-pill px-3 border-0 shadow-sm"
                                            value={filters.date_to}
                                            onChange={e => setFilters({...filters, date_to: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="extra-small fw-800 text-muted mb-2 tracking-widest">MIN PRIORITY SCORE</label>
                                        <select 
                                            className="form-select form-select-sm rounded-pill px-3 border-0 shadow-sm fw-700"
                                            value={filters.min_priority}
                                            onChange={e => setFilters({...filters, min_priority: e.target.value})}
                                        >
                                            <option value="">Any Priority</option>
                                            <option value="10">Critical (10+)</option>
                                            <option value="5">High (5+)</option>
                                            <option value="1">Medium (1+)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {searched && (
                    <div className="glass-card p-0 overflow-hidden shadow-xl border-0">
                        <div className="p-4 border-bottom bg-primary bg-opacity-5 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                    <FileText size={20} />
                                </div>
                                <h6 className="mb-0 fw-800">
                                    {statusFilter ? `${statusFilter} Records` : 'Identified File Matches'}
                                </h6>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill border border-primary border-opacity-10 fw-800" style={{ fontSize: 10 }}>
                                {results.length.toLocaleString()} FILES RETRIEVED
                            </span>
                        </div>

                        <div className="table-responsive p-4 pt-0">
                            <table className="table premium-table mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                <thead>
                                    <tr className="bg-transparent">
                                        <th className="px-3 border-0 text-muted extra-small fw-800 tracking-widest text-uppercase" style={{ width: 40 }}>SEL</th>
                                        <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">VISIT REF</th>
                                        <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">PRIORITY</th>
                                        <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">MR NO</th>
                                        <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">PATIENT IDENTITY</th>
                                        <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">STAGE</th>
                                        <th className="border-0 text-muted extra-small fw-800 tracking-widest text-uppercase">STATUS</th>
                                        <th className="px-3 border-0 text-muted extra-small fw-800 tracking-widest text-uppercase text-end">UPDATED</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <ResultsSkeleton />
                                    ) : results.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5 glass-card bg-light bg-opacity-50 border-0">
                                                <div className="p-4 bg-white rounded-circle d-inline-block shadow-sm mb-3">
                                                    <Search size={48} className="text-primary opacity-20" />
                                                </div>
                                                <p className="fw-900 text-dark mb-1">NO RECORDS IDENTIFIED</p>
                                                <p className="extra-small text-muted text-uppercase tracking-wider">
                                                    {statusFilter
                                                        ? `Zero results for protocol status: ${statusFilter}`
                                                        : 'Refine your query parameters and attempt retrieval again.'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : results.map(file => (
                                        <tr
                                            key={file.visit_number}
                                            className={`${selectedFiles.includes(file.visit_number) ? 'bg-primary bg-opacity-5' : ''} align-middle shadow-sm transition-all`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/file/${file.visit_number}`)}
                                        >
                                            <td className="px-3 bg-white rounded-start" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }} onClick={(e) => e.stopPropagation()}>
                                                <div className="premium-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        id={`file-${file.visit_number}`}
                                                        checked={selectedFiles.includes(file.visit_number)}
                                                        onChange={() => toggleSelect(file.visit_number)}
                                                    />
                                                    <label htmlFor={`file-${file.visit_number}`}></label>
                                                </div>
                                            </td>
                                            <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }}>
                                                <div className="fw-900 text-primary" style={{ fontSize: 12 }}>{file.visit_number}</div>
                                                {file.ssc_visit_number && (
                                                    <div className="text-muted extra-small fw-800 tracking-tight" style={{ fontSize: 9 }}>SSC: {file.ssc_visit_number}</div>
                                                )}
                                            </td>
                                            <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }}>
                                                <span className="fw-900" style={{ 
                                                    fontSize: 12, 
                                                    color: file.priority_score >= 10 ? '#f43f5e' : file.priority_score >= 5 ? '#f59e0b' : '#2563eb' 
                                                }}>
                                                    {file.priority_score?.toFixed(1) || '0.0'}
                                                </span>
                                            </td>
                                            <td className="bg-white fw-800 text-dark" style={{ fontSize: 11, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }}>
                                                {file.mr_number || '—'}
                                            </td>
                                            <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="p-1.5 rounded-circle bg-primary bg-opacity-5 text-primary border border-primary border-opacity-10 shadow-sm">
                                                        <User size={12} />
                                                    </div>
                                                    <div>
                                                        <div className="fw-800 text-dark" style={{ fontSize: 12 }}>{file.patient_name}</div>
                                                        <div className="text-muted extra-small fw-700 tracking-tight opacity-75" style={{ fontSize: 9 }}>{file.cnic}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }}>
                                                <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill border border-primary border-opacity-10 fw-900" style={{ fontSize: 9 }}>
                                                    {file.current_stage?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="bg-white" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }}>
                                                <span className={`badge rounded-pill px-2 py-1 fw-800 shadow-sm border border-opacity-25 ${STATUS_CLASS[file.status] || ''}`} style={{ fontSize: 9 }}>
                                                    {file.status?.toUpperCase() || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="px-3 text-end bg-white rounded-end" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px' }}>
                                                <div className="d-flex align-items-center justify-content-end gap-1 text-dark fw-800" style={{ fontSize: 10 }}>
                                                    <Calendar size={11} className="text-primary opacity-50" />
                                                    {new Date(file.updated_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-primary extra-small fw-900 tracking-widest d-flex align-items-center justify-content-end gap-1 opacity-75" style={{ fontSize: 8 }}>
                                                    PROFILE <ChevronRight size={10} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedFiles.length > 0 && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-5 animate-slide-up" style={{ zIndex: 1050, width: 'fit-content' }}>
                    <div className="glass-card shadow-2xl p-4 d-flex align-items-center gap-5 bg-white border border-primary border-opacity-20" style={{ minWidth: '600px' }}>
                        <div className="d-flex align-items-center gap-4 pe-5 border-end">
                            <div className="p-3 rounded-4 bg-primary text-white shadow-lg">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <div className="fw-800 h5 mb-0 text-primary">{selectedFiles.length}</div>
                                <div className="extra-small text-muted fw-800 text-uppercase tracking-widest">FILES SELECTED</div>
                            </div>
                        </div>

                        <div className="d-flex gap-3">
                            <button
                                className="btn btn-primary shadow-lg d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-800"
                                disabled={bulkActionLoading}
                                onClick={() => handleBulkAction('forward')}
                                style={{ fontSize: 11 }}
                            >
                                <ArrowRight size={16} />
                                {bulkActionLoading ? 'PROCESSING...' : 'BULK FORWARD'}
                            </button>
                            <button
                                className="btn btn-white border shadow-sm d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-800 text-warning"
                                disabled={bulkActionLoading}
                                onClick={() => handleBulkAction('return')}
                                style={{ fontSize: 11 }}
                            >
                                <RotateCcw size={16} /> BULK RETURN
                            </button>
                            <button
                                className="btn btn-white border shadow-sm d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-800 text-danger"
                                disabled={bulkActionLoading}
                                onClick={() => handleBulkAction('archive')}
                                style={{ fontSize: 11 }}
                            >
                                <Archive size={16} /> BULK ARCHIVE
                            </button>
                        </div>

                        <button
                            className="btn btn-light rounded-circle p-2 ms-2 hover-bg-danger transition-all"
                            onClick={() => setSelectedFiles([])}
                            title="Cancel Selection"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    );
}
