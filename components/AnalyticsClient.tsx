'use client';

import React from 'react';
import { BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#3b82f6', '#a855f7', '#eab308', '#f97316', '#22c55e', '#ef4444', '#06b6d4', '#8b5cf6'];

export default function AnalyticsClient({ pipelineData, aiScoreData, categoryData }: any) {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', color: 'var(--text-main)' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label || payload[0].name}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ margin: 0, color: entry.color }}>
                            {entry.name}: {entry.name === 'revenue' || entry.name === 'value' && entry.payload?.revenue ? `$${entry.value.toLocaleString()}` : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <BarChart3 size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Analytics & Reporting</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Global insights and performance metrics across the entire extraction and sales lifecycle.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                
                {/* PIPELINE REVENUE */}
                <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <DollarSignIcon size={18} /> Pipeline Revenue by Stage
                    </h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="stage" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* LEADS BY CATEGORY */}
                <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <PieChartIcon size={18} /> Distribution by Category (Top 10)
                    </h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI SCORE BY STAGE */}
                <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <TrendingUp size={18} /> Avg AI Score per CRM Stage
                    </h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={aiScoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="stage" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                <YAxis stroke="var(--text-muted)" domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="avgAiScore" stroke="#a855f7" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

function DollarSignIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    );
}
