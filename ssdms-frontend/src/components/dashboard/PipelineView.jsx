import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, Activity } from 'lucide-react';
import { STAGE_META } from '../../constants/stages';

export default function PipelineView({ stats }) {
    const navigate = useNavigate();
    const STAGES = Object.keys(STAGE_META);

    const getStageCount = (stage) =>
        stats?.byStage?.find(s => s.current_stage === stage)?.count ?? 0;

    const total = stats?.totalFiles || 1;

    return (
        <div className="zenith-card p-0 overflow-hidden">
            <div className="p-6 border-bottom border-light d-flex justify-content-between align-items-center bg-card">
                <div className="d-flex align-items-center gap-4">
                    <div className="icon-badge-sm">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h4 className="m-0 text-main" style={{ fontSize: '16px' }}>Orchestration Pipeline</h4>
                        <p className="m-0 text-dim extra-small fw-600">LIVE DEPARTMENTAL LOAD DISTRIBUTION</p>
                    </div>
                </div>
                <div className="pipeline-legend d-flex gap-4">
                    <div className="d-flex align-items-center gap-2 extra-small fw-800 text-accent">
                        <span className="dot-pulse-accent" /> SLA NOMINAL
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="pipeline-track d-flex align-items-end gap-2">
                    {STAGES.map((stage) => {
                        const count = getStageCount(stage);
                        const percentage = (count / total) * 100;
                        const meta = STAGE_META[stage];

                        return (
                            <div 
                                key={stage} 
                                className="pipeline-bar-wrapper"
                                onClick={() => navigate(`/stage/${stage}`)}
                            >
                                <div className="bar-hover-info">
                                    <p className="m-0 fw-800" style={{ color: meta.color }}>{stage}</p>
                                    <p className="m-0 extra-small">{count} FILES ACTIVE</p>
                                </div>
                                <div className="pipeline-bar" style={{ height: `${Math.max(percentage, 5)}%`, background: meta.color }}>
                                    <div className="bar-glow" style={{ background: meta.color }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="pipeline-labels mt-6 pt-6 border-top border-light d-flex justify-content-between">
                    {STAGES.map(stage => (
                        <div key={stage} className="stage-label-vertical">
                            <span>{stage}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .icon-badge-sm {
                    width: 36px; height: 36px; border-radius: 10px; background: rgba(59, 130, 246, 0.1);
                    display: flex; align-items: center; justify-content: center; color: var(--primary);
                }
                .pipeline-track { height: 200px; padding-top: 40px; }
                .pipeline-bar-wrapper {
                    flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end;
                    position: relative; cursor: pointer;
                }
                .pipeline-bar {
                    width: 100%; border-radius: 6px 6px 0 0; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative; opacity: 0.6;
                }
                .pipeline-bar-wrapper:hover .pipeline-bar { opacity: 1; transform: scaleX(1.1); }
                .bar-glow {
                    position: absolute; inset: 0; filter: blur(12px); opacity: 0; transition: 0.3s;
                }
                .pipeline-bar-wrapper:hover .bar-glow { opacity: 0.4; }
                
                .bar-hover-info {
                    position: absolute; top: 0; left: 50%; transform: translate(-50%, -100%) scale(0.9);
                    background: var(--bg-surface); border: 1px solid var(--border-light);
                    padding: 8px 12px; border-radius: 8px; opacity: 0; transition: 0.3s;
                    pointer-events: none; z-index: 10; white-space: nowrap; box-shadow: var(--shadow-premium);
                }
                .pipeline-bar-wrapper:hover .bar-hover-info { opacity: 1; transform: translate(-50%, -10px) scale(1); }
                
                .stage-label-vertical {
                    flex: 1; display: flex; justify-content: center;
                }
                .stage-label-vertical span {
                    writing-mode: vertical-rl; transform: rotate(180deg);
                    font-size: 8px; font-weight: 800; color: var(--text-dim); text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .dot-pulse-accent {
                    width: 8px; height: 8px; background: var(--accent); border-radius: 50%;
                    animation: status-pulse 2s infinite;
                }
            `}</style>
        </div>
    );
}
