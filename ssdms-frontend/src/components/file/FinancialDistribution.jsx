import { Banknote } from 'lucide-react';

export default function FinancialDistribution({ splits }) {
    if (!splits || splits.length === 0) return null;

    const total = splits.reduce((acc, s) => acc + Number(s.approved_amount), 0);

    return (
        <div className="glass-card border-0 p-0 overflow-hidden shadow-sm mb-4" style={{ background: 'white' }}>
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-primary bg-opacity-5">
                <div className="d-flex align-items-center gap-2">
                    <Banknote className="text-primary" size={16} />
                    <h6 className="mb-0 fw-900" style={{ fontSize: 13 }}>Financial Distribution Ledger</h6>
                </div>
                <span className="badge bg-white text-primary border px-2 py-1 rounded-pill fw-800" style={{ fontSize: 9 }}>
                    {splits.length} RESOURCE RECORDS
                </span>
            </div>
            <div className="p-3">
                <div className="table-responsive">
                    <table className="table premium-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th className="extra-small text-muted fw-800 tracking-wider">RECIPIENT / DOCTOR</th>
                                <th className="extra-small text-muted fw-800 tracking-wider">ALLOCATED</th>
                                <th className="extra-small text-muted fw-800 tracking-wider">STATUS</th>
                                <th className="extra-small text-muted fw-800 tracking-wider">AUDIT REMARKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {splits.map((s, i) => (
                                <tr key={i}>
                                    <td className="fw-800 text-dark py-2" style={{ fontSize: 12 }}>{s.doctor_name}</td>
                                    <td className="fw-900 text-primary py-2" style={{ fontSize: 12 }}>Rs. {Number(s.approved_amount).toLocaleString()}</td>
                                    <td className="py-2">
                                        <span className={`badge px-2 py-1 rounded-pill ${s.payment_status === 'Paid' ? 'bg-success-light text-success' : 'bg-warning bg-opacity-10 text-warning'}`} style={{ fontSize: '9px' }}>
                                            {s.payment_status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-muted extra-small italic py-2">{s.remarks || '—'}</td>
                                </tr>
                            ))}
                            <tr className="bg-light">
                                <td className="fw-900 text-dark py-2" style={{ fontSize: 11 }}>TOTAL DISBURSEMENT</td>
                                <td className="fw-900 text-primary py-2" colSpan="3" style={{ fontSize: 14 }}>
                                    Rs. {total.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
