import { MessageSquare, Send } from 'lucide-react';

export default function AuditThread({ comments, newComment, setNewComment, handleAddComment, submitting }) {
    return (
        <div className="glass-card border-0 p-0 overflow-hidden shadow-sm h-100" style={{ background: 'white' }}>
            <div className="p-4 border-bottom d-flex align-items-center gap-3 bg-light bg-opacity-50">
                <MessageSquare className="text-primary" size={20} />
                <h6 className="mb-0 fw-800">Internal Audit Thread</h6>
            </div>
            <div className="p-4">
                <form onSubmit={handleAddComment} className="mb-4">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control border-light bg-light rounded-4-start"
                            placeholder="Add internal note..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button className="btn btn-primary rounded-4-end px-4" type="submit" disabled={submitting || !newComment.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </form>

                <div className="d-flex flex-column gap-3">
                    {comments.length === 0 ? (
                        <p className="text-center py-4 text-muted small italic">No internal logs available.</p>
                    ) : comments.map((c) => (
                        <div key={c.id} className="p-3 bg-light rounded-4 border-0">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="fw-800 extra-small">{c.employee_name}</span>
                                <span className="extra-small text-muted">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="mb-0 small text-dark opacity-75">{c.comment}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
