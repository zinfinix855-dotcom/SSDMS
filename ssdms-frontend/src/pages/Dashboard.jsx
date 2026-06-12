import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import PipelineView from '../components/dashboard/PipelineView';
import useSocket from '../hooks/useSocket';
import toast from 'react-hot-toast';
import {
    FileText,
    Activity,
    AlertCircle,
    CheckCircle,
    Zap,
    LayoutGrid,
    Activity as HealthIcon,
    Shield
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { motion } from 'framer-motion';

const CARD_CONFIGS = [
    { key: 'totalFiles', label: 'Registered', sublabel: 'System Admissions', Icon: FileText, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)', route: '/search', trend: 'up', trendValue: 8 },
    { key: 'inProgress', label: 'Processing', sublabel: 'Workflow Pipeline', Icon: Activity, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.05)', route: '/search?status=In+Progress', trend: 'up', trendValue: 12 },
    { key: 'objected', label: 'Exceptions', sublabel: 'Compliance Blocks', Icon: AlertCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)', route: '/search?status=Objected', trend: 'down', trendValue: 4 },
    { key: 'completed', label: 'Finalized', sublabel: 'Archived Assets', Icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', route: '/search?status=Completed', trend: 'up', trendValue: 15 },
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
};

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activityLog, setActivityLog] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchStats = useCallback(() => {
        setLoading(true);
        API.get('/dashboard/stats')
            .then((res) => setStats(res.stats))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useSocket(useCallback((event) => {
        const { event: eventName, visitNumber, toStage, type, eventId, timestamp } = event;

        setActivityLog(prev => {
            if (prev.some(log => log.id === (eventId || timestamp))) return prev;
            const newLog = {
                id: eventId || timestamp || Math.random().toString(),
                visitNumber,
                to: toStage || 'Registry Update',
                type: type || eventName,
                timestamp: timestamp || new Date()
            };

            if (['WORKFLOW_STATE_CHANGED', 'BULK_ACTION_COMPLETED'].includes(eventName)) {
                fetchStats();
            }

            return [newLog, ...prev].slice(0, 10);
        });

        if (eventName === 'SLA_VIOLATION') {
            toast.error(`SLA Breach: File ${visitNumber} delay detected.`, { id: `sla-${visitNumber}` });
        }
    }, [fetchStats]), { type: 'feed' });

    const getStatValue = (key) => stats ? Number(stats[key] || 0) : 0;

    return (
        <Layout title="Operations Center">
            <PageTransition>
                <motion.div 
                    className="d-flex flex-column gap-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    
                    {/* ── Zenith Dashboard Hero ── */}
                    <motion.div variants={itemVariants} className="zenith-card dashboard-hero p-10 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <div className="d-flex align-items-center gap-3 mb-6">
                                    <div className="live-pill">
                                        <div className="pulse-dot" /> LIVE OPS
                                    </div>
                                    <span className="extra-small text-dim fw-700 tracking-widest uppercase">System Health: Optimal</span>
                                </div>
                                <h1 className="m-0 mb-3" style={{ fontSize: '36px', letterSpacing: '-1px' }}>
                                    Operational Overview
                                </h1>
                                <p className="text-muted fw-500 mb-10" style={{ maxWidth: '480px', fontSize: '15px', lineHeight: 1.6 }}>
                                    Greetings, <strong className="text-main">{user?.name}</strong>. The SSDMS orchestration pipeline is currently managing <span className="text-primary fw-800">{getStatValue('totalFiles')}</span> clinical records.
                                </p>
                                <div className="d-flex gap-3">
                                    <button className="premium-btn" onClick={() => navigate('/search')}>
                                        <LayoutGrid size={16} /> REPOSITORY ACCESS
                                    </button>
                                    <button className="btn-secondary-zenith" onClick={() => navigate('/stage/Admission')}>
                                        <Zap size={16} /> NEW ADMISSION
                                    </button>
                                </div>
                            </div>
                            <div className="hero-status-box d-none d-xl-flex">
                                <div className="health-gauge">
                                    <Shield size={120} className="text-primary opacity-10" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Metric Grid ── */}
                    <div className="row g-6">
                        {CARD_CONFIGS.map(config => (
                            <motion.div key={config.key} variants={itemVariants} className="col-12 col-md-6 col-xl-3">
                                <StatCard 
                                    {...config} 
                                    value={loading ? '...' : getStatValue(config.key)} 
                                    onClick={() => navigate(config.route)}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Insights ── */}
                    <div className="row g-8">
                        <motion.div variants={itemVariants} className="col-12 col-xl-8">
                            <PipelineView stats={stats} />
                        </motion.div>
                        <motion.div variants={itemVariants} className="col-12 col-xl-4">
                            <div className="zenith-card h-100 p-0 overflow-hidden d-flex flex-column">
                                <div className="p-6 border-bottom border-light d-flex justify-content-between align-items-center">
                                    <h4 className="m-0" style={{ fontSize: '15px' }}>Live Activity Feed</h4>
                                    <HealthIcon size={16} className="text-dim" />
                                </div>
                                <div className="flex-grow-1 p-6 overflow-y-auto custom-scrollbar d-flex flex-column gap-5" style={{ maxHeight: '440px' }}>
                                    {activityLog.length === 0 ? (
                                        <div className="text-center py-12 text-dim extra-small fw-700">WAITING FOR SYSTEM EMISSIONS...</div>
                                    ) : (
                                        activityLog.map(log => (
                                            <div key={log.id} className="activity-item">
                                                <div className="activity-indicator" />
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span className="extra-small fw-800 text-primary">{log.visitNumber}</span>
                                                    <span className="extra-small text-dim">{new Date(log.timestamp).toLocaleTimeString([], { hour: false, minute: '2-digit' })}</span>
                                                </div>
                                                <p className="m-0 extra-small fw-600 text-main">Moved to <span className="text-accent">{log.to}</span></p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </PageTransition>

            <style>{`
                .dashboard-hero {
                    background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-deep) 100%);
                    border-left: 4px solid var(--primary);
                }
                .live-pill {
                    background: var(--primary-glow); color: var(--primary); font-size: 9px;
                    font-weight: 900; letter-spacing: 0.15em; padding: 4px 12px; border-radius: 99px;
                    display: flex; align-items: center; gap: 8px;
                }
                .pulse-dot {
                    width: 6px; height: 6px; background: var(--primary); border-radius: 50%;
                    animation: pulse-op 1.5s infinite;
                }
                @keyframes pulse-op {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(0.8); opacity: 0.5; }
                }
                .activity-item { position: relative; padding-left: 20px; }
                .activity-indicator {
                    position: absolute; left: 0; top: 4px; bottom: -20px; width: 1px;
                    background: var(--border-light);
                }
                .activity-indicator::before {
                    content: ''; position: absolute; top: 0; left: -2px; width: 5px; height: 5px;
                    background: var(--primary); border-radius: 50%;
                }
                .activity-item:last-child .activity-indicator { bottom: 0; background: transparent; }
                
                .gap-10 { gap: 2.5rem; }
            `}</style>
        </Layout>
    );
}
