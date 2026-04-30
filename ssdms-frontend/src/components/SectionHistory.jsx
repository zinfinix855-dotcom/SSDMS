import { useState, useEffect } from 'react';
import API from '../api/axios';
import { X, History, User, Clock, ArrowRight } from 'lucide-react';

export default function SectionHistory({ visitNumber, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await API.get(`/files/${visitNumber}`);
                setHistory(res.data.history || []);
            } catch (err) {
                console.error('Failed to fetch file history', err);
            } finally {
                setLoading(false);
            }
        };

        if (visitNumber) fetchHistory();
    }, [visitNumber]);

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header bg-primary text-white border-0 p-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-3">
                                <History size={20} />
                            </div>
                            <h5 className="modal-title fw-800 mb-0">File Movement History</h5>
                        </div>
                        <button type="button" className="btn-close btn-close-white opacity-75" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body p-0 bg-light bg-opacity-50" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                                <span className="text-muted fw-600">Retrieving audit logs...</span>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-5">
                                <p className="text-muted mb-0">No movement history found for this file.</p>
                            </div>
                        ) : (
                            <div className="p-4">
                                <div className="premium-timeline">
                                    {history.map((h, idx) => (
                                        <div key={h.id || idx} className="timeline-item-modern mb-4">
                                            <div className="timeline-indicator bg-primary text-white">
                                                {history.length - idx}
                                            </div>
                                            <div className="timeline-content-modern p-4 bg-white shadow-sm border-0 rounded-4">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-light text-primary border fw-800 px-3">{h.from_stage}</span>
                                                        <ArrowRight size={14} className="text-muted" />
                                                        <span className="badge bg-primary text-white fw-800 px-3">{h.to_stage}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 text-muted extra-small fw-700">
                                                        <Clock size={12} />
                                                        {new Date(h.action_date).toLocaleString()}
                                                    </div>
                                                </div>
                                                
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <div className="avatar-xs rounded-circle bg-light d-flex align-items-center justify-content-center border">
                                                        <User size={12} className="text-muted" />
                                                    </div>
                                                    <div className="small fw-700 text-dark opacity-75">Processed by: {h.employee_name}</div>
                                                </div>

                                                {h.remarks && (
                                                    <div className="p-3 bg-light rounded-3 border-start border-primary border-4 small italic text-muted">
                                                        "{h.remarks}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer border-0 p-4 bg-white">
                        <button type="button" className="btn btn-light px-4 fw-700 rounded-3" onClick={onClose}>Close Archive</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
