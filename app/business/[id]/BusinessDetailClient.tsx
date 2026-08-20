'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, MapPin, Phone, Globe, Star, Clock, 
    Target, Building, CheckCircle2, Plus, Copy, Check 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BusinessDetailClient({ business }: { business: any }) {
    const router = useRouter();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [qualifying, setQualifying] = useState(false);
    const [qualified, setQualified] = useState(business.discovery_status === 'Qualified');

    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleQualify = async () => {
        setQualifying(true);
        try {
            const res = await fetch(`/api/businesses/${business.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discovery_status: 'Qualified' })
            });
            if (res.ok) {
                setQualified(true);
            }
        } catch (error) {
            console.error('Failed to qualify business', error);
        } finally {
            setQualifying(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ paddingBottom: '40px', maxWidth: '900px', margin: '0 auto' }}
        >
            <button 
                onClick={() => router.back()}
                className="btn-icon ripple hover-lift"
                style={{ marginBottom: '24px', padding: '8px 16px', background: 'var(--panel-bg)', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)' }}
            >
                <ArrowLeft size={16} /> Back to Discovery
            </button>

            {/* HEADER CARD */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ margin: 0, marginBottom: '8px', fontSize: '28px', wordBreak: 'break-word' }}>{business.business_name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                            <Target size={16} />
                            <span>{business.google_category || business.category?.name || 'Uncategorized'}</span>
                            {business.rating && (
                                <>
                                    <span style={{ margin: '0 8px' }}>•</span>
                                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{business.rating}</span>
                                    <span>({business.review_count} reviews)</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <span className={`badge ${business.opportunity_score >= 70 ? 'badge-priority-b' : 'badge-priority-a'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                                Opp Score: {business.opportunity_score || 0}
                            </span>
                            <span className={`badge ${business.ai_score >= 70 ? 'badge-priority-c' : 'badge-priority-a'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                                AI Score: {business.ai_score || 0}
                            </span>
                        </div>
                        <div style={{ fontSize: '13px', color: business.website ? 'var(--text-muted)' : 'var(--status-won)', fontWeight: business.website ? 'normal' : 500 }}>
                            {business.website ? 'Opportunity: Low (Website Exists)' : 'Opportunity: High (No Website Available)'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION BAR */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                {business.google_maps_url && (
                    <a href={business.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-icon ripple hover-lift primary" style={{ flex: 1, minWidth: '160px', padding: '12px' }}>
                        <MapPin size={18} /> Open in Google Maps
                    </a>
                )}
                {!business.google_maps_url && (
                    <button className="btn-icon ripple" disabled style={{ flex: 1, minWidth: '160px', padding: '12px', opacity: 0.5, cursor: 'not-allowed' }}>
                        <MapPin size={18} /> Map Link Unavailable
                    </button>
                )}
                {business.website ? (
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="btn-icon ripple hover-lift" style={{ flex: 1, minWidth: '160px', padding: '12px' }}>
                        <Globe size={18} /> Official Website
                    </a>
                ) : (
                    <button className="btn-icon ripple" disabled style={{ flex: 1, minWidth: '160px', padding: '12px', opacity: 0.5, cursor: 'not-allowed' }}>
                        <Globe size={18} /> No Website Available
                    </button>
                )}
                {business.phone_number && (
                    <a href={`tel:${business.phone_number}`} className="btn-icon ripple hover-lift" style={{ flex: 1, minWidth: '160px', padding: '12px' }}>
                        <Phone size={18} /> Call Business
                    </a>
                )}
                <button 
                    onClick={handleQualify}
                    disabled={qualified || qualifying}
                    className={`btn-icon ripple hover-lift ${qualified ? '' : 'primary'}`}
                    style={{ flex: 1, minWidth: '160px', padding: '12px', background: qualified ? 'rgba(16, 185, 129, 0.1)' : undefined, color: qualified ? '#10b981' : undefined, borderColor: qualified ? 'rgba(16, 185, 129, 0.2)' : undefined, cursor: qualified ? 'default' : 'pointer' }}
                >
                    {qualified ? <CheckCircle2 size={18} /> : (qualifying ? <Clock size={18} className="spin" /> : <Plus size={18} />)} 
                    {qualified ? "Qualified" : "Add to CRM"}
                </button>
            </div>

            {/* DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={18} /> Contact Information
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Provider / Place ID</div>
                            <span style={{ fontWeight: 500 }}>{business.provider || 'Unknown'}{business.place_id ? ` · ${business.place_id}` : ' · No verified place ID'}</span>
                        </div>

                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Address</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ fontWeight: 500, lineHeight: 1.5 }}>{business.full_address || 'N/A'}</span>
                                {business.full_address && (
                                    <button onClick={() => handleCopy(business.full_address, 'address')} className="btn-icon" style={{ padding: '6px', minWidth: 'unset', border: 'none' }}>
                                        {copiedField === 'address' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 500 }}>{business.phone_number || 'N/A'}</span>
                                {business.phone_number && (
                                    <button onClick={() => handleCopy(business.phone_number, 'phone')} className="btn-icon" style={{ padding: '6px', minWidth: 'unset', border: 'none' }}>
                                        {copiedField === 'phone' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Maps URL</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ fontWeight: 500, wordBreak: 'break-all', fontSize: '13px', color: 'var(--accent-primary)' }}>{business.google_maps_url || 'N/A'}</span>
                                {business.google_maps_url && (
                                    <button onClick={() => handleCopy(business.google_maps_url, 'maps')} className="btn-icon" style={{ padding: '6px', minWidth: 'unset', border: 'none' }}>
                                        {copiedField === 'maps' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {business.latitude && business.longitude && (
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Coordinates</div>
                                <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{business.latitude}, {business.longitude}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel">
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} /> Source Intelligence
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Collection Job</div>
                            <span style={{ fontWeight: 500 }}>{business.job ? `Job #${business.job.id} - ${business.job.query}` : 'Manual Entry'}</span>
                        </div>
                        
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Collection Date</div>
                            <span style={{ fontWeight: 500 }}>{new Date(business.collection_date).toLocaleString()}</span>
                        </div>
                        
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Website Status</div>
                            <span style={{ fontWeight: 500, color: business.website_exists ? 'var(--status-won)' : 'var(--text-muted)' }}>
                                {business.website_exists ? 'Active' : 'No Website'}
                            </span>
                        </div>

                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>System Status</div>
                            <span style={{ fontWeight: 500 }}>{business.discovery_status}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </motion.div>
    );
}
