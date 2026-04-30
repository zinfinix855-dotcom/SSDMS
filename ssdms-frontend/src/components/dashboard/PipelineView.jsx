import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRightCircle, ShieldCheck } from 'lucide-react';
import { STAGE_META } from '../../constants/stages';

export default function PipelineView({ stats }) {
    const navigate = useNavigate();
    const STAGES = Object.keys(STAGE_META);

    const getStageCount = (stage) =>
        stats?.byStage?.find(s => s.current_stage === stage)?.count ?? 0;

    return (
        <div className="glass-card overflow-hidden border-0 shadow-lg" style={{ background: 'white' }}>
            <div className="p-4 border-bottom bg-primary bg-opacity-5 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-primary text-white shadow-sm">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h5 className="fw-800 mb-0">Workflow Throughput Pipeline</h5>
                        <p className="extra-small text-muted mb-0 fw-700 text-uppercase tracking-wider">Departmental Load Distribution</p>
                    </div>
                </div>
                <div className="d-flex gap-3">
                    <div className="d-flex align-items-center gap-2 extra-small fw-800 text-success">
                        <div className="bg-success rounded-circle shadow-sm" style={{ width: 10, height: 10 }} /> 
                        SLA SECURED
                    </div>
                    <div className="d-flex align-items-center gap-2 extra-small fw-800 text-danger">
                        <div className="bg-danger rounded-circle shadow-sm glowing-border" style={{ width: 10, height: 10 }} /> 
                        LOAD ALERT
                    </div>
                </div>
            </div>
            
            <div className="p-3">
                <div className="pipeline-scroll custom-scrollbar d-flex flex-row flex-nowrap align-items-center gap-0 pb-3" style={{ overflowX: 'auto', width: '100%', minHeight: '150px' }}>
                    {STAGES.map((stage, index) => {
                        const count = getStageCount(stage);
                        const isCritical = count > 20;
                        const meta = STAGE_META[stage];
                        
                        return (
                            <div 
                                key={stage} 
                                className="pipeline-step-v2 d-flex align-items-center flex-shrink-0"
                                onClick={() => navigate(`/stage/${stage}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="text-center" style={{ width: 100 }}>
                                    <div 
                                        className={`d-flex flex-column justify-content-center align-items-center mb-2 shadow-sm transition-all pipeline-dot`}
                                        style={{ 
                                            width: 60, 
                                            height: 60, 
                                            borderRadius: '16px', 
                                            margin: '0 auto', 
                                            background: isCritical ? '#fff1f2' : '#ffffff',
                                            border: `2px solid ${isCritical ? '#ef4444' : '#e2e8f0'}`,
                                            transform: 'rotate(45deg)'
                                        }}
                                    >
                                        <div style={{ transform: 'rotate(-45deg)' }}>
                                            <div className={`h4 fw-900 mb-0 ${isCritical ? 'text-danger' : ''}`} style={{ color: isCritical ? '#ef4444' : meta.color }}>
                                                {count}
                                            </div>
                                            <div className="extra-small opacity-50 fw-800" style={{ fontSize: '9px' }}>FILES</div>
                                        </div>
                                    </div>
                                    
                                    <div className="fw-800 text-dark tracking-tighter text-uppercase" style={{ fontSize: '10px' }}>
                                        {stage}
                                    </div>
                                </div>

                                {index < STAGES.length - 1 && (
                                    <div className="px-1" style={{ marginTop: '-15px' }}>
                                        <div className="d-flex align-items-center" style={{ width: 20, height: 1, background: '#e2e8f0' }}>
                                            <ChevronRight size={14} className="text-muted opacity-25" style={{ marginLeft: 15 }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="p-3 bg-light border-top text-center">
                <button className="btn btn-sm btn-white rounded-pill px-4 border shadow-sm fw-800 extra-small d-inline-flex align-items-center gap-2">
                    INITIATE BATCH ACTION <ArrowRightCircle size={14} className="text-primary" />
                </button>
            </div>
        </div>
    );
}
