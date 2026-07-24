'use client';

import React, { useState } from 'react';
import { Target, DollarSign, Flag, ArrowRight, XCircle, BarChart3, Star, Globe } from 'lucide-react';

export default function LeadsClient({ initialLeads }: { initialLeads: any[] }) {
    const [leads, setLeads] = useState(initialLeads);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleAction = async (id: number, action: 'push' | 'reject') => {
        setLoadingId(id);
        try {
            const body = action === 'push' 
                ? { crm_status: 'Lead', discovery_status: 'CRM' } // Moves it to CRM pipeline
                : { discovery_status: 'Rejected' }; // Drops it from Qualified queue

            const res = await fetch(`/api/businesses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                // Remove from local staging area
                setLeads(leads.filter(l => l.id !== id));
            }
        } catch (error) {
            console.error('Failed to process lead', error);
        } finally {
            setLoadingId(null);
        }
    };

    const updateMetadata = async (id: number, field: string, value: string) => {
        // Optimistic UI update
        setLeads(leads.map(l => l.id === id ? { ...l, [field]: value } : l));
        
        try {
            await fetch(`/api/businesses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
        } catch (error) {
            console.error(`Failed to update ${field}`, error);
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Target size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Qualified Leads Staging</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Priority inbox for businesses marked as &quot;Qualified&quot;. Assign estimated revenue and priority before pushing them to the active CRM pipeline.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Total Pending Leads: <strong>{leads.length}</strong>
                </div>
            </div>

            <div className="glass-panel">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Business</th>
                                <th style={{ padding: '12px' }}>Scores (AI / Opp)</th>
                                <th style={{ padding: '12px' }}>Priority</th>
                                <th style={{ padding: '12px' }}>Est. Revenue ($)</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Pipeline Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{lead.business_name}</div>
                                        <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                                            <span>{lead.category?.name || 'No Category'}</span>
                                            <span>•</span>
                                            <span>{lead.city?.name || 'No City'}</span>
                                            {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', marginLeft: '4px' }}><Globe size={12} /></a>}
                                        </div>
                                    </td>
                                    
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span className={`badge ${lead.ai_score >= 70 ? 'badge-priority-c' : lead.ai_score >= 40 ? 'badge-priority-b' : 'badge-priority-a'}`} title="AI Score">
                                                AI: {lead.ai_score}
                                            </span>
                                            <span className={`badge ${lead.opportunity_score >= 70 ? 'badge-priority-c' : lead.opportunity_score >= 40 ? 'badge-priority-b' : 'badge-priority-a'}`} title="Opportunity Score">
                                                Opp: {lead.opportunity_score}
                                            </span>
                                        </div>
                                    </td>
                                    
                                    <td style={{ padding: '16px 12px' }}>
                                        <select 
                                            value={lead.priority || ''} 
                                            onChange={e => updateMetadata(lead.id, 'priority', e.target.value)}
                                            style={{ padding: '6px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none' }}
                                        >
                                            <option value="">Unassigned</option>
                                            <option value="A">Priority A (High)</option>
                                            <option value="B">Priority B (Med)</option>
                                            <option value="C">Priority C (Low)</option>
                                        </select>
                                    </td>
                                    
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ position: 'relative', width: '120px' }}>
                                            <DollarSign size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--text-muted)' }} />
                                            <input 
                                                type="number" 
                                                value={lead.revenue || ''} 
                                                onChange={e => updateMetadata(lead.id, 'revenue', e.target.value)}
                                                placeholder="0.00"
                                                style={{ width: '100%', padding: '6px 8px 6px 26px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none' }} 
                                            />
                                        </div>
                                    </td>
                                    
                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleAction(lead.id, 'reject')}
                                                disabled={loadingId === lead.id}
                                                title="Reject Lead"
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', color: 'var(--status-lost)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleAction(lead.id, 'push')}
                                                disabled={loadingId === lead.id}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Push to CRM <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Target size={24} color="var(--text-muted)" />
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 600 }}>Inbox Zero</div>
                                            <div style={{ color: 'var(--text-muted)' }}>You have no pending qualified leads in the staging area.</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
