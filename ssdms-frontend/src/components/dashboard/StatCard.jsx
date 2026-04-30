import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
export default function StatCard({ label, value, sublabel, Icon, color, bg, trend, trendValue, onClick }) {
    const isPositive = trend === 'up';

    return (
        <div 
            className="glass-card p-4 h-100 cursor-pointer stat-card-hover border-0 shadow-sm"
            onClick={onClick}
            style={{ 
                background: `linear-gradient(145deg, #ffffff 0%, ${bg}22 100%)`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Subtle background glow */}
            <div className="position-absolute" style={{ 
                top: '-20%', 
                right: '-20%', 
                width: '150px', 
                height: '150px', 
                background: `radial-gradient(circle, ${color}11 0%, transparent 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none'
            }} />

            <div className="d-flex justify-content-between align-items-start mb-3 position-relative z-index-1">
                <div className="p-3 rounded-4 shadow-sm border border-white" style={{ background: bg, color: color }}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`d-flex align-items-center gap-1 extra-small fw-800 px-2 py-1 rounded-pill ${isPositive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trendValue}%
                    </div>
                )}
            </div>
            
            <div className="mb-3 position-relative z-index-1">
                <div className="stat-value fw-900 mb-0" style={{ fontSize: '1.75rem', letterSpacing: '-1px', color: '#0f172a' }}>
                    {value}
                </div>
                <div className="text-muted extra-small fw-800 text-uppercase tracking-wider" style={{ fontSize: '10px' }}>{label}</div>
            </div>

            <div className="d-flex align-items-center justify-content-between border-top border-white border-opacity-50 pt-3 mt-auto position-relative z-index-1">
                <span className="extra-small text-muted fw-700">{sublabel}</span>
                <div className="p-2 rounded-circle bg-white border shadow-sm transition-all arrow-indicator">
                    <ArrowRight size={14} style={{ color }} />
                </div>
            </div>
        </div>
    );
}
