'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Key, Sliders, Moon, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsClient() {
    const [apifyKey, setApifyKey] = useState('');
    const [openAiKey, setOpenAiKey] = useState('');
    const [maxConcurrency, setMaxConcurrency] = useState('5');
    const [defaultLimit, setDefaultLimit] = useState('50');
    const [darkMode, setDarkMode] = useState(true);
    
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Load existing settings
        setApifyKey(localStorage.getItem('bizrank_apify_key') || '');
        setOpenAiKey(localStorage.getItem('bizrank_openai_key') || '');
        setMaxConcurrency(localStorage.getItem('bizrank_concurrency') || '5');
        setDefaultLimit(localStorage.getItem('bizrank_limit') || '50');
        setDarkMode(localStorage.getItem('bizrank_theme') !== 'light');
    }, []);

    const handleSave = () => {
        localStorage.setItem('bizrank_apify_key', apifyKey);
        localStorage.setItem('bizrank_openai_key', openAiKey);
        localStorage.setItem('bizrank_concurrency', maxConcurrency);
        localStorage.setItem('bizrank_limit', defaultLimit);
        localStorage.setItem('bizrank_theme', darkMode ? 'dark' : 'light');
        
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div style={{ paddingBottom: '40px', maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Settings size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Platform Settings</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Configure global application parameters, API connections, and extraction thresholds.
            </p>

            {/* API KEYS */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <Key size={18} /> API Connections
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Apify API Token (For Google Maps Scraper)
                        </label>
                        <input 
                            type="password" 
                            value={apifyKey}
                            onChange={e => setApifyKey(e.target.value)}
                            placeholder="apify_api_..."
                            style={{ width: '100%', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            OpenAI API Key (For Website Audits)
                        </label>
                        <input 
                            type="password" 
                            value={openAiKey}
                            onChange={e => setOpenAiKey(e.target.value)}
                            placeholder="sk-..."
                            style={{ width: '100%', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                </div>
            </div>

            {/* EXTRACTION PREFERENCES */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <Sliders size={18} /> Extraction Thresholds
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Max Concurrent Jobs
                        </label>
                        <input 
                            type="number" 
                            value={maxConcurrency}
                            onChange={e => setMaxConcurrency(e.target.value)}
                            style={{ width: '100%', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Default Search Limit (Rows)
                        </label>
                        <input 
                            type="number" 
                            value={defaultLimit}
                            onChange={e => setDefaultLimit(e.target.value)}
                            style={{ width: '100%', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                </div>
            </div>

            {/* UI PREFERENCES */}
            <div className="glass-panel" style={{ marginBottom: '32px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <Moon size={18} /> Interface
                </h3>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                        type="checkbox" 
                        checked={darkMode}
                        onChange={e => setDarkMode(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Enable Dark Mode Engine (Default)</span>
                </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                    onClick={handleSave}
                    style={{ padding: '12px 32px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}
                >
                    <Save size={18} /> Save Configuration
                </button>

                {saved && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-won)', fontWeight: 600 }}>
                        <CheckCircle2 size={18} /> Settings Applied
                    </span>
                )}
            </div>
        </div>
    );
}
