import { User, ClipboardList, Fingerprint, Hospital, Calendar } from 'lucide-react';

const STATUS_CLASS = {
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed',
    'Objected': 'status-objected',
    'Returned': 'status-returned',
};

export default function PatientIdentityCard({ file }) {
    const items = [
        { label: 'MR Number', value: file.mr_number, icon: ClipboardList },
        { label: 'National ID', value: file.cnic, icon: Fingerprint },
        { label: 'Facility', value: file.hospital_name, icon: Hospital },
        { label: 'Admission', value: new Date(file.admission_date || file.created_at).toLocaleDateString(), icon: Calendar },
    ];

    return (
        <div className="glass-card border-0 p-0 overflow-hidden shadow-sm h-100" style={{ background: 'white' }}>
            <div className="p-3 border-bottom d-flex align-items-center gap-2 bg-light bg-opacity-50">
                <User className="text-primary" size={16} />
                <h6 className="mb-0 fw-900" style={{ fontSize: 13 }}>Patient Identity</h6>
            </div>
            <div className="p-3">
                <div className="text-center mb-4">
                    <div className="p-3 rounded-circle bg-light d-inline-block mb-2">
                        <User size={32} className="text-muted opacity-25" />
                    </div>
                    <h5 className="fw-900 mb-1">{file.patient_name}</h5>
                    <div className={`badge rounded-pill px-2 py-1 fw-800 ${STATUS_CLASS[file.status] || 'bg-light text-muted'}`} style={{ fontSize: 9 }}>
                        {file.status?.toUpperCase()}
                    </div>
                </div>

                <div className="d-flex flex-column gap-3">
                    <div className="p-2.5 bg-light rounded-3">
                        <div className="text-muted extra-small fw-bold text-uppercase tracking-wider mb-1">Visit Identifiers</div>
                        <div className="fw-900 text-dark font-monospace small mb-0">{file.visit_number}</div>
                        <div className="text-primary extra-small fw-700">{file.ssc_visit_number || 'SSC-NOT-SET'}</div>
                    </div>

                    <div className="row g-2">
                        {items.map((item, idx) => (
                            <div className="col-12" key={idx}>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="p-1.5 rounded bg-light text-muted">
                                        <item.icon size={13} />
                                    </div>
                                    <div>
                                        <div className="extra-small text-muted fw-bold text-uppercase" style={{ fontSize: 8 }}>{item.label}</div>
                                        <div className="fw-700 small" style={{ fontSize: 11 }}>{item.value || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
