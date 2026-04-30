import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [authId, setAuthId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(authId, password);
            toast.success('Access Granted. Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <img
                src="/login_background_abstract_medical_1772617987910.png"
                alt="Background"
                className="login-bg-image"
            />
            <div className="login-overlay"></div>

            {/* Animated Background Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            <div className="login-card p-5 animate-slide-up">
                {/* Header */}
                <div className="text-center mb-5">
                    <div className="logo-container animate-pulse-slow">
                        <ShieldCheck size={42} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <h2 className="login-title mt-4 mb-2">SSDMS Secure Access</h2>
                    <p className="login-subtitle">
                        Sehat Sahulat Department Management System
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label className="premium-label">IDENTIFICATION</label>
                        <div className="premium-input-group">
                            <span className="input-icon">
                                <User size={18} />
                            </span>
                            <input
                                type="text"
                                className="premium-input"
                                placeholder="Employee ID or Email"
                                value={authId}
                                onChange={e => setAuthId(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group mb-5">
                        <label className="premium-label">ACCESS KEY</label>
                        <div className="premium-input-group">
                            <span className="input-icon">
                                <Lock size={18} />
                            </span>
                            <input
                                type="password"
                                className="premium-input"
                                placeholder="Enter your secure password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="premium-btn w-100"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="d-flex align-items-center justify-content-center gap-2">
                                <span className="spinner-border spinner-border-sm" />
                                Authenticating...
                            </span>
                        ) : (
                            <span className="d-flex align-items-center justify-content-center gap-2">
                                Secure Sign In
                                <ArrowRight size={20} className="btn-icon" />
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-center mt-5">
                    <div className="status-badge">
                        <div className="status-dot"></div>
                        <span>System Online & Secure. Encrypted connection.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
