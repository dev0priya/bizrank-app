'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Download, MapPin, Phone, Globe, Mail, Star, ExternalLink, Plus 
} from 'lucide-react';
import Link from 'next/link';

export default function JobViewerClient({ job, businesses: initialBusinesses }: { job: any, businesses: any[] }) {
    const [businesses, setBusinesses] = useState(initialBusinesses);

    if (!job) {
        return <div style={{ padding: '24px' }}>Job not found.</div>;
    }

    const exportCSV = () => {
        if (!businesses.length) return;
        const headers = ['Business Name', 'Category', 'Rating', 'Reviews', 'Phone', 'Website', 'Website Exists', 'AI Score', 'Opportunity Score'];
        const rows = businesses.map(b => [
            `"${b.business_name}"`, 
            `"${b.category?.name || ''}"`, 
            b.rating, 
            b.review_count, 
            `"${b.phone_number || ''}"`, 
            `"${b.website || ''}"`,
            b.website_exists ? 'Yes' : 'No',
            b.ai_score,
            b.opportunity_score
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job_${job.id}_results.csv`;
        a.click();
    };

    const handleQualify = async (id: number) => {
        try {
            const res = await fetch(`/api/businesses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discovery_status: 'Qualified' })
            });
            if (res.ok) {
                setBusinesses(businesses.map(b => b.id === id ? { ...b, discovery_status: 'Qualified' } : b));
            }
        } catch (error) {
            console.error('Failed to qualify business', error);
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <Link href="/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', textDecoration: 'none' }}>
                    <ArrowLeft size={18} /> Back to Ledger
                </Link>
                <h1 style={{ margin: 0 }}>Job #{job.id} Results</h1>
            </div>

            <div className="glass-panel" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                        {job.query}
                    </div>
                    <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        <span>Status: <strong style={{ color: job.status === 'Completed' ? 'var(--status-won)' : 'var(--text-main)' }}>{job.status}</strong></span>
                        <span>Businesses Saved: <strong>{businesses.length}</strong></span>
                        <span>Completed: {new Date(job.updatedAt).toLocaleString()}</span>
                    </div>
                </div>
                <button 
                    onClick={exportCSV}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                >
                    <Download size={18} /> Download CSV
                </button>
            </div>

            <div className="glass-panel">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Business</th>
                                <th style={{ padding: '12px' }}>Category</th>
                                <th style={{ padding: '12px' }}>Rating</th>
                                <th style={{ padding: '12px' }}>Contact Info</th>
                                <th style={{ padding: '12px' }}>Location</th>
                                <th style={{ padding: '12px' }}>Scores</th>
                                <th style={{ padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {businesses.map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>{b.business_name}</td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{b.category?.name || 'N/A'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                            <span>{b.rating || 'N/A'} ({b.review_count || 0})</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {b.phone_number ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {b.phone_number}</span> : null}
                                            {b.website ? <a href={b.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', textDecoration: 'none' }}><Globe size={12}/> Website</a> : null}
                                            {b.email ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12}/> {b.email}</span> : null}
                                            {!b.phone_number && !b.website && !b.email && <span style={{ color: 'var(--text-muted)' }}>No contact info</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                                        {b.area ? `${b.area.name}, ` : ''}{b.city?.name || 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className={`badge ${b.ai_score >= 70 ? 'badge-priority-c' : 'badge-priority-a'}`}>AI: {b.ai_score}</span>
                                            <span className={`badge ${b.opportunity_score >= 70 ? 'badge-priority-b' : 'badge-priority-a'}`}>Opp: {b.opportunity_score}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {b.google_maps_url && (
                                                <a href={b.google_maps_url} target="_blank" rel="noreferrer" title="Open Maps" style={{ color: 'var(--text-muted)' }}>
                                                    <MapPin size={16} />
                                                </a>
                                            )}
                                            <Link href={`/business/${b.id}`} title="View Details" style={{ color: 'var(--text-muted)' }}>
                                                <ExternalLink size={16} />
                                            </Link>
                                            <button 
                                                onClick={() => handleQualify(b.id)}
                                                disabled={b.discovery_status === 'Qualified'}
                                                title={b.discovery_status === 'Qualified' ? "Already Qualified" : "Qualify to CRM"} 
                                                style={{ background: 'none', border: 'none', color: b.discovery_status === 'Qualified' ? 'var(--text-muted)' : 'var(--accent-primary)', cursor: b.discovery_status === 'Qualified' ? 'not-allowed' : 'pointer' }}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {businesses.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No businesses found in this collection.
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
