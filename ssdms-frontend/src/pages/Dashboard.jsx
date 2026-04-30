import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import PipelineView from '../components/dashboard/PipelineView';
import PerformanceCharts from '../components/dashboard/PerformanceCharts';
import useSocket from '../hooks/useSocket';
import toast from 'react-hot-toast';
import {
    FileText,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Activity,
    Zap,
    TrendingUp,
    LayoutGrid
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartTooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area
} from 'recharts';
import { STAGES } from '../constants/stages';
import { PageSkeleton } from '../components/common/Skeleton';

const COLORS = [
    '#2563eb', '#10b981', '#f59e0b', '#ef4444',
    '#06b6d4', '#8b5cf6', '#ec4899', '#6366f1',
    '#14b8a6', '#f97316'
];

const CARD_CONFIGS = [
    { key: 'totalFiles', label: 'Admitted', sublabel: 'Total Active Records', Icon: FileText, color: '#2563eb', bg: '#eff6ff', route: '/search', trend: 'up', trendValue: 8 },
    { key: 'inProgress', label: 'Processing', sublabel: 'Live Operations', Icon: Activity, color: '#8b5cf6', bg: '#f5f3ff', route: '/search?status=In+Progress', trend: 'up', trendValue: 12 },
    { key: 'objected', label: 'Objected', sublabel: 'Requires Correction', Icon: AlertCircle, color: '#f43f5e', bg: '#fff1f2', route: '/search?status=Objected', trend: 'down', trendValue: 4 },
    { key: 'completed', label: 'Completed', sublabel: 'Archived / Finished', Icon: CheckCircle, color: '#10b981', bg: '#ecfdf5', route: '/search?status=Completed', trend: 'up', trendValue: 15 },
];

export function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [leadTime, setLeadTime] = useState([]);
    const [liveAlert, setLiveAlert] = useState(null);
    const [activityLog, setActivityLog] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchStats = useCallback(() => {
        setLoading(true);
        Promise.all([
            API.get('/dashboard/stats'),
            API.get('/dashboard/lead-time')
        ]).then(([statsRes, leadRes]) => {
            setStats(statsRes.data.stats);
            setLeadTime(leadRes.data.leadTime || []);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchStats();
    }, [fetchStats]);

    // ── Real-time event subscription via WebSocket ──
    useSocket(useCallback((event) => {
        const { event: eventName, visitNumber, fromStage, toStage, type, eventId, timestamp } = event;

        // 1. Deduplication using unique eventId
        setActivityLog(prev => {
            if (prev.some(log => log.id === (eventId || timestamp))) return prev;

            const newLog = {
                id: eventId || timestamp || Math.random().toString(),
                visitNumber,
                from: fromStage,
                to: toStage || 'Update',
                type: type || eventName,
                timestamp: timestamp || new Date()
            };

            // 2. Refresh stats on relevant movement (Throttled via fetchStats)
            if (eventName === 'WORKFLOW_STATE_CHANGED' || eventName === 'BULK_ACTION_COMPLETED') {
                fetchStats();
            }

            return [newLog, ...prev].slice(0, 50); // 3. Prevent memory leaks
        });

        if (eventName === 'SLA_VIOLATION') {
            setLiveAlert(event);
            toast.error(
                `⚠️ SLA Breach: File ${visitNumber} in ${event.stage} exceeded ${event.maxHours}h limit.`,
                { duration: 8000, id: `sla-${visitNumber}` }
            );
        }
    }, [fetchStats]), { type: 'feed' });

    if (loading) return (
        <Layout title="Dashboard Overview">
            <PageSkeleton />
        </Layout>
    );

    const getStatValue = (key) => {
        if (!stats) return 0;
        return Number(stats[key] || 0);
    };

    return (
        <Layout title="Dashboard Overview">
            {/* ── Premium Welcome Hero ── */}
            <div className="glass-card mb-3 border-0 overflow-hidden position-relative shadow-sm" 
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '1rem', borderRadius: '12px' }}>
                <div className="position-relative z-index-1">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="p-1 rounded-3" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                            <Zap className="text-primary-light" size={16} />
                        </div>
                        <span className="badge rounded-pill px-2 py-1 fw-700" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '8px', letterSpacing: '0.5px' }}>
                            SYSTEM STATUS: OPERATIONAL
                        </span>
                    </div>
                    <h3 className="fw-900 mb-1 tracking-tighter">Good Day, <span className="gradient-text">{user?.name?.split(' ')[0]}</span></h3>
                    <p className="extra-small opacity-75 mb-2 fw-500" style={{ maxWidth: '400px', fontSize: '11px' }}>
                        The SSDMS Intelligent Engine is currently orchestrating <strong>{getStatValue('totalFiles')}</strong> active hospital workflows.
                    </p>
                    <div className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 fw-800 shadow-sm d-flex align-items-center gap-2" style={{ fontSize: '11px' }} onClick={() => navigate('/search')}>
                            <LayoutGrid size={14} /> GLOBAL REPOSITORY
                        </button>
                    </div>
                </div>
                {/* Decorative Analytics Background */}
                <div className="position-absolute end-0 top-0 h-100 w-50 opacity-20 pointer-events-none" style={{ marginRight: '-5%' }}>
                    <ResponsiveContainer width="110%" height="110%">
                        <AreaChart data={leadTime.length ? leadTime : [{ avg_hours: 0 }, { avg_hours: 10 }]}>
                            <Area type="monotone" dataKey="avg_hours" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} strokeWidth={4} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Live SLA Violation Alert Banner ── */}
            {liveAlert && (
                <div className="d-flex align-items-center gap-4 p-4 mb-4 rounded-4 animate-slide-in-right"
                    style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '1px solid #fecdd3' }}>
                    <div className="p-3 rounded-3 bg-danger text-white shadow-sm">
                        <AlertCircle size={20} />
                    </div>
                    <div className="flex-grow-1">
                        <div className="fw-800 text-danger" style={{ fontSize: 13 }}>SLA BREACH DETECTED</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                            File <strong>{liveAlert.visitNumber}</strong> in <strong>{liveAlert.stage}</strong> has exceeded the {liveAlert.maxHours}h processing limit.
                        </div>
                    </div>
                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setLiveAlert(null)}>Dismiss</button>
                </div>
            )}

            {/* ── 4 Stat Cards — Horizontal Analytics Row ── */}
            <div className="d-flex flex-row gap-4 mb-5 overflow-auto pb-3 custom-scrollbar w-100 flex-nowrap" style={{ overflowX: 'auto' }}>
                {CARD_CONFIGS.map(({ key, label, sublabel, Icon, color, bg, route, trend, trendValue }) => (
                    <div key={key} style={{ minWidth: '280px', flex: '1' }}>
                        <StatCard
                            label={label}
                            value={loading ? '...' : getStatValue(key)}
                            sublabel={sublabel}
                            Icon={Icon}
                            color={color}
                            bg={bg}
                            trend={trend}
                            trendValue={trendValue}
                            onClick={() => navigate(route)}
                        />
                    </div>
                ))}
            </div>

            {/* ── Dashboard Grid: Pipeline + Live Feed ── */}
            <div className="row g-4 mb-5">
                <div className="col-lg-8">
                    <div className="glass-card h-100 p-0 border-0 shadow-sm overflow-hidden">
                        <div className="p-4 border-bottom bg-light d-flex align-items-center justify-content-between">
                            <h5 className="fw-800 mb-0 d-flex align-items-center gap-2">
                                <Zap className="text-warning" size={18} /> STAGE DISTRIBUTION
                            </h5>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">LIVE PIPELINE</span>
                        </div>
                        <div className="p-4">
                            <PipelineView stats={stats} />
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="glass-card h-100 p-0 border-0 shadow-sm overflow-hidden d-flex flex-column" style={{ maxHeight: '500px' }}>
                        <div className="p-4 border-bottom bg-dark text-white d-flex align-items-center justify-content-between">
                            <h5 className="fw-800 mb-0 d-flex align-items-center gap-2">
                                <Activity className="text-primary-light" size={18} /> OPERATIONS FEED
                            </h5>
                            <div className="pulse-dot"></div>
                        </div>
                        <div className="flex-grow-1 overflow-auto p-3 bg-light custom-scrollbar">
                            {activityLog.length === 0 ? (
                                <div className="text-center py-5 opacity-50">
                                    <Activity size={32} className="mb-2" />
                                    <p className="extra-small fw-600">Waiting for system activity...</p>
                                </div>
                            ) : (
                                activityLog.map((log) => (
                                    <div key={log.id} className="p-3 mb-2 rounded-3 bg-white border shadow-xs animate-slide-in-right">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                            <span className="badge bg-secondary-subtle text-secondary fw-800" style={{ fontSize: '9px' }}>
                                                {log.visitNumber}
                                            </span>
                                            <span className="text-muted" style={{ fontSize: '9px' }}>
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="extra-small fw-700 text-dark">
                                            Moved to <span className="text-primary">{log.to}</span>
                                        </div>
                                        <div className="extra-small text-muted mt-1" style={{ fontSize: '10px' }}>
                                            Source: {log.from} • {log.type}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Advanced Performance Analytics (Phase 5) ── */}
            <div className="mb-5">
                <PerformanceCharts 
                    byStage={stats?.byStage} 
                    leadTime={leadTime} 
                />
            </div>
        </Layout>
    );
}

export default Dashboard;
