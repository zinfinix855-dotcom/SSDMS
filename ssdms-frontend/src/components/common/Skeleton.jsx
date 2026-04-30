import React from 'react';

export const CardSkeleton = ({ height = '150px' }) => (
    <div className="glass-card animate-pulse shadow-sm border-0" style={{ height, background: '#f8fafc' }} />
);

export const TableRowSkeleton = ({ rows = 5 }) => (
    <div className="w-100">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="d-flex align-items-center gap-3 mb-3 p-3 bg-light rounded-4 animate-pulse">
                <div className="rounded-circle bg-slate-200" style={{ width: '40px', height: '40px', minWidth: '40px' }} />
                <div className="flex-grow-1">
                    <div className="bg-slate-200 rounded-pill mb-2" style={{ width: '40%', height: '12px' }} />
                    <div className="bg-slate-200 rounded-pill" style={{ width: '20%', height: '8px' }} />
                </div>
                <div className="bg-slate-200 rounded-pill" style={{ width: '15%', height: '10px' }} />
            </div>
        ))}
    </div>
);

export const PageSkeleton = () => (
    <div className="p-2 w-100 animate-fade-in">
        <div className="glass-card p-5 mb-4 animate-pulse border-0" style={{ height: '180px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }} />
        <div className="row g-4 mb-5">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="col-md-3">
                    <CardSkeleton height="120px" />
                </div>
            ))}
        </div>
        <div className="row g-4">
            <div className="col-lg-8">
                <div className="glass-card p-4 h-100 animate-pulse border-0" style={{ height: '400px', background: '#f8fafc' }} />
            </div>
            <div className="col-lg-4">
                <div className="glass-card p-4 h-100 animate-pulse border-0" style={{ height: '400px', background: '#f8fafc' }} />
            </div>
        </div>
    </div>
);

export default PageSkeleton;
