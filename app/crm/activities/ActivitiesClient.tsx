'use client';

import React, { useState } from 'react';
import { 
  Activity as ActivityIcon, Phone, MessageSquare, Mail, 
  Users, CheckCircle2, AlertCircle, FileText, CalendarClock, Search
} from 'lucide-react';

export default function ActivitiesClient({ 
    initialActivities 
}: { 
    initialActivities: any[];
}) {
    const [activities, setActivities] = useState(initialActivities);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'CALL': return <Phone size={16} />;
            case 'WHATSAPP': return <MessageSquare size={16} />;
            case 'EMAIL': return <Mail size={16} />;
            case 'MEETING': return <Users size={16} />;
            case 'DEMO': return <FileText size={16} />;
            case 'PROPOSAL': return <FileText size={16} />;
            default: return <ActivityIcon size={16} />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'CALL': return '#3b82f6'; // Blue
            case 'WHATSAPP': return '#10b981'; // Green
            case 'EMAIL': return '#a855f7'; // Purple
            case 'MEETING': return '#ea580c'; // Orange
            case 'PROPOSAL': return '#f59e0b'; // Yellow
            default: return 'var(--text-muted)';
        }
    };

    // Filter list
    const filteredActivities = activities.filter(act => {
        const matchesSearch = 
            act.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (act.details && act.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (act.performedBy && act.performedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (act.crmLead?.business?.business_name && act.crmLead.business.business_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = typeFilter === 'ALL' || act.type === typeFilter;

        return matchesSearch && matchesType;
    });

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ActivityIcon size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Sales Activity Audit Timeline</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Audit trail and timeline logs of all active client touches, callbacks, meetings, and stage changes.
                </p>
            </div>

            {/* Filter Cockpit */}
            <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text"
                        placeholder="Search logs by keyword, performer, business..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    />
                </div>
                
                <div>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        style={{ padding: '10px 16px', background: '#111', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    >
                        <option value="ALL">All Touchpoints</option>
                        <option value="CALL">Calls</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="EMAIL">Emails</option>
                        <option value="MEETING">Meetings</option>
                        <option value="PROPOSAL">Proposals</option>
                        <option value="OTHER">System / Other</option>
                    </select>
                </div>
            </div>

            {/* Timeline */}
            {filteredActivities.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No activity logs recorded.
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                    {/* Vertical line helper */}
                    <div style={{ position: 'absolute', left: '35px', top: '32px', bottom: '32px', width: '2px', background: 'var(--border-color)', zIndex: 0 }} />

                    {filteredActivities.map((act, index) => (
                        <div key={act.id} style={{ display: 'flex', gap: '20px', zIndex: 1, position: 'relative' }}>
                            {/* Icon container */}
                            <div style={{ 
                                width: '26px', 
                                height: '26px', 
                                background: 'var(--panel-bg)', 
                                border: `2px solid ${getActivityColor(act.type)}`, 
                                color: getActivityColor(act.type),
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '4px',
                                flexShrink: 0
                            }}>
                                {getActivityIcon(act.type)}
                            </div>

                            {/* Activity content */}
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{act.summary}</span>
                                        {act.crmLead?.business?.business_name && (
                                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                {' '}on lead <a href={`/crm/leads/${act.crmLeadId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>{act.crmLead.business.business_name}</a>
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {formatTime(act.occurredAt)}
                                    </span>
                                </div>

                                {act.details && (
                                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                        {act.details}
                                    </p>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                                    <span>Performed by: <strong>{act.performedBy}</strong></span>
                                    {act.outcome && (
                                        <span style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '4px', 
                                            color: act.outcome.toLowerCase() === 'success' || act.outcome.toLowerCase() === 'connected' ? 'var(--status-won)' : 'var(--text-muted)'
                                        }}>
                                            {act.outcome}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
