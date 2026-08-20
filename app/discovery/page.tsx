'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, PlayCircle, Loader2, CheckCircle2, MapPin,
  Phone, Globe, Star, BarChart3, Clock, Plus, ExternalLink,
  Target, RotateCcw, ChevronDown, ChevronUp, Filter, AlertCircle,
  TrendingUp, Zap, Building2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard } from '../../components/ui/Skeleton';

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const cardVariants: any = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } }
};

interface LocationSuggestion {
  id: number;
  name: string;
  displayName: string;
  type: string;
  stateId: number;
  stateName: string;
  cityId: number | null;
  cityName: string | null;
  areaId: number | null;
  areaName: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface StateData {
  id: number;
  name: string;
  type: string; // STATE | UNION_TERRITORY
  code?: string;
}

interface CategoryData {
  id: number;
  name: string;
  displayName?: string;
  websiteOpportunityWeight?: number;
}

interface BusinessResult {
  id: number;
  business_name: string;
  full_address?: string;
  phone_number?: string;
  website?: string;
  website_status: string;
  rating?: number;
  review_count?: number;
  opportunity_score?: number;
  opportunity_level?: string;
  google_maps_url?: string;
  category?: { name: string };
  city?: { name: string };
  state?: { name: string };
  discovery_status: string;
  crm_lead?: { id: number } | null;
}

function OpportunityBadge({ level, score }: { level?: string; score?: number }) {
  const conf: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    HIGH: { label: 'HIGH', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <Zap size={12} /> },
    MEDIUM: { label: 'MEDIUM', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <TrendingUp size={12} /> },
    LOW: { label: 'LOW', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: <BarChart3 size={12} /> },
    NOT_TARGET: { label: 'NOT TARGET', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertCircle size={12} /> },
  };
  const c = conf[level || ''] || conf['LOW'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
      color: c.color, background: c.bg, border: `1px solid ${c.color}30`,
    }}>
      {c.icon} {c.label} {score !== undefined ? `· ${score}` : ''}
    </span>
  );
}

function WebsiteBadge({ status }: { status?: string }) {
  const conf: Record<string, { label: string; color: string }> = {
    NO_WEBSITE: { label: 'No Website', color: '#ef4444' },
    UNKNOWN: { label: 'No Website Detected', color: '#f59e0b' },
    WEBSITE_FOUND: { label: 'Website Found', color: '#3b82f6' },
    WEBSITE_VERIFIED: { label: 'Website Verified', color: '#10b981' },
    LOW_QUALITY_WEBSITE: { label: 'Poor Website', color: '#f59e0b' },
  };
  const c = conf[status || 'UNKNOWN'] || conf['UNKNOWN'];
  return <span style={{ color: c.color, fontSize: '13px', fontWeight: 500 }}>{c.label}</span>;
}

export default function BusinessDiscoveryPage() {
  // Master data
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // Funnel selection
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedStateObj, setSelectedStateObj] = useState<StateData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Location autocomplete state
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const locationDebounce = useRef<any>(null);

  // Filters (collapsible)
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [minReviews, setMinReviews] = useState('');
  const [maxReviews, setMaxReviews] = useState('');
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('all');
  const [opportunityFilter, setOpportunityFilter] = useState('all');
  const [maxResults, setMaxResults] = useState(20);
  const [selectedProvider, setSelectedProvider] = useState('apify');
  const [sortBy, setSortBy] = useState('opportunity_score');

  // Job state
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Results
  const [businesses, setBusinesses] = useState<BusinessResult[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isHydrated, setIsHydrated] = useState(false);

  // Load master data
  useEffect(() => {
    fetch('/api/master')
      .then(r => r.json())
      .then(data => {
        setCountries(data.countries || []);
        setStates(data.states || []);
        setCategories(data.categories || []);
        // Auto-select India
        const india = (data.countries || []).find((c: any) => c.name === 'India');
        if (india) setSelectedCountry(String(india.id));
      })
      .catch(console.error);
    setIsHydrated(true);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Location autocomplete — state-scoped
  const handleLocationInput = useCallback((q: string) => {
    setLocationQuery(q);
    setSelectedLocation(null); // clear selection when typing

    if (!selectedState) {
      setLocationSuggestions([]);
      return;
    }

    clearTimeout(locationDebounce.current);
    if (q.length < 1) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    locationDebounce.current = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(q)}&stateId=${selectedState}&limit=8`);
        const data = await res.json();
        setLocationSuggestions(data.data || []);
        setShowSuggestions(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLocationLoading(false);
      }
    }, 250);
  }, [selectedState]);

  const handleLocationSelect = (loc: LocationSuggestion) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.displayName);
    setShowSuggestions(false);
  };

  const handleStateChange = (val: string) => {
    setSelectedState(val);
    const stateObj = states.find(s => String(s.id) === val) || null;
    setSelectedStateObj(stateObj);
    // Clear location when state changes
    setSelectedLocation(null);
    setLocationQuery('');
    setLocationSuggestions([]);
  };

  const handleStartSearch = async () => {
    if (!selectedState) {
      alert('Please select a State first.');
      return;
    }
    if (!selectedCategory) {
      alert('Please select a Business Category.');
      return;
    }

    const stateObj = states.find(s => String(s.id) === selectedState);
    const categoryObj = categories.find(c => String(c.id) === selectedCategory);
    const countryObj = countries.find(c => String(c.id) === selectedCountry);

    const payload = {
      provider: selectedProvider,
      country: countryObj?.name || 'India',
      state: stateObj?.name || '',
      city: selectedLocation?.cityName || '',
      area: selectedLocation?.areaName || '',
      locationName: selectedLocation?.name || '',
      locationLat: selectedLocation?.latitude || null,
      locationLng: selectedLocation?.longitude || null,
      radiusKm: 5.0,
      category: categoryObj?.name || '',
      countryId: parseInt(selectedCountry) || null,
      stateId: parseInt(selectedState) || null,
      cityId: selectedLocation?.cityId || null,
      areaId: selectedLocation?.areaId || null,
      categoryId: parseInt(selectedCategory) || null,
      maxResults,
    };

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.jobId) {
      setJobId(data.jobId);
      setJobStatus('Running');
      setProgress(0);
      setStartTime(Date.now());
      setElapsedTime(0);
      setBusinesses([]);
      setTotalResults(0);
      setCurrentPage(1);
    } else {
      alert(`Error: ${data.error}`);
    }
  };

  // Elapsed time counter
  useEffect(() => {
    if (jobStatus === 'Running' && startTime) {
      const t = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000);
      return () => clearInterval(t);
    }
  }, [jobStatus, startTime]);

  // Poll job status
  useEffect(() => {
    if (!jobId || jobStatus === 'Completed' || jobStatus === 'Failed') return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      setJobStatus(data.status);
      setProgress(data.progress || 0);
      if (data.status === 'Completed') {
        clearInterval(interval);
        fetchResults(1);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const fetchResults = async (page: number) => {
    if (!jobId) return;
    const params = new URLSearchParams({
      jobId: String(jobId),
      page: String(page),
      limit: '20',
      sort: sortBy,
    });
    if (websiteFilter && websiteFilter !== 'all') params.set('websiteStatus', websiteFilter);
    if (phoneFilter === 'available') params.set('hasPhone', 'true');
    if (opportunityFilter && opportunityFilter !== 'all') params.set('opportunityLevel', opportunityFilter);
    if (minRating) params.set('minRating', minRating);
    if (maxRating) params.set('maxRating', maxRating);
    if (minReviews) params.set('minReviews', minReviews);
    if (maxReviews) params.set('maxReviews', maxReviews);

    const res = await fetch(`/api/businesses?${params.toString()}`);
    const data = await res.json();
    if (data.data) {
      setBusinesses(data.data);
      setTotalResults(data.pagination?.total || 0);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.totalPages || 1);
    }
  };

  const handleAddToCRM = async (businessId: number) => {
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBusinesses(prev => prev.map(b =>
          b.id === businessId ? { ...b, discovery_status: 'Qualified', crm_lead: { id: data.leadId } } : b
        ));
      } else {
        alert(`CRM Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClear = () => {
    setJobId(null);
    setJobStatus('');
    setProgress(0);
    setStartTime(null);
    setElapsedTime(0);
    setBusinesses([]);
    setTotalResults(0);
  };

  const availableStates = selectedCountry
    ? states.filter(s => {
        // States come from DB which is already country-filtered via seed, just show all
        return true;
      })
    : states;

  if (!isHydrated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ paddingBottom: '60px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Building2 size={28} className="text-gradient" />
          <div>
            <h1 className="text-gradient" style={{ margin: 0 }}>Business Discovery</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
              Find businesses that are strong website-development leads
            </p>
          </div>
        </div>
        {jobId && (
          <button onClick={handleClear} className="btn-icon ripple" title="New Search">
            <RotateCcw size={16} /> New Search
          </button>
        )}
      </div>

      {/* SEARCH FORM */}
      <div className="glass-panel hover-lift" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} /> Define Discovery Target
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'start' }}>

          {/* Country (fixed: India) */}
          <div>
            <label style={labelStyle}>Country</label>
            <select className="select-input" value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
              <option value="">Select Country</option>
              {countries.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* State */}
          <div>
            <label style={labelStyle}>State / Union Territory <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
            <select className="select-input" value={selectedState} onChange={e => handleStateChange(e.target.value)}>
              <option value="">Select State</option>
              {/* States */}
              <optgroup label="States">
                {availableStates.filter(s => s.type === 'STATE').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
              {/* Union Territories */}
              <optgroup label="Union Territories">
                {availableStates.filter(s => s.type === 'UNION_TERRITORY').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Location / Area (autocomplete) */}
          <div ref={locationRef} style={{ position: 'relative' }}>
            <label style={labelStyle}>
              Location / Area
              {!selectedState && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}> (select state first)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="select-input"
                style={{ paddingLeft: '30px' }}
                placeholder={selectedState ? `Search in ${selectedStateObj?.name || 'state'}...` : 'Select state first'}
                value={locationQuery}
                disabled={!selectedState}
                onChange={e => handleLocationInput(e.target.value)}
                onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
              />
              {locationLoading && (
                <Loader2 size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} className="spin" />
              )}
            </div>
            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && locationSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'var(--panel-bg)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', marginTop: '4px', overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  {locationSuggestions.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-main)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '13px',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{loc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{loc.displayName} · {loc.type}</div>
                      </div>
                    </button>
                  ))}
                  {locationSuggestions.length === 0 && locationQuery.length > 1 && (
                    <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No matching locations in {selectedStateObj?.name}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {selectedLocation && (
              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
                ✓ {selectedLocation.displayName}
                {selectedLocation.latitude && ` (${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude?.toFixed(4)})`}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Business Category <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
            <select className="select-input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filters Toggle */}
        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <Filter size={14} /> Opportunity Filters
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {/* Rating Range */}
                  <div>
                    <label style={labelStyle}>Min Rating</label>
                    <input type="number" className="select-input" placeholder="e.g. 3.5" min="0" max="5" step="0.5" value={minRating} onChange={e => setMinRating(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Rating</label>
                    <input type="number" className="select-input" placeholder="e.g. 5.0" min="0" max="5" step="0.5" value={maxRating} onChange={e => setMaxRating(e.target.value)} />
                  </div>
                  {/* Reviews Range */}
                  <div>
                    <label style={labelStyle}>Min Reviews</label>
                    <input type="number" className="select-input" placeholder="e.g. 10" min="0" value={minReviews} onChange={e => setMinReviews(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Reviews</label>
                    <input type="number" className="select-input" placeholder="e.g. 500" min="0" value={maxReviews} onChange={e => setMaxReviews(e.target.value)} />
                  </div>
                  {/* Website */}
                  <div>
                    <label style={labelStyle}>Website Status</label>
                    <select className="select-input" value={websiteFilter} onChange={e => setWebsiteFilter(e.target.value)}>
                      <option value="NO_WEBSITE">No Website</option>
                      <option value="UNKNOWN">No Website Detected</option>
                      <option value="LOW_QUALITY_WEBSITE">Poor Website</option>
                      <option value="">All</option>
                    </select>
                  </div>
                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <select className="select-input" value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)}>
                      <option value="available">Available</option>
                      <option value="">All</option>
                    </select>
                  </div>
                  {/* Opportunity */}
                  <div>
                    <label style={labelStyle}>Opportunity Level</label>
                    <select className="select-input" value={opportunityFilter} onChange={e => setOpportunityFilter(e.target.value)}>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="">All</option>
                    </select>
                  </div>
                  {/* Sort */}
                  <div>
                    <label style={labelStyle}>Sort By</label>
                    <select className="select-input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      <option value="opportunity_score">Opportunity Score</option>
                      <option value="rating">Rating</option>
                      <option value="review_count">Reviews</option>
                      <option value="collection_date">Newest</option>
                    </select>
                  </div>
                  {/* Max Results */}
                  <div>
                    <label style={labelStyle}>Max Results</label>
                    <input type="number" className="select-input" value={maxResults} min="1" max="200" onChange={e => setMaxResults(parseInt(e.target.value) || 20)} />
                  </div>
                </div>

                {/* Provider option removed to enforce Apify usage */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Button */}
        <div style={{ marginTop: '20px' }}>
          <button
            className={`ripple hover-lift ${jobStatus !== 'Running' ? 'btn-primary' : ''}`}
            onClick={handleStartSearch}
            disabled={jobStatus === 'Running'}
            style={{
              width: '100%', padding: '12px 16px',
              background: jobStatus === 'Running' ? 'var(--panel-bg)' : 'var(--accent-primary)',
              color: jobStatus === 'Running' ? 'var(--text-muted)' : 'white',
              border: jobStatus === 'Running' ? '1px solid var(--border-color)' : 'none',
              borderRadius: '8px',
              cursor: jobStatus === 'Running' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontWeight: 700, fontSize: '15px',
            }}
          >
            {jobStatus === 'Running' ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
            {jobStatus === 'Running' ? 'Searching Businesses...' : '🔍 Search Businesses'}
          </button>
        </div>

        {/* Location-state validation hint */}
        {selectedState && !selectedLocation && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Select a city or area for more precise results.
          </div>
        )}
      </div>

      {/* JOB PROGRESS */}
      <AnimatePresence>
        {jobId && jobStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel"
            style={{ marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Job #{jobId}
                {jobStatus === 'Running' && <span className="badge badge-priority-b">Running</span>}
                {jobStatus === 'Completed' && <span className="badge badge-priority-c">Completed</span>}
                {jobStatus === 'Failed' && <span className="badge badge-priority-a">Failed</span>}
              </h4>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
                </span>
                {jobStatus === 'Completed' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={14} /> {totalResults} businesses
                  </span>
                )}
              </div>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: jobStatus === 'Failed' ? 'var(--status-lost)' : 'var(--status-won)', borderRadius: '3px' }}
                initial={{ width: '0%' }}
                animate={{ width: `${jobStatus === 'Completed' ? 100 : progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SKELETON LOADING */}
      {jobStatus === 'Running' && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: '20px' }}>Discovering Businesses...</h3>
          <div className="card-grid">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </div>
      )}

      {/* RESULTS */}
      {jobStatus === 'Completed' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>
              Results
              {totalResults > 0 && (
                <span style={{ marginLeft: '10px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  {totalResults} business{totalResults !== 1 ? 'es' : ''} found
                </span>
              )}
            </h3>
            {jobStatus === 'Completed' && totalResults > 0 && (
              <button
                onClick={() => fetchResults(currentPage)}
                className="btn-icon ripple"
                style={{ fontSize: '13px' }}
              >
                <Filter size={14} /> Apply Filters
              </button>
            )}
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="card-grid">
            {businesses.map(b => (
              <motion.div variants={cardVariants} key={b.id} className="card hover-lift">
                {/* Card Header */}
                <div style={{ marginBottom: '12px' }}>
                  <div className="card-title" style={{ marginBottom: '4px' }}>{b.business_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
                    <Target size={13} /> {b.category?.name || 'Unknown Category'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <OpportunityBadge level={b.opportunity_level} score={b.opportunity_score} />
                    {b.rating && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        {b.rating.toFixed(1)} ({b.review_count || 0})
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {(b.full_address || b.city?.name) && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <MapPin size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span style={{ lineHeight: 1.4 }}>{b.full_address || `${b.city?.name}, ${b.state?.name}`}</span>
                    </div>
                  )}
                  {b.phone_number && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <Phone size={14} style={{ flexShrink: 0 }} />
                      <span>{b.phone_number}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '0', fontSize: '13px' }}>
                    <Globe size={14} style={{ flexShrink: 0, color: 'var(--text-muted)', marginTop: '1px' }} />
                    <WebsiteBadge status={b.website_status} />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="card-actions" style={{ flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {b.google_maps_url ? (
                    <a href={b.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-icon ripple" title="Open the verified business listing in Google Maps">
                      <MapPin size={14} /> Google Maps
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>Map link unavailable</span>
                  )}
                  {b.website ? (
                    <a href={b.website} target="_blank" rel="noopener noreferrer" className="btn-icon ripple" title="Visit the business's official website">
                      <Globe size={14} /> Official Website
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>No verified website</span>
                  )}
                  <Link href={`/business/${b.id}`} className="btn-icon ripple">
                    <ExternalLink size={14} /> View
                  </Link>
                  {b.crm_lead ? (
                    <Link href={`/crm/leads/${b.crm_lead.id}`} className="btn-icon ripple" style={{ color: 'var(--accent-primary)' }}>
                      <CheckCircle2 size={14} /> In CRM
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleAddToCRM(b.id)}
                      className="btn-icon ripple primary"
                    >
                      <Plus size={14} /> Add to CRM
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {businesses.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Building2 size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <div>No businesses match your current filters.</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting the filters or changing the opportunity level.</div>
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => fetchResults(pg)}
                  className="btn-icon ripple"
                  style={{
                    background: pg === currentPage ? 'var(--accent-primary)' : 'transparent',
                    color: pg === currentPage ? 'white' : 'var(--text-muted)',
                    border: pg === currentPage ? 'none' : '1px solid var(--border-color)',
                    minWidth: '36px',
                  }}
                >
                  {pg}
                </button>
              ))}
            </div>
          )}
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
          font-size: 14px;
        }
        .select-input:focus {
          border-color: var(--accent-primary);
        }
        .select-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </motion.div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginBottom: '6px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};
