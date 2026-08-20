'use client';

import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';

export default function ScoringClient() {
    const [weights, setWeights] = useState({
        noWebsite: 25,
        poorWebsite: 15,
        phoneAvailable: 15,
        lowRating: 10,
        highReviews: 10,
        socialPresence: 15,
        businessStatus: 10
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div style={{ paddingBottom: '40px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sliders size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Lead & Opportunity Scoring Configuration</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Adjust opportunity scoring signal weights used inside the deterministic calculations pipeline.
                </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Missing Verified Website (No Website) Weight</span>
                        <strong>+{weights.noWebsite} pts</strong>
                    </label>
                    <input 
                        type="range" min="0" max="50" value={weights.noWebsite}
                        onChange={e => setWeights({ ...weights, noWebsite: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Low Quality / Non-Responsive Website Weight</span>
                        <strong>+{weights.poorWebsite} pts</strong>
                    </label>
                    <input 
                        type="range" min="0" max="30" value={weights.poorWebsite}
                        onChange={e => setWeights({ ...weights, poorWebsite: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Business Phone Available Weight</span>
                        <strong>+{weights.phoneAvailable} pts</strong>
                    </label>
                    <input 
                        type="range" min="0" max="30" value={weights.phoneAvailable}
                        onChange={e => setWeights({ ...weights, phoneAvailable: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Rating Optimization Needed (Rating &lt; 4.0) Weight</span>
                        <strong>+{weights.lowRating} pts</strong>
                    </label>
                    <input 
                        type="range" min="0" max="25" value={weights.lowRating}
                        onChange={e => setWeights({ ...weights, lowRating: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>High Engagement Reviews (Reviews &gt;= 10) Weight</span>
                        <strong>+{weights.highReviews} pts</strong>
                    </label>
                    <input 
                        type="range" min="0" max="25" value={weights.highReviews}
                        onChange={e => setWeights({ ...weights, highReviews: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Social Presence Gap (Facebook/Instagram Available) Weight</span>
                        <strong>+{weights.socialPresence} pts</strong>
                    </label>
                    <input 
                        type="range" min="0" max="30" value={weights.socialPresence}
                        onChange={e => setWeights({ ...weights, socialPresence: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Operational Business Status (Active Open) Weight</span>
                        <strong>+{weights.businessStatus} pts</strong>
                    </label>
                    <input 
                        type="range" min="0" max="20" value={weights.businessStatus}
                        onChange={e => setWeights({ ...weights, businessStatus: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                    onClick={handleSave}
                    style={{ padding: '12px 32px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}
                >
                    <Save size={18} /> Save Scoring Weights
                </button>

                {saved && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-won)', fontWeight: 600 }}>
                        <CheckCircle2 size={18} /> Scoring Weights Applied
                    </span>
                )}
            </div>
        </div>
    );
}
