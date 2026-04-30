import { Trash2 } from 'lucide-react';

export default function FinanceForm({ formData, setFormData }) {
    const addSplit = () => {
        const splits = formData.splits || [];
        setFormData({
            ...formData,
            splits: [...splits, { doctor_name: '', amount: '', remarks: '' }]
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
        <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-700 mb-0">Finance Split Records</label>
                <button type="button" className="btn btn-sm btn-primary rounded-pill px-3" onClick={addSplit}>
                    + Add Split
                </button>
            </div>
            <div className="bg-light rounded-4 p-3">
                {(formData.splits || []).length === 0 ? (
                    <div className="text-center py-4 text-muted small">No split records added. Click "Add Split" to begin.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm table-borderless align-middle mb-0">
                            <thead>
                                <tr className="extra-small text-muted fw-bold">
                                    <th>DOCTOR / RESOURCE</th>
                                    <th>AMOUNT</th>
                                    <th>STATUS</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.splits.map((s, i) => (
                                    <tr key={i}>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-0 bg-white"
                                                placeholder="Doctor Name"
                                                value={s.doctor_name}
                                                onChange={(e) => updateSplit(i, 'doctor_name', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm border-0 bg-white"
                                                placeholder="0.00"
                                                value={s.amount}
                                                onChange={(e) => updateSplit(i, 'amount', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className="form-select form-select-sm border-0 bg-white"
                                                value={s.status}
                                                onChange={(e) => updateSplit(i, 'status', e.target.value)}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Hold">Hold</option>
                                            </select>
                                        </td>
                                        <td className="text-end">
                                            <button type="button" className="btn btn-sm text-danger" onClick={() => removeSplit(i)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
