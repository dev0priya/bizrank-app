'use client';

import React, { useState } from 'react';
import { Building2, Save, CheckCircle2 } from 'lucide-react';

export default function BusinessSettingsClient() {
    const [bizName, setBizName] = useState('BizRank Solutions');
    const [email, setEmail] = useState('contact@bizrank.com');
    const [currency, setCurrency] = useState('USD');
    const [timezone, setTimezone] = useState('GMT+5:30 (Kolkata)');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div style={{ paddingBottom: '40px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Business Settings</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Configure BizRank organizational entity and global defaults.
                </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Company Profile Name</label>
                    <input 
                        type="text" value={bizName} onChange={e => setBizName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Contact Information Email</label>
                    <input 
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Default Currency</label>
                        <select 
                            value={currency} onChange={e => setCurrency(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', background: '#111', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Timezone</label>
                        <select 
                            value={timezone} onChange={e => setTimezone(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', background: '#111', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        >
                            <option value="GMT+5:30 (Kolkata)">GMT+5:30 (Kolkata)</option>
                            <option value="GMT+0:00 (UTC)">GMT+0:00 (UTC)</option>
                            <option value="GMT-5:00 (EST)">GMT-5:00 (EST)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                    onClick={handleSave}
                    style={{ padding: '12px 32px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}
                >
                    <Save size={18} /> Save Settings
                </button>

                {saved && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-won)', fontWeight: 600 }}>
                        <CheckCircle2 size={18} /> Organization Settings Applied
                    </span>
                )}
            </div>
        </div>
    );
}
