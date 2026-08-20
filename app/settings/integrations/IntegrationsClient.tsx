'use client';

import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function IntegrationsClient() {
    const [providerStatus, setProviderStatus] = useState<any>({ apify: false, google_places: false, mock: true });

    useEffect(() => {
        fetch('/api/settings/providers')
            .then(res => res.json())
            .then(data => setProviderStatus(data))
            .catch(err => console.error("Failed to load provider status", err));
    }, []);

    return (
        <div style={{ paddingBottom: '40px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Connected Integrations</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Inspect active third-party APIs and provider status.
                </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Apify default data provider</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Required for Google Maps scrapers</div>
                    </div>
                    <div>
                        {providerStatus.apify ? 
                            <span style={{ color: 'var(--status-won)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><CheckCircle2 size={16} /> Connected</span> : 
                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={16} /> Not Configured</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Google Places API</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>For direct location queries</div>
                    </div>
                    <div>
                        {providerStatus.google_places ? 
                            <span style={{ color: 'var(--status-won)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><CheckCircle2 size={16} /> Connected</span> : 
                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={16} /> Not Configured</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Mock Provider (Simulator)</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generates deterministic test data</div>
                    </div>
                    <div>
                        <span style={{ color: 'var(--status-won)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><CheckCircle2 size={16} /> Connected</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
