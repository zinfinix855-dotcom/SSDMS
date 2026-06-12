export default function AdmissionForm({ formData, setFormData }) {
    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    return (
        <div className="d-flex flex-column gap-8">
            <div className="row g-6">
                <div className="col-md-6">
                    <div className="zenith-form-field">
                        <label>PATIENT FULL NAME</label>
                        <input
                            type="text"
                            placeholder="Full Legal Name"
                            value={formData.patient_name || ''}
                            onChange={(e) => handleChange('patient_name', e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="zenith-form-field">
                        <label>SSC VISIT IDENTIFIER</label>
                        <input
                            type="text"
                            placeholder="SSC-123456"
                            value={formData.ssc_visit_number || ''}
                            onChange={(e) => handleChange('ssc_visit_number', e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="zenith-form-field">
                        <label>HOSPITAL MR NUMBER</label>
                        <input
                            type="text"
                            placeholder="MR-9988"
                            value={formData.mr_number || ''}
                            onChange={(e) => handleChange('mr_number', e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="zenith-form-field">
                        <label>PATIENT CNIC (ID)</label>
                        <input
                            type="text"
                            placeholder="12345-1234567-1"
                            value={formData.cnic || ''}
                            onChange={(e) => handleChange('cnic', e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-12">
                    <div className="zenith-form-field">
                        <label>ASSIGNED FACILITY</label>
                        <input
                            type="text"
                            placeholder="Facility Name"
                            value={formData.hospital_name || ''}
                            onChange={(e) => handleChange('hospital_name', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .zenith-form-field label {
                    display: block; font-size: 10px; font-weight: 800; color: var(--text-dim);
                    letter-spacing: 0.1em; margin-bottom: 12px; text-transform: uppercase;
                }
                .zenith-form-field input {
                    width: 100%; background: var(--bg-main); border: 1px solid var(--border-light);
                    border-radius: 12px; padding: 14px 18px; color: var(--text-main); outline: none;
                    font-weight: 600; font-size: 14px; transition: var(--transition-smooth);
                }
                .zenith-form-field input:focus {
                    border-color: var(--primary); background: var(--bg-surface);
                    box-shadow: 0 0 0 4px var(--primary-glow);
                }
            `}</style>
        </div>
    );
}
