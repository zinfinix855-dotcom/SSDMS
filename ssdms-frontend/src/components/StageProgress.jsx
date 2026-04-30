import { Check, Circle } from 'lucide-react';

const STAGES = [
    'Admission', 'Discharge', 'Pre-Approval', 'Approval',
    'File Verification', 'E-Claim', 'E-Claim Verification',
    'Finance', 'Segregation', 'Indexation'
];

export default function StageProgress({ currentStage }) {
    const currentIdx = STAGES.indexOf(currentStage);

    return (
        <div className="stage-progress-wrapper animate-fade-in">
            <div className="stage-progress-premium">
                {STAGES.map((stage, idx) => {
                    const isDone = idx < currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                        <div
                            key={stage}
                            className={`progress-step-modern ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                        >
                            <div className="step-marker-modern shadow-lg" title={stage.toUpperCase()}>
                                {isDone ? (
                                    <Check size={14} strokeWidth={3} className="animate-fade-in" />
                                ) : isCurrent ? (
                                    <div className="current-pulse"></div>
                                ) : (
                                    <span style={{ fontSize: '10px' }}>{idx + 1}</span>
                                )}
                            </div>
                            <div className="step-connector-modern"></div>
                            <div className="step-label-modern fw-800 text-uppercase tracking-tighter" style={{ fontSize: '8px' }}>
                                {stage}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
