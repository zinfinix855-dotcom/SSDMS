import { Search, ClipboardList, Stethoscope } from 'lucide-react';

export default function SearchHero({ 
    stageName, 
    searchTerm, 
    setSearchTerm, 
    handleSearch, 
    loading, 
    isNewAdmission, 
    setIsNewAdmission,
    setFileData
}) {
    return (
        <div className="glass-card p-4 mb-5 border-0 shadow-sm" style={{ background: 'white' }}>
            <div className="row align-items-center">
                <div className="col-lg-6">
                    <h4 className="fw-800 mb-1 d-flex align-items-center gap-2">
                        <ClipboardList className="text-primary" />
                        {stageName === 'Admission' ? 'Admission Workflow' : 'Patient File Lookup'}
                    </h4>
                    <p className="text-muted small mb-0">
                        {stageName === 'Admission'
                            ? 'Admit new patients or lookup existing visits for correction.'
                            : 'Enter Visit ID or CNIC to begin processing.'}
                    </p>
                </div>
                <div className="col-lg-6 d-flex gap-2">
                    <form onSubmit={handleSearch} className="position-relative flex-grow-1">
                        <input
                            type="text"
                            className="form-control form-control-lg border-0 bg-light rounded-4 px-4 py-3"
                            placeholder="Search Visit Number..."
                            style={{ fontSize: '14px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary position-absolute end-0 top-0 h-100 rounded-4 px-4 m-1 shadow-sm"
                            disabled={loading}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm" /> : <Search size={18} />}
                        </button>
                    </form>
                    {stageName === 'Admission' && (
                        <button
                            className={`btn btn-lg rounded-4 px-4 fw-700 transition-all ${isNewAdmission ? 'btn-primary shadow' : 'btn-light border'}`}
                            onClick={() => { setIsNewAdmission(true); setFileData(null); }}
                        >
                            Admit New
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
