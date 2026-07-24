'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, PlayCircle, Loader2, CheckCircle2, XCircle, MapPin, 
  Phone, Globe, Mail, Star, BarChart3, Clock, Plus, ExternalLink, Target 
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessDiscoveryPage() {
    const [masterData, setMasterData] = useState<any>({ countries: [], states: [], cities: [], areas: [], categories: [] });
    
    // Funnel State
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [maxResults, setMaxResults] = useState(20);
    
    // Execution State
    const [jobId, setJobId] = useState<number | null>(null);
    const [jobStatus, setJobStatus] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    
    // Results State
    const [businesses, setBusinesses] = useState<any[]>([]);

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

    const handleStartSearch = async () => {
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
            maxResults
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
            setStartTime(Date.now());
            setElapsedTime(0);
            setBusinesses([]); // Clear previous results
        }
    };

    // Elapsed Time Timer
    useEffect(() => {
        if (jobStatus === 'Running' && startTime) {
            const timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [jobStatus, startTime]);

    // Polling Loop for Job Status
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
        if (!jobId) return;
        
        // Mode 1: Fetch strictly isolated dataset
        const res = await fetch(`/api/businesses?jobId=${jobId}&limit=100`);
        const data = await res.json();
        if (data.data) {
            setBusinesses(data.data);
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
                setBusinesses(businesses.map(b => b.id === id ? { ...b, discovery_status: 'Qualified' } : b));
            }
        } catch (error) {
            console.error('Failed to qualify business', error);
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Search size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Business Discovery</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Execute highly targeted scraping jobs. Results shown here are strictly isolated to the current run.
            </p>

            {/* TOP FUNNEL: Search Execution Form */}
            <div className="glass-panel" style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TargetIcon size={18} /> Define Discovery Target
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Country</label>
                        <select className="select-input" value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
                            <option value="">Any Country</option>
                            {masterData.countries.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>State/Province</label>
                        <select className="select-input" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
                            <option value="">Any State</option>
                            {availableStates.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>City *</label>
                        <select className="select-input" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                            <option value="">Select City</option>
                            {availableCities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Area/Locality</label>
                        <select className="select-input" value={selectedArea} onChange={e => setSelectedArea(e.target.value)}>
                            <option value="">Any Area</option>
                            {availableAreas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Category *</label>
                        <select className="select-input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                            <option value="">Select Category</option>
                            {masterData.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Max Results</label>
                        <input type="number" className="select-input" value={maxResults} onChange={e => setMaxResults(parseInt(e.target.value) || 20)} min="1" max="500" />
                    </div>

                    <div>
                        <button 
                            className="btn-primary"
                            onClick={handleStartSearch} 
                            disabled={jobStatus === 'Running'}
                            style={{ 
                                width: '100%', 
                                padding: '10px 16px', 
                                background: jobStatus === 'Running' ? 'var(--panel-bg)' : 'var(--accent-primary)',
                                color: jobStatus === 'Running' ? 'var(--text-muted)' : 'white',
                                border: jobStatus === 'Running' ? '1px solid var(--border-color)' : 'none',
                                borderRadius: '8px',
                                cursor: jobStatus === 'Running' ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontWeight: 600
                            }}
                        >
                            {jobStatus === 'Running' ? <Loader2 size={18} className="spin" /> : <PlayCircle size={18} />}
                            {jobStatus === 'Running' ? 'Executing...' : 'Start Search'}
                        </button>
                    </div>
                </div>
            </div>

            {/* PROGRESS CARD */}
            {jobId && (
                <div className="glass-panel" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            Job #{jobId} Status
                            {jobStatus === 'Running' && <span className="badge badge-priority-b">Running</span>}
                            {jobStatus === 'Completed' && <span className="badge badge-priority-c">Completed</span>}
                            {jobStatus === 'Failed' && <span className="badge badge-priority-a">Failed</span>}
                        </h3>
                        <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} /> {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={16} /> Businesses Found: {jobStatus === 'Completed' ? businesses.length : '-'}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${progress}%`, 
                            height: '100%', 
                            background: jobStatus === 'Failed' ? 'var(--status-lost)' : 'var(--status-won)', 
                            transition: 'width 0.5s ease' 
                        }} />
                    </div>
                </div>
            )}

            {/* ISOLATED CURRENT RESULTS */}
            {jobStatus === 'Completed' && (
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '20px' }}>Current Search Results</h3>
                    
                    <div className="card-grid">
                        {businesses.map(b => (
                            <div key={b.id} className="card">
                                <div className="card-header">
                                    <div style={{ overflow: 'hidden' }}>
                                        <div className="card-title" title={b.business_name}>{b.business_name}</div>
                                        <div className="card-subtitle">
                                            <Target size={12} /> {b.google_category || b.category?.name || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="card-detail-row" style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                                        <Star size={14} color="#f59e0b" fill="#f59e0b" className="card-detail-icon" />
                                        <span>{b.rating || 'N/A'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({b.review_count || 0} reviews)</span></span>
                                    </div>
                                    <div className="card-detail-row">
                                        <MapPin size={14} className="card-detail-icon" />
                                        <span title={b.full_address || b.city?.name || 'N/A'} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {b.full_address || b.city?.name || 'N/A'}
                                        </span>
                                    </div>
                                    {b.phone_number && (
                                        <div className="card-detail-row">
                                            <Phone size={14} className="card-detail-icon" />
                                            <span>{b.phone_number}</span>
                                        </div>
                                    )}
                                    {b.website && (
                                        <div className="card-detail-row">
                                            <Globe size={14} className="card-detail-icon" />
                                            <span style={{ color: 'var(--status-won)' }}>Website Active</span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-scores">
                                    <span className={`badge ${b.ai_score >= 70 ? 'badge-priority-c' : 'badge-priority-a'}`} style={{ flex: 1, textAlign: 'center' }}>
                                        AI: {b.ai_score || 0}
                                    </span>
                                    <span className={`badge ${b.opportunity_score >= 70 ? 'badge-priority-b' : 'badge-priority-a'}`} style={{ flex: 1, textAlign: 'center' }}>
                                        Opp: {b.opportunity_score || 0}
                                    </span>
                                </div>

                                <div className="card-actions">
                                    {b.google_maps_url && (
                                        <a href={b.google_maps_url} target="_blank" rel="noreferrer" className="btn-icon" title="Open Maps">
                                            <MapPin size={16} />
                                        </a>
                                    )}
                                    {b.website && (
                                        <a href={b.website} target="_blank" rel="noreferrer" className="btn-icon" title="Visit Website">
                                            <Globe size={16} />
                                        </a>
                                    )}
                                    <Link href={`/business/${b.id}`} className="btn-icon" title="View Details">
                                        <ExternalLink size={16} />
                                    </Link>
                                    <button 
                                        onClick={() => handleQualify(b.id)}
                                        disabled={b.discovery_status === 'Qualified'}
                                        className={`btn-icon ${b.discovery_status === 'Qualified' ? '' : 'primary'}`}
                                        title={b.discovery_status === 'Qualified' ? "Already Qualified" : "Qualify to CRM"} 
                                        style={{ cursor: b.discovery_status === 'Qualified' ? 'not-allowed' : 'pointer', opacity: b.discovery_status === 'Qualified' ? 0.5 : 1 }}
                                    >
                                        {b.discovery_status === 'Qualified' ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {businesses.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No businesses found in this collection.
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .select-input {
                    width: 100%;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    color: var(--text-main);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    outline: none;
                }
                .select-input:focus {
                    border-color: var(--accent-primary);
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

function TargetIcon(props: any) {
    return <Target {...props} />
}
