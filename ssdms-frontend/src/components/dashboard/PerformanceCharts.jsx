import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#475569'];

const PerformanceCharts = ({ byStage, leadTime }) => {
    
    // Sort and format stage data
    const stageData = (byStage || [])
        .map((s, idx) => ({
            name: s.current_stage || 'Unknown',
            count: Number(s.count),
            color: COLORS[idx % COLORS.length]
        }));

    // Format lead time data
    const analyticsData = (leadTime || [])
        .map(a => ({
            stage: a.stage,
            avg: parseFloat(a.avg_hours).toFixed(1),
            max: parseFloat(a.max_hours).toFixed(1)
        }));

    return (
        <div className="row g-4 mt-2">
            {/* Throughput Bar Chart */}
            <div className="col-lg-7">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm h-100">
                    <div className="mb-4">
                        <h4 className="text-lg font-bold text-slate-800">Workflow Distribution</h4>
                        <p className="text-xs text-slate-500">Live distribution of files across all departmental stages.</p>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={stageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                                    {stageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lead Time Line Chart */}
            <div className="col-lg-5">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm h-100">
                    <div className="mb-4">
                        <h4 className="text-lg font-bold text-slate-800">Processing Lead Times</h4>
                        <p className="text-xs text-slate-500">Average vs Max hours spent in each departmental stage.</p>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={analyticsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="stage" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: '#64748b' }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="avg" name="Avg Hours" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="max" name="Max Hours" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceCharts;
