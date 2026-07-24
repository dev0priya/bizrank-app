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
