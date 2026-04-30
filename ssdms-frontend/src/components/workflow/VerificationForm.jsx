import { CheckSquare, Square } from 'lucide-react';

const CHECKS = [
    { key: 'doc_verified',    label: 'All required documents are attached and legible' },
    { key: 'amount_matches',  label: 'Claimed amount matches the hospital bill' },
    { key: 'diagnosis_valid', label: 'Diagnosis code (ICD-10) is valid and supported' },
    { key: 'cnic_match',      label: 'CNIC on file matches the submitted document' },
    { key: 'no_duplicates',   label: 'No duplicate claim found in the system' },
];

export default function VerificationForm({ formData, onChange }) {
    const checks = formData?.checks || {};

    const toggleCheck = (key) => {
        const updated = { ...checks, [key]: !checks[key] };
        onChange({ ...formData, checks: updated });
    };

    const allChecked = CHECKS.every(c => checks[c.key]);
    const checkedCount = CHECKS.filter(c => checks[c.key]).length;

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h6 className="fw-800 mb-0">Verification Checklist</h6>
                    <p className="extra-small text-muted mb-0 fw-600">
                        {checkedCount} / {CHECKS.length} ITEMS VERIFIED
                    </p>
                </div>
                <div
                    className="rounded-pill px-3 py-1"
                    style={{
                        fontSize: 11, fontWeight: 700,
                        background: allChecked ? '#ecfdf5' : '#fef3c7',
                        color: allChecked ? '#10b981' : '#f59e0b',
                    }}
                >
                    {allChecked ? '✓ READY TO APPROVE' : 'INCOMPLETE'}
                </div>
            </div>

            {/* Progress bar */}
            <div className="bg-light rounded-pill mb-4 overflow-hidden" style={{ height: 6 }}>
                <div
                    className="rounded-pill transition-all"
                    style={{
                        height: '100%',
                        width: `${(checkedCount / CHECKS.length) * 100}%`,
                        background: allChecked ? '#10b981' : '#f59e0b',
                        transition: 'width 0.4s ease',
                    }}
                />
            </div>

            <div className="d-flex flex-column gap-3 mb-4">
                {CHECKS.map(({ key, label }) => {
                    const checked = !!checks[key];
                    return (
                        <div
                            key={key}
                            className="d-flex align-items-center gap-3 p-3 rounded-3 cursor-pointer"
                            style={{
                                background: checked ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                                border: `1px solid ${checked ? 'rgba(16, 185, 129, 0.2)' : '#e2e8f0'}`,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                            }}
                            onClick={() => toggleCheck(key)}
                        >
                            {checked
                                ? <CheckSquare size={20} className="text-success flex-shrink-0" />
                                : <Square size={20} className="text-muted flex-shrink-0" />
                            }
                            <span className="fw-600" style={{ fontSize: 13, color: checked ? '#065f46' : '#475569' }}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div>
                <label className="form-label fw-700 extra-small text-uppercase tracking-wider">
                    Verification Notes (Optional)
                </label>
                <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Record any discrepancies or notes for the next stage..."
                    value={formData?.notes || ''}
                    onChange={e => onChange({ ...formData, notes: e.target.value })}
                    style={{ fontSize: 13, borderRadius: 12 }}
                />
            </div>
        </div>
    );
}
