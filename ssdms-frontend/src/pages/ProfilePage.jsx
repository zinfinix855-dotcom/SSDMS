import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/AuthService';
import { 
    ShieldCheck, 
    Smartphone, 
    CheckCircle2, 
    AlertTriangle,
    QrCode,
    LogOut,
    User,
    Mail,
    Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.two_factor_enabled);
    const [qrCode, setQrCode] = useState(null);
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Initial, 2: Setup (QR), 3: Verifying
    const [loading, setLoading] = useState(false);

    const handleEnable2FA = async () => {
        setLoading(true);
        try {
            const res = await AuthService.setup2FA();
            setQrCode(res.qrCodeUrl);
            setStep(2);
        } catch {
            toast.error('Failed to initialize 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await AuthService.confirm2FA(otp);
            setIs2FAEnabled(true);
            setStep(1);
            toast.success('Two-Factor Authentication is now ENABLED');
            // Suggest re-login or update context
        } catch {
            toast.error('Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Profile & Security">
            <div className="row g-4 animate-fade-in">
                
                {/* ── User Overview ── */}
                <div className="col-lg-4">
                    <div className="glass-card p-4 text-center">
                        <div className="avatar-circle mx-auto mb-3 bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, fontSize: '2rem', borderRadius: '50%' }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <h4 className="fw-900 mb-1">{user?.name}</h4>
                        <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-800 mb-4" style={{ fontSize: 10 }}>
                            {user?.role_name?.toUpperCase()}
                        </div>
                        
                        <div className="text-start space-y-3">
                            <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                                <Mail size={18} className="text-muted" />
                                <div>
                                    <div className="extra-small text-muted fw-700">EMAIL ADDRESS</div>
                                    <div className="small fw-800">{user?.email || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                                <Smartphone size={18} className="text-muted" />
                                <div>
                                    <div className="extra-small text-muted fw-700">EMPLOYEE ID</div>
                                    <div className="small fw-800">{user?.employee_id}</div>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-outline-danger w-100 mt-4 rounded-pill fw-800 py-2 d-flex align-items-center justify-content-center gap-2" onClick={logout}>
                            <LogOut size={16} /> SIGN OUT
                        </button>
                    </div>
                </div>

                {/* ── Security Configuration ── */}
                <div className="col-lg-8">
                    <div className="glass-card mb-4">
                        <div className="p-4 border-bottom d-flex align-items-center gap-3">
                            <div className="p-2 bg-primary text-white rounded-3 shadow-sm">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h5 className="fw-900 mb-0">Two-Factor Authentication</h5>
                                <p className="extra-small text-muted mb-0 fw-700">Protect your enterprise identity with TOTP security.</p>
                            </div>
                            {is2FAEnabled && (
                                <span className="ms-auto badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 d-flex align-items-center gap-1 fw-800" style={{ fontSize: 10 }}>
                                    <CheckCircle2 size={14} /> ACTIVE
                                </span>
                            )}
                        </div>

                        <div className="p-4">
                            {is2FAEnabled ? (
                                <div className="text-center py-4">
                                    <div className="p-4 bg-success bg-opacity-5 rounded-4 border border-success border-opacity-10 mb-4">
                                        <Smartphone size={48} className="text-success mb-3" />
                                        <h5 className="fw-900 text-success">MFA Protection is On</h5>
                                        <p className="text-muted small mx-auto" style={{ maxWidth: 400 }}>
                                            Your account is secured with 2FA. Every time you sign in, you'll be asked for a verification code from your authenticated device.
                                        </p>
                                    </div>
                                    <button className="btn btn-light rounded-pill px-4 fw-800" disabled>
                                        DISABLE 2FA (CONTACT ADMIN)
                                    </button>
                                </div>
                            ) : step === 1 ? (
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <h6 className="fw-800 mb-2">Enhance Account Security</h6>
                                        <p className="text-muted small mb-0">
                                            Add an extra layer of protection to your account by configuring a mobile authenticator app (Google Authenticator, Microsoft Authenticator, or Authy).
                                        </p>
                                    </div>
                                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                                        <button className="btn btn-primary rounded-pill px-4 fw-800" onClick={handleEnable2FA} disabled={loading}>
                                            {loading ? 'INITIALIZING...' : 'ENABLE MFA'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-slide-in-right">
                                    <div className="row g-4 align-items-center">
                                        <div className="col-md-5 text-center">
                                            <div className="p-3 bg-white shadow-sm rounded-4 border d-inline-block">
                                                {qrCode ? (
                                                    <img src={qrCode} alt="Security QR Code" style={{ width: 180, height: 180 }} />
                                                ) : (
                                                    <div className="spinner-border text-primary" />
                                                )}
                                            </div>
                                            <div className="mt-2 extra-small text-muted fw-700">QR CODE GENERATED</div>
                                        </div>
                                        <div className="col-md-7">
                                            <h6 className="fw-900 mb-3 d-flex align-items-center gap-2">
                                                <QrCode size={18} /> Step 2: Configure App
                                            </h6>
                                            <ol className="small text-muted ps-3 space-y-2 mb-4">
                                                <li>Open your Authenticator app.</li>
                                                <li>Select 'Scan QR Code' or '+' and scan the image.</li>
                                                <li>Enter the 6-digit verification code below.</li>
                                            </ol>
                                            
                                            <form onSubmit={handleConfirm2FA}>
                                                <div className="form-group mb-3">
                                                    <label className="extra-small fw-800 text-muted mb-2">VERIFICATION CODE</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control form-control-lg text-center fw-900 rounded-4 tracking-widest"
                                                        placeholder="000 000"
                                                        maxLength="6"
                                                        value={otp}
                                                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                        required
                                                    />
                                                </div>
                                                <button className="btn btn-primary w-100 rounded-pill fw-800 py-2 shadow-sm" type="submit" disabled={loading}>
                                                    {loading ? 'VERIFYING...' : 'CONFIRM & ACTIVATE'}
                                                </button>
                                                <button className="btn btn-link w-100 extra-small mt-2 text-muted fw-700" onClick={() => setStep(1)}>
                                                    CANCEL SETUP
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-4" style={{ borderLeft: '4px solid #fbbf24' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 bg-warning bg-opacity-10 text-warning rounded-3">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h6 className="fw-800 mb-0">System Security Policy</h6>
                                <p className="extra-small text-muted mb-0 fw-700">Enterprise SSDMS requires MFA for all Administrative roles. System access may be restricted if 2FA remains disabled.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
