'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, Search, MapPin, Phone, Globe, Mail, Star, 
  ExternalLink, Plus, Filter, LayoutGrid 
} from 'lucide-react';
import Link from 'next/link';

export default function DatabaseClient({ categories, cities, states }: { categories: any[], cities: any[], states: any[] }) {
    const [businesses, setBusinesses] = useState<any[]>([]);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [minAiScore, setMinAiScore] = useState(0);
    const [minOppScore, setMinOppScore] = useState(0);
    const [hasWebsite, setHasWebsite] = useState(false);
    const [hasPhone, setHasPhone] = useState(false);
    const [minRating, setMinRating] = useState(0);

    const fetchBusinesses = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '50',
            hasWebsite: hasWebsite.toString(),
            hasPhone: hasPhone.toString(),
            minRating: minRating.toString(),
            minAiScore: minAiScore.toString(),
            minOppScore: minOppScore.toString()
        });

        if (selectedCategory) params.append('categoryId', selectedCategory);

        try {
            const res = await fetch(`/api/businesses?${params.toString()}`);
            const data = await res.json();
            
            if (data.data) {
                setBusinesses(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalResults(data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch global database', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQualify = async (id: number) => {
        try {
            const res = await fetch(`/api/businesses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discovery_status: 'Qualified' })
            });
            if (res.ok) {
                // Update local state to reflect change visually
                setBusinesses(businesses.map(b => b.id === id ? { ...b, discovery_status: 'Qualified' } : b));
            }
        } catch (error) {
            console.error('Failed to qualify business', error);
        }
    };

    // Auto-fetch on filter or page change
    useEffect(() => {
        fetchBusinesses();
    }, [page, hasWebsite, hasPhone, minRating, minAiScore, minOppScore, selectedCategory]);

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Database size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Global Business Database</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Master directory of every scraped business. Use filters to identify qualified leads across all historical jobs.
            </p>

            {/* FILTER PANEL */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
                    <Filter size={18} /> Deep Filtering
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'end' }}>
                    
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Category</label>
                        <select 
                            className="select-input" 
                            value={selectedCategory} 
                            onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Min AI Score: {minAiScore}
                        </label>
                        <input 
                            type="range" 
                            min="0" max="100" step="5"
                            value={minAiScore} 
                            onChange={e => { setMinAiScore(parseInt(e.target.value)); setPage(1); }}
                            style={{ width: '100%', cursor: 'pointer' }} 
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Min Opp Score: {minOppScore}
                        </label>
                        <input 
                            type="range" 
                            min="0" max="100" step="5"
                            value={minOppScore} 
                            onChange={e => { setMinOppScore(parseInt(e.target.value)); setPage(1); }}
                            style={{ width: '100%', cursor: 'pointer' }} 
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hasWebsite} onChange={e => { setHasWebsite(e.target.checked); setPage(1); }} />
                            Has Website
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hasPhone} onChange={e => { setHasPhone(e.target.checked); setPage(1); }} />
                            Has Phone
                        </label>
                    </div>

                </div>
            </div>

            {/* RESULTS STATS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Showing page {page} of {totalPages} (Total: {totalResults} businesses)
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => p - 1)}
                        style={{ padding: '6px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Previous
                    </button>
                    <button 
                        disabled={page === totalPages || totalPages === 0 || loading}
                        onClick={() => setPage(p => p + 1)}
                        style={{ padding: '6px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* MASTER GRID */}
            <div className="glass-panel" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Business Details</th>
                                <th style={{ padding: '12px' }}>Google Category</th>
                                <th style={{ padding: '12px' }}>Complete Address</th>
                                <th style={{ padding: '12px' }}>Contact & Links</th>
                                <th style={{ padding: '12px' }}>Google Rating</th>
                                <th style={{ padding: '12px' }}>Owner Name</th>
                                <th style={{ padding: '12px' }}>Business Status</th>
                                <th style={{ padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {businesses.map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 600 }}>{b.business_name}</div>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{b.google_category || b.category?.name || '-'}</td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                                        {b.full_address || '-'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {b.phone_number ? <span style={{ fontSize: '12px' }}>{b.phone_number}</span> : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Phone</span>}
                                            {b.website && <a href={b.website} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>Website</a>}
                                            {b.google_maps_url && <a href={b.google_maps_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>View Maps</a>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--status-won)' }}>{b.rating !== null ? b.rating : '-'}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({b.review_count || 0})</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                                        {b.owner_name || 'Not Available'}
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                                        {b.business_status || '-'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
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
                            {businesses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No businesses found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .select-input {
                    width: 100%;
                    padding: 8px;
                    background: rgba(0, 0, 0, 0.2);
                    color: var(--text-main);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    outline: none;
                }
            `}</style>
        </div>
    );
}
