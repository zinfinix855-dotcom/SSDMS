import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog — Premium styled confirmation modal.
 * Replaces window.confirm for critical workflow actions.
 */
export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary', // 'primary' | 'danger' | 'warning'
    loading = false,
}) {
    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!isOpen) return null;

    const variantMap = {
        primary: { icon: null,             btn: 'btn-primary',       iconBg: 'bg-primary' },
        danger:  { icon: <AlertTriangle />, btn: 'btn-danger',        iconBg: 'bg-danger'  },
        warning: { icon: <AlertTriangle />, btn: 'btn-warning text-dark', iconBg: 'bg-warning' },
    };
    const v = variantMap[variant] || variantMap.primary;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="glass-card p-5 shadow-xl animate-fade-in"
                style={{ maxWidth: 440, width: '90%', border: 'none' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center gap-3">
                        {v.icon && (
                            <div className={`p-2 rounded-3 ${v.iconBg} bg-opacity-10 text-${variant}`}>
                                {v.icon}
                            </div>
                        )}
                        <h5 className="fw-800 mb-0">{title}</h5>
                    </div>
                    <button className="btn btn-light rounded-circle p-2" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <p className="text-muted mb-5" style={{ lineHeight: 1.7 }}>{message}</p>

                {/* Actions */}
                <div className="d-flex gap-3 justify-content-end">
                    <button className="btn btn-light rounded-pill px-4 fw-700" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`btn ${v.btn} rounded-pill px-4 fw-700 d-flex align-items-center gap-2`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading && <span className="spinner-border spinner-border-sm" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
