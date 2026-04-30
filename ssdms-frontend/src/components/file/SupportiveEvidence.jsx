import { Paperclip, FileText, Download } from 'lucide-react';

export default function SupportiveEvidence({ attachments }) {
    return (
        <div className="glass-card border-0 p-0 overflow-hidden shadow-sm h-100" style={{ background: 'white' }}>
            <div className="p-4 border-bottom d-flex align-items-center gap-3 bg-light bg-opacity-50">
                <Paperclip className="text-primary" size={20} />
                <h6 className="mb-0 fw-800">Supportive Evidence</h6>
            </div>
            <div className="p-4">
                <div className="row g-2">
                    {attachments.length === 0 ? (
                        <div className="col-12 text-center py-4 text-muted small opacity-50 italic">No evidence uploaded.</div>
                    ) : attachments.map((att) => (
                        <div key={att.id} className="col-12">
                            <div className="p-3 bg-light rounded-4 d-flex align-items-center justify-content-between border">
                                <div className="d-flex align-items-center gap-3">
                                    <FileText size={20} className="text-primary" />
                                    <div className="min-w-0">
                                        <div className="fw-600 small text-truncate" style={{ maxWidth: 150 }}>{att.file_name}</div>
                                        <div className="extra-small text-muted">{(att.file_size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                </div>
                                <a
                                    href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? ''}/uploads/attachments/${att.file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-white border rounded-circle"
                                >
                                    <Download size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
