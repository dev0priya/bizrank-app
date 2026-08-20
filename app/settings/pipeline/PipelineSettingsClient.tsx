'use client';

import React, { useState } from 'react';
import { Kanban, Save, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';

export default function PipelineSettingsClient({ initialStages }: { initialStages: any[] }) {
    const [stages, setStages] = useState(initialStages);
    const [saved, setSaved] = useState(false);

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newStages = [...stages];
        const temp = newStages[index];
        newStages[index] = newStages[index - 1];
        newStages[index - 1] = temp;
        // Re-align order fields
        newStages.forEach((s, idx) => { s.order = idx + 1; });
        setStages(newStages);
    };

    const moveDown = (index: number) => {
        if (index === stages.length - 1) return;
        const newStages = [...stages];
        const temp = newStages[index];
        newStages[index] = newStages[index + 1];
        newStages[index + 1] = temp;
        newStages.forEach((s, idx) => { s.order = idx + 1; });
        setStages(newStages);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div style={{ paddingBottom: '40px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Kanban size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Sales Pipeline Stage Configuration</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Customize pipeline column order, visibility parameters, and default stage mappings.
                </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {stages.map((stage, index) => (
                    <div 
                        key={stage.id} 
                        style={{ 
                            padding: '16px', 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div>
                            <strong style={{ fontSize: '15px' }}>{stage.name}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                                Stage Order Index: {stage.order}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => moveUp(index)}
                                disabled={index === 0}
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', padding: '4px 8px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button 
                                onClick={() => moveDown(index)}
                                disabled={index === stages.length - 1}
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', padding: '4px 8px', cursor: index === stages.length - 1 ? 'not-allowed' : 'pointer', opacity: index === stages.length - 1 ? 0.3 : 1 }}
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                    onClick={handleSave}
                    style={{ padding: '12px 32px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}
                >
                    <Save size={18} /> Save Pipeline Stages
                </button>

                {saved && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-won)', fontWeight: 600 }}>
                        <CheckCircle2 size={18} /> Pipeline Configuration Saved
                    </span>
                )}
            </div>
        </div>
    );
}
