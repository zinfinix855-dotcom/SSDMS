import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

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
            toast.success('Access Granted. Session Authenticated.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-root">
            <div className="login-visuals">
                <div className="gradient-overlay" />
                <div className="grid-background" />
                <div className="floating-orbs">
                    <div className="orb orb-primary" />
                    <div className="orb orb-secondary" />
                </div>
            </div>

            <div className="login-content">
                <div className="login-card-premium animate-slide-in">
                    <div className="text-center mb-10">
                        <div className="icon-badge mb-4">
                            <ShieldCheck size={32} className="text-primary" />
                        </div>
                        <h1 className="gradient-text display-font mb-2" style={{ fontSize: '32px' }}>Zenith Gateway</h1>
                        <p className="text-dim extra-small tracking-widest fw-700">SSDMS SECURE ORCHESTRATION PROTOCOL</p>
                    </div>

                    <form onSubmit={handleSubmit} className="d-flex flex-column gap-6">
                        <div className="input-field">
                            <label>IDENTIFIER</label>
                            <div className="input-wrapper">
                                <User size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Employee ID / Email" 
                                    value={authId}
                                    onChange={e => setAuthId(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-field">
                            <label>ACCESS KEY</label>
                            <div className="input-wrapper">
                                <Lock size={18} />
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="premium-btn w-100 py-4 mt-4 d-flex align-items-center justify-content-center gap-3"
                            disabled={loading}
                        >
                            {loading ? 'VERIFYING...' : 'AUTHENTICATE SESSION'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-top border-light d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <Cpu size={14} className="text-accent" />
                            <span className="extra-small text-dim fw-600">Encrypted v256-GCM</span>
                        </div>
                        <span className="extra-small text-dim fw-600">Build 3.0.4-LTS</span>
                    </div>
                </div>
            </div>

            <style>{`
                .login-root {
                    height: 100vh; width: 100vw; background: #020617; 
                    display: flex; position: relative; overflow: hidden;
                }
                .login-visuals {
                    position: absolute; inset: 0; pointer-events: none;
                }
                .grid-background {
                    position: absolute; inset: 0; 
                    background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 50px 50px;
                    mask-image: radial-gradient(circle at center, black, transparent 80%);
                }
                .floating-orbs .orb {
                    position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
                }
                .orb-primary { width: 400px; height: 400px; background: var(--primary); top: -100px; right: -100px; }
                .orb-secondary { width: 500px; height: 500px; background: var(--secondary); bottom: -200px; left: -200px; }
                
                .login-content {
                    position: relative; z-index: 10; flex: 1; display: flex; align-items: center; justify-content: center;
                    padding: 40px;
                }
                .login-card-premium {
                    background: rgba(15, 23, 42, 0.6); backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--border-light); border-radius: 32px;
                    padding: 60px; width: 100%; max-width: 540px;
                    box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
                }
                .icon-badge {
                    width: 64px; height: 64px; border-radius: 18px; background: rgba(59, 130, 246, 0.1);
                    display: flex; align-items: center; justify-content: center; margin: 0 auto;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }
                .input-field label {
                    display: block; font-size: 10px; font-weight: 800; color: var(--text-dim);
                    letter-spacing: 0.1em; margin-bottom: 12px;
                }
                .input-wrapper {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border-light);
                    border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; gap: 16px;
                    transition: var(--transition-smooth);
                }
                .input-wrapper:focus-within { border-color: var(--primary); background: rgba(255,255,255,0.06); }
                .input-wrapper input { background: transparent; border: none; outline: none; color: white; width: 100%; font-weight: 500; }
                .input-wrapper svg { color: var(--text-dim); }
                .mb-10 { margin-bottom: 2.5rem; }
                .mb-12 { margin-bottom: 3rem; }
                .mt-12 { margin-top: 3rem; }
                .gap-6 { gap: 1.5rem; }
            `}</style>
        </div>
    );
}
