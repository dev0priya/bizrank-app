'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, PlayCircle, Loader2, CheckCircle2, XCircle, MapPin, 
  Phone, Globe, Mail, Star, BarChart3, Clock, Plus, ExternalLink, Target, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard } from '../../components/ui/Skeleton';

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function BusinessDiscoveryPage() {
    const [masterData, setMasterData] = useState<any>({ countries: [], states: [], cities: [], areas: [], categories: [] });
    
    // Funnel State
    const [selectedProvider, setSelectedProvider] = useState('apify');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [maxResults, setMaxResults] = useState(20);
    
    const [availableCities, setAvailableCities] = useState<any[]>([]);
    const [availableAreas, setAvailableAreas] = useState<any[]>([]);

    useEffect(() => {
        if (!selectedState) {
            setAvailableCities([]);
            setSelectedCity('');
            return;
        }
        fetch(`/api/master/location?type=city&stateId=${selectedState}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setAvailableCities(data.data);
                }
            })
            .catch(console.error);
    }, [selectedState]);

    useEffect(() => {
        if (!selectedCity) {
            setAvailableAreas([]);
            setSelectedArea('');
            return;
        }
        fetch(`/api/master/location?type=area&parentId=${selectedCity}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setAvailableAreas(data.data);
                }
            })
            .catch(console.error);
    }, [selectedCity]);
    
    // Execution State
    const [jobId, setJobId] = useState<number | null>(null);
    const [jobStatus, setJobStatus] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    
    // Results State
    const [businesses, setBusinesses] = useState<any[]>([]);

    const [isHydrated, setIsHydrated] = useState(false);

    // Initial Load: Master Data
    useEffect(() => {
        fetch('/api/master')
            .then(res => res.json())
            .then(data => setMasterData(data))
            .catch(console.error);
    }, []);

    // Session Hydration
    useEffect(() => {
        const savedSession = sessionStorage.getItem('bizrank_discovery_session');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                setSelectedProvider(parsed.selectedProvider || 'apify');
                setSelectedCountry(parsed.selectedCountry || '');
                setSelectedState(parsed.selectedState || '');
                setSelectedCity(parsed.selectedCity || '');
                setSelectedArea(parsed.selectedArea || '');
                setSelectedCategory(parsed.selectedCategory || '');
                setMaxResults(parsed.maxResults || 20);
                
                setJobId(parsed.jobId || null);
                setJobStatus(parsed.jobStatus || '');
                setProgress(parsed.progress || 0);
                setStartTime(parsed.startTime || null);
                setElapsedTime(parsed.elapsedTime || 0);
                setBusinesses(parsed.businesses || []);

                // Restore Scroll
                if (parsed.scrollPosition) {
                    setTimeout(() => {
                        const mainContent = document.querySelector('.main-content');
                        if (mainContent) {
                            mainContent.scrollTop = parsed.scrollPosition;
                        }
                    }, 100);
                }
            } catch (e) {
                console.error("Failed to parse session", e);
            }
        }
        setIsHydrated(true);
    }, []);

    // Session Synchronization
    useEffect(() => {
        if (!isHydrated) return;

        const sessionState = {
            selectedProvider,
            selectedCountry,
            selectedState,
            selectedCity,
            selectedArea,
            selectedCategory,
            maxResults,
            jobId,
            jobStatus,
            progress,
            startTime,
            elapsedTime,
            businesses
        };
        
        sessionStorage.setItem('bizrank_discovery_session', JSON.stringify(sessionState));
    }, [isHydrated, selectedProvider, selectedCountry, selectedState, selectedCity, selectedArea, selectedCategory, maxResults, jobId, jobStatus, progress, startTime, elapsedTime, businesses]);

    // Scroll Position Tracking
    useEffect(() => {
        if (!isHydrated) return;

        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        let scrollTimeout: any;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const savedSession = sessionStorage.getItem('bizrank_discovery_session');
                if (savedSession) {
                    const parsed = JSON.parse(savedSession);
                    parsed.scrollPosition = mainContent.scrollTop;
                    sessionStorage.setItem('bizrank_discovery_session', JSON.stringify(parsed));
                }
            }, 100);
        };

        mainContent.addEventListener('scroll', handleScroll);
        return () => mainContent.removeEventListener('scroll', handleScroll);
    }, [isHydrated]);

    const handleClearSession = () => {
        sessionStorage.removeItem('bizrank_discovery_session');
        setSelectedProvider('apify');
        setSelectedCountry('');
        setSelectedState('');
        setSelectedCity('');
        setSelectedArea('');
        setSelectedCategory('');
        setMaxResults(20);
        setJobId(null);
        setJobStatus('');
        setProgress(0);
        setStartTime(null);
        setElapsedTime(0);
        setBusinesses([]);
    };

    const availableStates = masterData.states.filter((s: any) => !selectedCountry || s.countryId === parseInt(selectedCountry));

    const handleStartSearch = async () => {
        if (!selectedCategory || !selectedCity) {
            alert('Please select at least a City and Category.');
            return;
        }

        const payload = {
            provider: selectedProvider,
            country: masterData.countries.find((c: any) => c.id === parseInt(selectedCountry))?.name || '',
            state: masterData.states.find((s: any) => s.id === parseInt(selectedState))?.name || '',
            city: availableCities.find((c: any) => c.id === parseInt(selectedCity))?.name || '',
            area: availableAreas.find((a: any) => a.id === parseInt(selectedArea))?.name || '',
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
            setBusinesses([]); 
            
            // Auto reset scroll to top on new search
            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;
        } else if (data.error) {
            alert(`Error: ${data.error}`);
        }
    };

    useEffect(() => {
        if (jobStatus === 'Running' && startTime) {
            const timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [jobStatus, startTime]);

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

    if (!isHydrated) return null; // Avoid flash of unhydrated state

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ paddingBottom: '40px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={28} className="text-gradient" />
                    <h1 className="text-gradient" style={{ margin: 0 }}>Business Discovery</h1>
                </div>
                
                {jobId && (
                    <button 
                        onClick={handleClearSession}
                        className="btn-icon ripple"
                        title="Clear Results & Start New Search"
                    >
                        <RotateCcw size={16} /> New Search
                    </button>
                )}
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Execute highly targeted scraping jobs. Your session and scroll position are automatically saved.
            </p>

            {/* TOP FUNNEL: Search Execution Form */}
            <div className="glass-panel hover-lift" style={{ marginBottom: '32px' }}>
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

                    <div style={{ gridColumn: '1 / -1', marginTop: '16px', marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Business Data Provider</label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input type="radio" name="provider" value="apify" checked={selectedProvider === 'apify'} onChange={e => setSelectedProvider(e.target.value)} />
                                <span>Apify (Default)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input type="radio" name="provider" value="google_places" checked={selectedProvider === 'google_places'} onChange={e => setSelectedProvider(e.target.value)} />
                                <span>Google Places</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input type="radio" name="provider" value="mock" checked={selectedProvider === 'mock'} onChange={e => setSelectedProvider(e.target.value)} />
                                <span>Mock Provider</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <button 
                            className={`ripple hover-lift ${jobStatus !== 'Running' ? 'btn-primary' : ''}`}
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
            <AnimatePresence>
                {jobId && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-panel hover-lift" style={{ marginBottom: '32px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ISOLATED CURRENT RESULTS */}
            {jobStatus === 'Running' && (
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '20px' }}>Discovering Businesses...</h3>
                    <div className="card-grid">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            )}

            {jobStatus === 'Completed' && (
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '20px' }}>Current Search Results</h3>
                    
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="card-grid">
                        {businesses.map(b => (
                            <motion.div variants={cardVariants} key={b.id} className="card hover-lift">
                                {/* HEADER */}
                                <div className="card-header" style={{ flexDirection: 'column', gap: '12px', marginBottom: 0 }}>
                                    <div>
                                        <div className="card-title">{b.business_name}</div>
                                        <div className="card-subtitle" style={{ fontSize: '14px', marginBottom: '8px' }}>
                                            <Target size={14} /> {b.google_category || b.category?.name || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
                                            <Star size={16} color="#f59e0b" fill="#f59e0b" />
                                            <span>{b.rating || 'N/A'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({b.review_count || 0} reviews)</span></span>
                                        </div>
                                        <div className="card-scores">
                                            <span className={`badge ${b.opportunity_score >= 70 ? 'badge-priority-b' : 'badge-priority-a'}`}>
                                                Opportunity: {b.opportunity_score || 0}
                                            </span>
                                            <span className={`badge ${b.ai_score >= 70 ? 'badge-priority-c' : 'badge-priority-a'}`}>
                                                AI Score: {b.ai_score || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* BODY */}
                                <div className="card-body" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="card-detail-row" style={{ marginBottom: '12px' }}>
                                        <MapPin size={16} className="card-detail-icon" />
                                        <span style={{ whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: 1.5 }}>
                                            {b.full_address || b.city?.name || 'N/A'}
                                        </span>
                                    </div>
                                    {b.phone_number && (
                                        <div className="card-detail-row" style={{ marginBottom: '12px' }}>
                                            <Phone size={16} className="card-detail-icon" />
                                            <span>{b.phone_number}</span>
                                        </div>
                                    )}
                                    <div className="card-detail-row" style={{ marginBottom: '12px' }}>
                                        <Globe size={16} className="card-detail-icon" />
                                        <span style={{ color: b.website ? 'var(--status-won)' : 'var(--text-muted)', fontWeight: 500 }}>
                                            {b.website ? 'Website Available' : 'Website Missing'}
                                        </span>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="card-actions" style={{ flexWrap: 'wrap' }}>
                                    {b.google_maps_url && (
                                        <a href={b.google_maps_url} target="_blank" rel="noreferrer" className="btn-icon ripple">
                                            <MapPin size={16} /> Open Maps
                                        </a>
                                    )}
                                    {b.website ? (
                                        <a href={b.website} target="_blank" rel="noreferrer" className="btn-icon ripple">
                                            <Globe size={16} /> Visit Website
                                        </a>
                                    ) : (
                                        <button className="btn-icon ripple" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                            <Globe size={16} /> No Website Available
                                        </button>
                                    )}
                                    <Link href={`/business/${b.id}`} className="btn-icon ripple">
                                        <ExternalLink size={16} /> View Details
                                    </Link>
                                    <button 
                                        onClick={() => handleQualify(b.id)}
                                        disabled={b.discovery_status === 'Qualified'}
                                        className={`btn-icon ripple ${b.discovery_status === 'Qualified' ? '' : 'primary'}`}
                                        style={{ cursor: b.discovery_status === 'Qualified' ? 'not-allowed' : 'pointer', opacity: b.discovery_status === 'Qualified' ? 0.5 : 1 }}
                                    >
                                        {b.discovery_status === 'Qualified' ? <CheckCircle2 size={16} /> : <Plus size={16} />} 
                                        {b.discovery_status === 'Qualified' ? "Already Qualified" : "Add to CRM"}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        {businesses.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No businesses found in this collection.
                            </div>
                        )}
                    </motion.div>
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
                    transition: border-color 0.2s ease;
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
        </motion.div>
    );
}

function TargetIcon(props: any) {
    return <Target {...props} />
}
