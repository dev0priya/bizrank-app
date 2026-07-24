'use client';

import React, { useState, useEffect } from 'react';

export default function DiscoveryPage() {
    const [masterData, setMasterData] = useState<any>({ countries: [], states: [], cities: [], areas: [], categories: [] });
    
    // Form state
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // Job state
    const [jobId, setJobId] = useState<number | null>(null);
    const [jobStatus, setJobStatus] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    
    // Results state
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Filter state
    const [hasWebsite, setHasWebsite] = useState(false);
    const [hasPhone, setHasPhone] = useState(false);
    const [minRating, setMinRating] = useState(0);

    // Fetch Master Data on mount
    useEffect(() => {
        fetch('/api/master')
            .then(res => res.json())
            .then(data => setMasterData(data))
            .catch(console.error);
    }, []);

    // Filter dependent dropdowns
    const availableStates = masterData.states.filter((s: any) => !selectedCountry || s.countryId === parseInt(selectedCountry));
    const availableCities = masterData.cities.filter((c: any) => !selectedState || c.stateId === parseInt(selectedState));
    const availableAreas = masterData.areas.filter((a: any) => !selectedCity || a.cityId === parseInt(selectedCity));

    const handleCollect = async () => {
        if (!selectedCategory || !selectedCity) {
            alert('Please select at least a City and Category.');
            return;
        }

        const payload = {
            country: masterData.countries.find((c: any) => c.id === parseInt(selectedCountry))?.name || '',
            state: masterData.states.find((s: any) => s.id === parseInt(selectedState))?.name || '',
            city: masterData.cities.find((c: any) => c.id === parseInt(selectedCity))?.name || '',
            area: masterData.areas.find((a: any) => a.id === parseInt(selectedArea))?.name || '',
            category: masterData.categories.find((c: any) => c.id === parseInt(selectedCategory))?.name || '',
        };

        const res = await fetch('/api/jobs', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.jobId) {
            setJobId(data.jobId);
            setJobStatus('Running');
            setProgress(0);
        }
    };

    // Polling Loop
    useEffect(() => {
        if (!jobId || jobStatus === 'Completed' || jobStatus === 'Failed') return;

        const interval = setInterval(async () => {
            const res = await fetch(`/api/jobs/${jobId}`);
            const data = await res.json();
            
            setJobStatus(data.status);
            setProgress(data.progress || 0);

            if (data.status === 'Completed') {
                clearInterval(interval);
                fetchResults();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [jobId, jobStatus]);

    const fetchResults = async () => {
        const query = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            hasWebsite: hasWebsite.toString(),
            hasPhone: hasPhone.toString(),
            minRating: minRating.toString()
        });

        const res = await fetch(`/api/businesses?${query}`);
        const data = await res.json();
        if (data.data) {
            setBusinesses(data.data);
            setTotalPages(data.pagination.totalPages);
        }
    };

    // Re-fetch when filters or page changes
    useEffect(() => {
        fetchResults();
    }, [page, hasWebsite, hasPhone, minRating]);

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
        a.download = 'businesses.csv';
        a.click();
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 className="text-gradient" style={{ marginBottom: '24px' }}>Business Discovery</h1>

            {/* Master Data Selection Form */}
            <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label>Country</label>
                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        <option value="">Select Country</option>
                        {masterData.countries.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label>State</label>
                    <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        <option value="">Select State</option>
                        {availableStates.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label>City</label>
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        <option value="">Select City</option>
                        {availableCities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label>Area</label>
                    <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        <option value="">Select Area</option>
                        {availableAreas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label>Category</label>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        <option value="">Select Category</option>
                        {masterData.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <button 
                onClick={handleCollect} 
                disabled={jobStatus === 'Running'}
                style={{ background: jobStatus === 'Running' ? 'var(--border)' : 'var(--accent)', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                {jobStatus === 'Running' ? 'Collection Job Running...' : 'Collect Businesses'}
            </button>

            {jobStatus === 'Running' && (
                <div style={{ marginTop: '16px', background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--status-won)', transition: 'width 0.3s ease' }} />
                </div>
            )}

            {jobStatus === 'Completed' && (
                <div style={{ marginTop: '16px', color: 'var(--status-won)', fontWeight: 'bold' }}>Job Completed Successfully!</div>
            )}

            <hr style={{ margin: '32px 0', borderColor: 'var(--border)' }} />

            {/* Filters & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={hasWebsite} onChange={e => setHasWebsite(e.target.checked)} />
                        Has Website
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={hasPhone} onChange={e => setHasPhone(e.target.checked)} />
                        Has Phone
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Min Rating:
                        <input type="number" min="0" max="5" step="0.1" value={minRating} onChange={e => setMinRating(parseFloat(e.target.value))} style={{ width: '60px', padding: '4px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }} />
                    </label>
                </div>
                <button onClick={exportCSV} style={{ background: 'var(--surface)', color: 'var(--text)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>
                    Export CSV
                </button>
            </div>

            {/* Results Table */}
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Category</th>
                            <th style={{ padding: '12px' }}>Rating</th>
                            <th style={{ padding: '12px' }}>Reviews</th>
                            <th style={{ padding: '12px' }}>Website</th>
                            <th style={{ padding: '12px' }}>AI Score</th>
                            <th style={{ padding: '12px' }}>Opp Score</th>
                            <th style={{ padding: '12px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {businesses.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px' }}>{b.business_name}</td>
                                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{b.category?.name || 'N/A'}</td>
                                <td style={{ padding: '12px' }}>{b.rating || 'N/A'}</td>
                                <td style={{ padding: '12px' }}>{b.review_count || 'N/A'}</td>
                                <td style={{ padding: '12px' }}>
                                    {b.website ? <a href={b.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Link</a> : 'No'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '12px', background: b.ai_score >= 80 ? 'rgba(46, 213, 115, 0.2)' : b.ai_score >= 50 ? 'rgba(255, 165, 2, 0.2)' : 'rgba(255, 71, 87, 0.2)', color: b.ai_score >= 80 ? '#2ed573' : b.ai_score >= 50 ? '#ffa502' : '#ff4757', fontSize: '12px', fontWeight: 'bold' }}>
                                        {b.ai_score}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '12px', background: b.opportunity_score >= 80 ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 165, 2, 0.2)', color: b.opportunity_score >= 80 ? '#2ed573' : '#ffa502', fontSize: '12px', fontWeight: 'bold' }}>
                                        {b.opportunity_score}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '12px' }}>{b.discovery_status}</td>
                            </tr>
                        ))}
                        {businesses.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No businesses found. Try collecting some data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button 
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button 
                    disabled={page === totalPages || totalPages === 0} 
                    onClick={() => setPage(p => p + 1)}
                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
