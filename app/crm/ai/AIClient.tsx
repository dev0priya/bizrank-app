'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Target, AlertCircle, Calendar, Send, HelpCircle, 
  ArrowRight, User, TrendingUp, DollarSign, Award, Bot
} from 'lucide-react';
import Link from 'next/link';

export default function AIClient({ 
    hotLeads, 
    overdueFollowUps,
    recentLeads
}: { 
    hotLeads: any[]; 
    overdueFollowUps: any[];
    recentLeads: any[];
}) {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; data?: any[] }>>([
        { 
            role: 'assistant', 
            content: "Hello! I am your sales assistant. I can query active CRM leads, pull revenue stats, check overdue follow-ups, and summarize lead profiles. Type **'help'** to see the list of commands!" 
        }
    ]);
    const [submitting, setSubmitting] = useState(false);

    const handleSuggestion = (suggestionText: string) => {
        sendQuery(suggestionText);
    };

    const sendQuery = async (queryText: string) => {
        if (!queryText.trim() || submitting) return;
        
        // Add user message
        const newMsgList = [...messages, { role: 'user' as const, content: queryText }];
        setMessages(newMsgList);
        setQuery('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/crm/ai/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryText })
            });

            if (!res.ok) throw new Error('API query failed');
            
            const data = await res.json();
            setMessages([...newMsgList, { 
                role: 'assistant' as const, 
                content: data.message || "Query resolved successfully.",
                data: Array.isArray(data.data) ? data.data : undefined
            }]);
        } catch (err) {
            setMessages([...newMsgList, { 
                role: 'assistant' as const, 
                content: "I encountered an error while resolving your request. Please try again." 
            }]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ paddingBottom: '40px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
            
            {/* Left Column: Ask AI Chat Console */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', padding: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot size={24} className="text-gradient" />
                    <h2 style={{ margin: 0 }}>Natural Language Assistant</h2>
                </div>

                {/* Messages Panel */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map((m, idx) => (
                        <div 
                            key={idx} 
                            style={{ 
                                display: 'flex', 
                                gap: '12px',
                                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                                alignItems: 'flex-start'
                            }}
                        >
                            <div style={{ 
                                padding: '10px', 
                                borderRadius: '12px',
                                background: m.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                color: 'white',
                                maxWidth: '80%',
                                fontSize: '14px',
                                lineHeight: 1.4,
                                border: m.role === 'user' ? 'none' : '1px solid var(--border-color)'
                            }}>
                                {/* Display Content (supporting simple markdown list lines) */}
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {m.content}
                                </div>

                                {/* Render returned data table/cards if available */}
                                {m.data && m.data.length > 0 && (
                                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                                        {m.data.map((lead: any) => (
                                            <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                                <Link href={`/crm/leads/${lead.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                                                    {lead.business?.business_name || 'Lead Details'}
                                                </Link>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    Score: {lead.leadScore} · Priority: {lead.priority || 'N/A'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Suggestions Row */}
                <div style={{ padding: '10px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                    <button onClick={() => handleSuggestion('show my hot leads')} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                        🔥 Hot Leads
                    </button>
                    <button onClick={() => handleSuggestion('total revenue')} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' }}>
                        💰 Revenue
                    </button>
                    <button onClick={() => handleSuggestion('pending followups')} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer' }}>
                        ⏰ Overdue
                    </button>
                    <button onClick={() => handleSuggestion('help')} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        ❓ Help commands
                    </button>
                </div>

                {/* Input Bar */}
                <form 
                    onSubmit={(e) => { e.preventDefault(); sendQuery(query); }}
                    style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px', display: 'flex', gap: '12px' }}
                >
                    <input 
                        type="text"
                        placeholder="Type sales assistant query (e.g. 'show my hot leads')..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        disabled={submitting}
                        style={{ flex: 1, padding: '12px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    />
                    <button 
                        type="submit"
                        disabled={submitting}
                        style={{ padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

            {/* Right Column: Recommendations Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Priorities & Recommendations */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} color="#ef4444" /> Today's Priorities
                    </h3>
                    
                    {hotLeads.length === 0 ? (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            No high-priority leads mapped in DB.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {hotLeads.map(lead => (
                                <div key={lead.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <Link href={`/crm/leads/${lead.id}`} style={{ fontWeight: 600, fontSize: '13px', color: 'white', textDecoration: 'none' }}>
                                            {lead.business?.business_name}
                                        </Link>
                                        <span style={{ fontSize: '10px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>HOT</span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Opportunity Score: {lead.leadScore} · {lead.business?.category?.name || 'Category'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Overdue Checklists */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} color="#f59e0b" /> Overdue Tasks
                    </h3>
                    
                    {overdueFollowUps.length === 0 ? (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            No pending tasks are overdue.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {overdueFollowUps.map(f => (
                                <div key={f.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                                    <Link href={`/crm/leads/${f.crmLeadId}`} style={{ fontWeight: 600, fontSize: '13px', color: 'white', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                                        {f.crmLead?.business?.business_name}
                                    </Link>
                                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                                        Missed: {new Date(f.dueAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
