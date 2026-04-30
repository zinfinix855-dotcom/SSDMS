import { Archive, AlertOctagon, Sparkles } from 'lucide-react';

const CATEGORIES = [
    {
        key: 'Fresh',
        label: 'Fresh',
        sublabel: 'No issues, ready for indexation',
        Icon: Sparkles,
        color: '#10b981',
        bg: '#ecfdf5',
        border: 'rgba(16, 185, 129, 0.3)',
    },
    {
        key: 'Objected',
        label: 'Objected',
        sublabel: 'Discrepancy found, needs correction',
        Icon: AlertOctagon,
        color: '#f59e0b',
        bg: '#fffbeb',
        border: 'rgba(245, 158, 11, 0.3)',
    },
    {
        key: 'Archive',
        label: 'Archive',
        sublabel: 'Processed and ready for archiving',
        Icon: Archive,
        color: '#6366f1',
        bg: '#eef2ff',
        border: 'rgba(99, 102, 241, 0.3)',
    },
];

export default function SegregationForm({ formData, onChange }) {
    const selected = formData?.category || null;

    const selectCategory = (key) => {
        onChange({ ...formData, category: key });
    };

    return (
        <div>
            <div className="mb-4">
                <h6 className="fw-800 mb-1">Select Segregation Category</h6>
                <p className="extra-small text-muted fw-600">
                    CHOOSE THE APPROPRIATE CLASSIFICATION FOR THIS FILE
                </p>
            </div>

            <div className="d-flex flex-column gap-3 mb-4">
                {CATEGORIES.map(({ key, label, sublabel, Icon, color, bg, border }) => { // eslint-disable-line no-unused-vars
                    const isSelected = selected === key;
                    return (
                        <div
                            key={key}
                            className="d-flex align-items-center gap-4 p-4 rounded-4"
                            style={{
                                background: isSelected ? bg : '#f8fafc',
                                border: `2px solid ${isSelected ? border : '#e2e8f0'}`,
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                            }}
                            onClick={() => selectCategory(key)}
                        >
                            <div
                                className="p-3 rounded-3 flex-shrink-0"
                                style={{ background: isSelected ? bg : '#f1f5f9', color: isSelected ? color : '#94a3b8' }}
                            >
                                <Icon size={22} />
                            </div>
                            <div className="flex-grow-1">
                                <div className="fw-800" style={{ fontSize: 14, color: isSelected ? color : '#1e293b' }}>
                                    {label}
                                </div>
                                <div className="text-muted" style={{ fontSize: 12 }}>{sublabel}</div>
                            </div>
                            <div
                                className="rounded-circle flex-shrink-0 border border-2"
                                style={{
                                    width: 22, height: 22,
                                    borderColor: isSelected ? color : '#cbd5e1',
                                    background: isSelected ? color : 'transparent',
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            <div>
                <label className="form-label fw-700 extra-small text-uppercase tracking-wider">
                    Justification / Notes <span className="text-muted">(optional)</span>
                </label>
                <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide reason for this classification if required..."
                    value={formData?.notes || ''}
                    onChange={e => onChange({ ...formData, notes: e.target.value })}
                    style={{ fontSize: 13, borderRadius: 12 }}
                />
            </div>
        </div>
    );
}
