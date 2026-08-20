'use client';

import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, ShieldAlert, Cpu, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AutomationsClient() {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [enabled, setEnabled] = useState(true);

    const triggerAutomation = async () => {
        setRunning(true);
        setResult(null);
        try {
            const res = await fetch('/api/crm/automations/worker', {
                method: 'POST'
            });
            const data = await res.json();
            setResult({ success: true, message: data.message });
        } catch (err: any) {
            setResult({ success: false, message: 'Automation execution failed.' });
        } finally {
            setRunning(false);
        }
    };

    return (
        <div style={{ paddingBottom: '40px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>CRM Sales Automations</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Monitor and trigger background automation tasks for sales lead flows.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
                            <h3 style={{ margin: 0 }}>Untouched Leads Follow-up Scheduler</h3>
                        </div>
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            Automatically reviews leads that haven't been contacted or touched for 7+ days, logs a system timeline alert, and schedules a high-priority follow-up task callback for the assigned agent.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            onClick={() => setEnabled(!enabled)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: enabled ? 'var(--status-won)' : 'var(--text-muted)' }}
                            title={enabled ? 'Disable automation' : 'Enable automation'}
                        >
                            {enabled ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                        </button>
                        <span style={{ fontSize: '12px', background: enabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: enabled ? '#10b981' : 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                            {enabled ? 'ACTIVE' : 'PAUSED'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '13px' }}>
                        <div>Trigger Context: <strong>Untouched leads status trigger (7+ days)</strong></div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Last Run: <strong>Today, background check complete</strong></div>
                    </div>

                    <button 
                        onClick={triggerAutomation}
                        disabled={running || !enabled}
                        className="btn-primary hover-lift ripple"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: enabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: enabled ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: enabled ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                    >
                        <Play size={14} /> {running ? 'Running...' : 'Run Automation Now'}
                    </button>
                </div>

                {result && (
                    <div style={{ 
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                        border: result.success ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                        color: result.success ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px'
                    }}>
                        {result.success ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                        {result.message}
                    </div>
                )}
            </div>
        </div>
    );
}
