import { Bell, Search, Zap, Globe, Shield, Moon, Sun, LayoutGrid, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHospital } from '../context/HospitalContext';

export default function ZenithHeader({ title }) {
    const { user, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { selectedHospitalId, setHospital, hospitals, activeHospitalName } = useHospital();

    return (
        <header className="zenith-header justify-content-between">
            <div className="d-flex align-items-center gap-8">
                <div className="page-title-box">
                    <h1 className="m-0" style={{ fontSize: '18px', fontWeight: 600 }}>{title || 'SSDMS Command'}</h1>
                </div>

                {/* Hospital Selector for Admin, or Hospital Badge for standard users */}
                <div className="hospital-context-container d-flex align-items-center">
                    {isAdmin ? (
                        <div className="d-flex align-items-center gap-2">
                            <Building2 size={16} className="text-primary" />
                            <select 
                                className="hospital-select"
                                value={selectedHospitalId || ''}
                                onChange={(e) => setHospital(e.target.value)}
                            >
                                {hospitals.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="hospital-badge">
                            <Building2 size={16} className="text-muted" />
                            <span>{activeHospitalName}</span>
                        </div>
                    )}
                </div>
                
                <div className="search-bar d-none d-xl-flex">
                    <Search size={16} className="text-dim" />
                    <input type="text" placeholder="Search patient or record..." />
                </div>
            </div>

            <div className="d-flex align-items-center gap-6">
                <div className="theme-toggle" onClick={toggleTheme} title="Toggle Appearance">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </div>

                <div className="d-flex align-items-center gap-3 px-4 py-2 rounded-3 bg-input border border-light">
                    <div className="status-indicator" />
                    <span className="extra-small fw-800 text-muted tracking-widest">LIVE OPS</span>
                </div>

                <div className="d-flex align-items-center gap-4 border-start border-light ps-6">
                    <button className="toolbar-btn"><Zap size={18} /></button>
                    <button className="toolbar-btn position-relative">
                        <Bell size={18} />
                        <div className="notif-badge" />
                    </button>
                </div>
            </div>

            <style>{`
                .search-bar {
                    background: var(--bg-input); border: 1px solid var(--border-light);
                    border-radius: 10px; padding: 8px 16px; width: 340px; align-items: center; gap: 12px;
                }
                .search-bar input { background: transparent; border: none; padding: 0; font-size: 13px; }
                
                .hospital-select {
                    background: var(--bg-input); border: 1px solid var(--border-light);
                    border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 500;
                    color: var(--text-main); outline: none; cursor: pointer;
                    transition: var(--transition-smooth); max-width: 250px;
                }
                .hospital-select:hover { border-color: var(--primary); }
                .hospital-select option { background: var(--bg-surface); color: var(--text-main); }

                .hospital-badge {
                    display: flex; align-items: center; gap: 8px;
                    padding: 8px 16px; background: var(--bg-input);
                    border: 1px solid var(--border-light); border-radius: 10px;
                    font-size: 13px; font-weight: 500; color: var(--text-muted);
                }

                .theme-toggle {
                    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
                    border-radius: 10px; cursor: pointer; color: var(--text-muted);
                    transition: var(--transition-smooth); border: 1px solid transparent;
                }
                .theme-toggle:hover { background: var(--bg-input); border-color: var(--border-light); color: var(--text-main); }
                
                .status-indicator {
                    width: 6px; height: 6px; background: var(--accent); border-radius: 50%;
                    box-shadow: 0 0 10px var(--accent);
                }
                
                .toolbar-btn {
                    background: transparent; border: none; color: var(--text-muted); cursor: pointer;
                    transition: var(--transition-smooth); display: flex; align-items: center; justify-content: center;
                }
                .toolbar-btn:hover { color: var(--primary); transform: translateY(-1px); }
                
                .notif-badge {
                    position: absolute; top: -2px; right: -2px; width: 6px; height: 6px;
                    background: var(--danger); border-radius: 50%; border: 2px solid var(--bg-surface);
                }
                .ps-6 { padding-left: 1.5rem; }
            `}</style>
        </header>
    );
}
