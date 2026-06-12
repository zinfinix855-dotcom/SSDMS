import { Trash2, Plus, Banknote } from 'lucide-react';

export default function FinanceForm({ formData, setFormData }) {
    const addSplit = () => {
        const splits = formData.splits || [];
        setFormData({
            ...formData,
            splits: [...splits, { doctor_name: '', amount: '', status: 'Pending' }]
        });
    };

    const removeSplit = (index) => {
        const splits = [...(formData.splits || [])];
        splits.splice(index, 1);
        setFormData({ ...formData, splits });
    };

    const updateSplit = (index, field, value) => {
        const splits = [...(formData.splits || [])];
        splits[index][field] = value;
        setFormData({ ...formData, splits });
    };

    return (
        <div className="d-flex flex-column gap-6 w-100">
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <div className="icon-badge-sm">
                        <Banknote size={16} />
                    </div>
                    <label className="m-0 extra-small fw-800 text-dim tracking-widest text-uppercase">Treasury Allocation Splits</label>
                </div>
                <button type="button" className="premium-btn py-2 px-4" style={{ fontSize: '11px' }} onClick={addSplit}>
                    <Plus size={14} /> ALLOCATE RESOURCE
                </button>
            </div>

            <div className="zenith-card p-0 bg-transparent border-light">
                <table className="zenith-table-input">
                    <thead>
                        <tr>
                            <th>RECIPIENT / DOCTOR</th>
                            <th>TOTAL ALLOCATION</th>
                            <th>DISBURSEMENT STATUS</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {(formData.splits || []).length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-dim extra-small fw-700">NO FINANCIAL ENTRIES RECORDED</td>
                            </tr>
                        ) : (
                            formData.splits.map((s, i) => (
                                <tr key={i}>
                                    <td>
                                        <input
                                            type="text"
                                            className="zenith-input-sm"
                                            placeholder="Recipient Identifier"
                                            value={s.doctor_name}
                                            onChange={(e) => updateSplit(i, 'doctor_name', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="zenith-input-sm"
                                            placeholder="0.00"
                                            value={s.amount}
                                            onChange={(e) => updateSplit(i, 'amount', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="zenith-select-sm"
                                            value={s.status}
                                            onChange={(e) => updateSplit(i, 'status', e.target.value)}
                                        >
                                            <option value="Pending">Pending Audit</option>
                                            <option value="Paid">Disbursed</option>
                                            <option value="Hold">On Hold</option>
                                        </select>
                                    </td>
                                    <td className="text-end">
                                        <button type="button" className="btn-icon-danger-sm" onClick={() => removeSplit(i)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .zenith-table-input { width: 100%; border-collapse: collapse; }
                .zenith-table-input th { 
                    padding: 12px 20px; text-align: left; font-size: 9px; font-weight: 800; 
                    color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em;
                    border-bottom: 1px solid var(--border-light);
                }
                .zenith-table-input td { padding: 12px 20px; border-bottom: 1px solid var(--border-light); }
                
                .zenith-input-sm, .zenith-select-sm {
                    width: 100%; background: var(--bg-main); border: 1px solid var(--border-light);
                    border-radius: 8px; padding: 10px 14px; color: var(--text-main); outline: none;
                    font-size: 13px; font-weight: 600; transition: var(--transition-smooth);
                }
                .zenith-input-sm:focus, .zenith-select-sm:focus { border-color: var(--primary); background: var(--bg-surface); }
                
                .zenith-select-sm option { background: var(--bg-surface); color: var(--text-main); }
                
                .btn-icon-danger-sm {
                    background: transparent; border: none; color: #ef4444; opacity: 0.5; transition: 0.3s;
                }
                .btn-icon-danger-sm:hover { opacity: 1; transform: scale(1.1); }
            `}</style>
        </div>
    );
}
