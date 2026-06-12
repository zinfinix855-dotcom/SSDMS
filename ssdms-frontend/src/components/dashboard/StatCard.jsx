import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, sublabel, Icon, color, bg, trend, trendValue, onClick }) {
    return (
        <div className="zenith-card stat-card-premium" onClick={onClick}>
            <div className="d-flex justify-content-between align-items-start mb-6">
                <div className="stat-icon-wrapper" style={{ background: bg, color: color }}>
                    <Icon size={24} />
                </div>
                <div className={`trend-indicator ${trend}`}>
                    {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{trendValue}%</span>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="stat-value display-font m-0">{value}</h3>
                <p className="stat-label m-0 text-dim fw-700 text-uppercase tracking-widest">{label}</p>
            </div>

            <div className="d-flex align-items-center justify-content-between mt-6 pt-6 border-top" style={{ borderColor: 'var(--border-light)' }}>
                <span className="extra-small text-dim fw-600">{sublabel}</span>
                <ArrowUpRight size={16} className="text-primary opacity-0 icon-reveal" />
            </div>

            <style>{`
                .stat-card-premium { cursor: pointer; position: relative; overflow: hidden; }
                .stat-icon-wrapper {
                    width: 52px; height: 52px; border-radius: 14px; 
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: inset 0 0 20px rgba(255,255,255,0.05);
                }
                .stat-value { font-size: 32px; letter-spacing: -0.04em; }
                .stat-label { font-size: 10px; }
                .trend-indicator {
                    display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 99px;
                    font-size: 11px; font-weight: 800;
                }
                .trend-indicator.up { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .trend-indicator.down { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .stat-card-premium:hover .icon-reveal { opacity: 1; transform: translate(2px, -2px); }
                .stat-card-premium::before {
                    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px;
                    background: linear-gradient(90deg, transparent, var(--primary), transparent);
                    transform: translateX(-100%); transition: transform 0.6s ease;
                }
                .stat-card-premium:hover::before { transform: translateX(100%); }
            `}</style>
        </div>
    );
}
