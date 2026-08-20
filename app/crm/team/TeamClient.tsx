'use client';

import React from 'react';
import { Users, User, Award, TrendingUp, DollarSign, Target } from 'lucide-react';

export default function TeamClient({ leads }: { leads: any[] }) {
    // Process lead metrics per agent in memory
    const agentMap: Record<string, {
        name: string;
        totalLeads: number;
        contacted: number;
        meetings: number;
        proposals: number;
        won: number;
        revenue: number;
    }> = {};

    // Standardize default admin agent
    agentMap['admin@bizrank.com'] = {
        name: 'admin@bizrank.com',
        totalLeads: 0,
        contacted: 0,
        meetings: 0,
        proposals: 0,
        won: 0,
        revenue: 0
    };

    leads.forEach(lead => {
        const agent = lead.assignedTo || 'admin@bizrank.com';
        if (!agentMap[agent]) {
            agentMap[agent] = {
                name: agent,
                totalLeads: 0,
                contacted: 0,
                meetings: 0,
                proposals: 0,
                won: 0,
                revenue: 0
            };
        }

        const metrics = agentMap[agent];
        metrics.totalLeads++;

        const stage = lead.pipelineStage?.name || '';
        if (['Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Closed Won'].includes(stage)) {
            metrics.contacted++;
        }
        if (stage === 'Meeting Scheduled') {
            metrics.meetings++;
        }
        if (stage === 'Proposal Sent') {
            metrics.proposals++;
        }
        if (stage === 'Closed Won') {
            metrics.won++;
            // Sum won deals revenue
            const wonDealsValue = lead.deals
                ?.filter((d: any) => d.status === 'WON')
                ?.reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0;
            metrics.revenue += wonDealsValue || lead.estimatedValue || 0;
        }
    });

    const agents = Object.values(agentMap);

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Sales Team Performance</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Real-time sales conversion logs, touchpoints, and won revenue metrics per agent.
                </p>
            </div>

            {/* Performance Registry Table */}
            <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Agent Name / Username</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Leads</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Contacted</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Meetings</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Proposals</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Won Deals</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Won Revenue</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Win Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map((agent, index) => {
                            const winRate = agent.totalLeads > 0 ? (agent.won / agent.totalLeads) * 100 : 0;
                            return (
                                <tr key={agent.name} style={{ borderBottom: index === agents.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: 'var(--border-color)', padding: '6px', borderRadius: '50%', color: 'var(--text-muted)' }}>
                                            <User size={14} />
                                        </div>
                                        <strong>{agent.name}</strong>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>{agent.totalLeads}</td>
                                    <td style={{ padding: '16px 20px' }}>{agent.contacted}</td>
                                    <td style={{ padding: '16px 20px' }}>{agent.meetings}</td>
                                    <td style={{ padding: '16px 20px' }}>{agent.proposals}</td>
                                    <td style={{ padding: '16px 20px', color: 'var(--status-won)', fontWeight: 600 }}>{agent.won}</td>
                                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'white' }}>${agent.revenue.toLocaleString()}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ 
                                            background: winRate >= 20 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: winRate >= 20 ? '#10b981' : 'var(--text-muted)',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontWeight: 600,
                                            fontSize: '12px'
                                        }}>
                                            {winRate.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
