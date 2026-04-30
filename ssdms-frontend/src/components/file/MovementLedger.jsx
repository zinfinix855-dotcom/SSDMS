import { History as HistoryIcon, ChevronRight, ArrowRight, User } from 'lucide-react';

const DOT_CLASS = { Forwarded: 'bg-primary', Returned: 'bg-danger', Overridden: 'bg-warning' };

export default function MovementLedger({ history }) {
    return (
        <div className="glass-card border-0 p-0 overflow-hidden shadow-sm h-100" style={{ background: 'white' }}>
            <div className="p-3 border-bottom d-flex align-items-center gap-2 bg-light bg-opacity-50">
                <HistoryIcon className="text-primary" size={16} />
                <h6 className="mb-0 fw-900" style={{ fontSize: 13 }}>Movement Ledger</h6>
            </div>
            <div className="p-3">
                {history.length === 0 ? (
                    <div className="text-center py-5 text-muted opacity-50">
                        <HistoryIcon size={48} className="mb-3" />
                        <p>No movement history recorded yet.</p>
                    </div>
                ) : (
                    <div className="premium-timeline">
                        {history.map((h) => (
                            <div key={h.id} className="timeline-item-modern">
                                <div className={`timeline-indicator text-white ${DOT_CLASS[h.status] || 'bg-primary'}`}>
                                    <ChevronRight size={14} />
                                </div>
                                <div className="timeline-content-modern border-0 bg-light bg-opacity-30">
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-900 extra-small">{h.from_stage}</span>
                                            <ArrowRight size={10} className="text-muted" />
                                            <span className="fw-900 text-primary extra-small">{h.to_stage}</span>
                                        </div>
                                        <span className="extra-small fw-800 text-muted" style={{ fontSize: 9 }}>
                                            {new Date(h.action_date).toLocaleDateString()} {new Date(h.action_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center gap-3 text-muted extra-small fw-600" style={{ fontSize: 9 }}>
                                        <div className="d-flex align-items-center gap-1">
                                            <User size={9} /> {h.employee_name}
                                        </div>
                                        <span className={`badge rounded-pill ${h.status === 'Forwarded' ? 'bg-success-light text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: '8px', padding: '2px 6px' }}>
                                            {h.status.toUpperCase()}
                                        </span>
                                    </div>
                                    {h.remarks && (
                                        <div className="mt-2 p-2 rounded-3 bg-white border shadow-sm extra-small italic text-muted">
                                            "{h.remarks}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
