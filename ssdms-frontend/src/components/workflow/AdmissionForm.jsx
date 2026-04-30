export default function AdmissionForm({ formData, setFormData }) {
    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    return (
        <div className="row g-4">
            <div className="col-md-6">
                <label className="form-label fw-700">Patient Name</label>
                <input
                    type="text"
                    className="form-control rounded-4 bg-light border-0 p-3"
                    placeholder="Full Legal Name"
                    value={formData.patient_name || ''}
                    onChange={(e) => handleChange('patient_name', e.target.value)}
                />
            </div>
            <div className="col-md-6">
                <label className="form-label fw-700">SSC Visit Number</label>
                <input
                    type="text"
                    className="form-control rounded-4 bg-light border-0 p-3"
                    placeholder="SSC-123456"
                    value={formData.ssc_visit_number || ''}
                    onChange={(e) => handleChange('ssc_visit_number', e.target.value)}
                />
            </div>
            <div className="col-md-6">
                <label className="form-label fw-700">MR Number</label>
                <input
                    type="text"
                    className="form-control rounded-4 bg-light border-0 p-3"
                    placeholder="Hospital MR#"
                    value={formData.mr_number || ''}
                    onChange={(e) => handleChange('mr_number', e.target.value)}
                />
            </div>
            <div className="col-md-6">
                <label className="form-label fw-700">CNIC Number</label>
                <input
                    type="text"
                    className="form-control rounded-4 bg-light border-0 p-3"
                    placeholder="12345-1234567-1"
                    value={formData.cnic || ''}
                    onChange={(e) => handleChange('cnic', e.target.value)}
                />
            </div>
            <div className="col-md-12">
                <label className="form-label fw-700">Hospital Name</label>
                <input
                    type="text"
                    className="form-control rounded-4 bg-light border-0 p-3"
                    placeholder="Assigned Hospital"
                    value={formData.hospital_name || ''}
                    onChange={(e) => handleChange('hospital_name', e.target.value)}
                />
            </div>
        </div>
    );
}
