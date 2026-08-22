'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, PlayCircle, Loader2, CheckCircle2, MapPin,
  Phone, Globe, Star, BarChart3, Clock, Plus, ExternalLink,
  Target, RotateCcw, ChevronDown, ChevronUp, Filter, AlertCircle,
  TrendingUp, Zap, Building2, Sparkles, ShieldCheck, Layers,
  ArrowRight, X, SlidersHorizontal, Eye
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard } from '../../components/ui/Skeleton';

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

interface JobRecord {
  id: number;
  status: string;
  query: string;
  provider: string;
  progress: number;
  total: number;
  createdAt: string;
  _count?: { businesses: number };
}

interface SearchHistoryRecord {
  id: number;
  locationName: string;
  categoryName?: string;
  provider: string;
  resultCount: number;
  status: string;
  createdAt: string;
}

function OpportunityBadge({ level, score }: { level?: string; score?: number }) {
  const conf: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    HIGH: { label: 'HIGH OPP', color: '#10b981', bg: 'rgba(16,185,129,0.14)', icon: <Zap size={12} /> },
    MEDIUM: { label: 'MEDIUM OPP', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', icon: <TrendingUp size={12} /> },
    LOW: { label: 'LOW OPP', color: '#9ca3af', bg: 'rgba(156,163,175,0.14)', icon: <BarChart3 size={12} /> },
    NOT_TARGET: { label: 'NOT TARGET', color: '#ef4444', bg: 'rgba(239,68,68,0.14)', icon: <AlertCircle size={12} /> },
  };
  const c = conf[level || ''] || conf['LOW'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
      color: c.color, background: c.bg, border: `1px solid ${c.color}35`,
    }}>
      {c.icon} {c.label} {score !== undefined ? `(${score}/100)` : ''}
    </span>
  );
}

function WebsiteBadge({ status }: { status?: string }) {
  const conf: Record<string, { label: string; color: string; bg: string }> = {
    NO_WEBSITE: { label: 'No Verified Website', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    UNKNOWN: { label: 'No Website Detected', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    WEBSITE_FOUND: { label: 'Website Found', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    WEBSITE_VERIFIED: { label: 'Website Verified', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    LOW_QUALITY_WEBSITE: { label: 'Poor Website', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  };
  const c = conf[status || 'UNKNOWN'] || conf['UNKNOWN'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.color}25`
    }}>
      <Globe size={12} /> {c.label}
    </span>
  );
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

  // Location autocomplete & state-specific popular areas
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [popularAreas, setPopularAreas] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [viewAllQuery, setViewAllQuery] = useState('');
  const [viewAllResults, setViewAllResults] = useState<LocationSuggestion[]>([]);
  const locationRef = useRef<HTMLDivElement>(null);
  const locationDebounce = useRef<any>(null);

  // Collapsible Filters
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
  const [resultsLoading, setResultsLoading] = useState<boolean>(false);

  // Jobs & Recent Search lists
  const [discoveryJobs, setDiscoveryJobs] = useState<JobRecord[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryRecord[]>([]);

  // Load master data & initial jobs/history & restore session
  useEffect(() => {
    fetch('/api/master')
      .then(r => r.json())
      .then(data => {
        setCountries(data.countries || []);
        setStates(data.states || []);
        setCategories(data.categories || []);
        
        // Restore session after states and categories are loaded
        const saved = sessionStorage.getItem('bizrank_discovery_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.selectedProvider) setSelectedProvider(parsed.selectedProvider);
            if (parsed.selectedCountry) setSelectedCountry(parsed.selectedCountry);
            if (parsed.selectedState) {
              setSelectedState(parsed.selectedState);
              const stateObj = (data.states || []).find((s: any) => String(s.id) === parsed.selectedState) || null;
              setSelectedStateObj(stateObj);
            }
            if (parsed.selectedLocation) {
              setSelectedLocation(parsed.selectedLocation);
              setLocationQuery(parsed.selectedLocation.displayName);
            }
            if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
            if (parsed.websiteFilter) setWebsiteFilter(parsed.websiteFilter);
            if (parsed.phoneFilter) setPhoneFilter(parsed.phoneFilter);
            if (parsed.opportunityFilter) setOpportunityFilter(parsed.opportunityFilter);
            if (parsed.maxResults) setMaxResults(parsed.maxResults);
            if (parsed.minRating) setMinRating(parsed.minRating);
            if (parsed.maxRating) setMaxRating(parsed.maxRating);
            if (parsed.minReviews) setMinReviews(parsed.minReviews);
            if (parsed.maxReviews) setMaxReviews(parsed.maxReviews);
          } catch (e) {
            console.error("Failed to parse saved discovery session", e);
          }
        } else {
          const india = (data.countries || []).find((c: any) => c.name === 'India');
          if (india) setSelectedCountry(String(india.id));
        }
      })
      .catch(console.error);

    loadJobsAndHistory();
  }, []);

  // Save session when relevant states change
  useEffect(() => {
    const sessionData = {
      selectedProvider,
      selectedCountry,
      selectedState,
      selectedLocation,
      selectedCategory,
      websiteFilter,
      phoneFilter,
      opportunityFilter,
      maxResults,
      minRating,
      maxRating,
      minReviews,
      maxReviews
    };
    sessionStorage.setItem('bizrank_discovery_session', JSON.stringify(sessionData));
  }, [
    selectedProvider, selectedCountry, selectedState, selectedLocation,
    selectedCategory, websiteFilter, phoneFilter, opportunityFilter,
    maxResults, minRating, maxRating, minReviews, maxReviews
  ]);

  const loadJobsAndHistory = () => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(jobs => { if (Array.isArray(jobs)) setDiscoveryJobs(jobs); })
      .catch(console.error);

    fetch('/api/discovery/history')
      .then(r => r.json())
      .then(history => { if (Array.isArray(history)) setSearchHistory(history); })
      .catch(console.error);
  };

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

  // Fetch dynamic Popular Areas whenever State changes
  useEffect(() => {
    if (!selectedState) {
      setPopularAreas([]);
      return;
    }
    setPopularLoading(true);
    fetch(`/api/locations/search?stateId=${selectedState}&limit=12`)
      .then(r => r.json())
      .then(res => {
        if (Array.isArray(res.data)) {
          setPopularAreas(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setPopularLoading(false));
  }, [selectedState]);

  // Location autocomplete — state-scoped
  const handleLocationInput = useCallback((q: string) => {
    setLocationQuery(q);
    setSelectedLocation(null);

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
    if (showViewAllModal) setShowViewAllModal(false);
  };

  const handleOpenViewAllModal = () => {
    if (!selectedState) {
      alert('Please select a State first.');
      return;
    }
    setShowViewAllModal(true);
    handleViewAllSearch('');
  };

  const handleViewAllSearch = async (query: string) => {
    setViewAllQuery(query);
    try {
      const url = query.trim()
        ? `/api/locations/search?q=${encodeURIComponent(query)}&stateId=${selectedState}&limit=20`
        : `/api/locations/search?stateId=${selectedState}&limit=20`;
      const res = await fetch(url);
      const data = await res.json();
      setViewAllResults(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSearch = () => {
    setJobId(null);
    setJobStatus('');
    setBusinesses([]);
    setTotalResults(0);
    setCurrentPage(1);
    setSelectedLocation(null);
    setLocationQuery('');
    setSelectedCategory('');
  };

  const handleStartSearch = async () => {
    if (!selectedState) {
      alert('Please select a State / Union Territory first.');
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
      loadJobsAndHistory();
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

  // Poll job status until completed
  useEffect(() => {
    if (!jobId || jobStatus === 'Completed' || jobStatus === 'Failed') return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      setJobStatus(data.status);
      setProgress(data.progress || 0);
      if (data.status === 'Completed') {
        clearInterval(interval);
        fetchResults(jobId, 1);
        loadJobsAndHistory();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const fetchResults = async (targetJobId: number, page: number) => {
    setResultsLoading(true);
    const params = new URLSearchParams({
      jobId: String(targetJobId),
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

    try {
      const res = await fetch(`/api/businesses?${params.toString()}`);
      const data = await res.json();
      if (data.data) {
        setBusinesses(data.data);
        setTotalResults(data.pagination?.total || 0);
        setCurrentPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleSelectJobResults = (targetJobId: number) => {
    setJobId(targetJobId);
    setJobStatus('Completed');
    fetchResults(targetJobId, 1);
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

  // Compute active step index: 1 (Location) -> 2 (Category) -> 3 (Filters) -> 4 (Results)
  let activeStep = 1;
  if (selectedState && selectedCategory) activeStep = 2;
  if (showFilters || (selectedState && selectedCategory && maxResults)) activeStep = 3;
  if (jobStatus === 'Completed' || businesses.length > 0) activeStep = 4;

  return (
    <div style={{ padding: '24px 32px', background: '#0b0f17', minHeight: '100vh', color: '#f3f4f6' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={26} color="#3b82f6" /> Business Discovery
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>
            Find real businesses with high website-development & online sales potential
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#9ca3af',
              background: '#161e2e', border: '1px solid #1f293d', cursor: 'pointer'
            }}
          >
            <ShieldCheck size={16} /> How It Works
          </button>
          <button
            onClick={handleResetSearch}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#ffffff',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
            }}
          >
            <RotateCcw size={15} /> New Search
          </button>
        </div>
      </div>

      {/* TWO COLUMN RESPONSIVE LAYOUT */}
      <div className="discovery-layout-grid" style={{ gap: '24px' }}>
        
        {/* LEFT COLUMN: SEARCH CARD, POPULAR AREAS, JOBS & RESULTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MAIN DISCOVERY SEARCH CARD */}
          <div style={{
            background: '#111827', border: '1px solid #1f293d', borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            
            {/* STEP INDICATOR HEADER */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              background: '#0d131f', borderBottom: '1px solid #1f293d', padding: '16px 20px'
            }}>
              {[
                { num: 1, label: 'Location' },
                { num: 2, label: 'Category' },
                { num: 3, label: 'Filters' },
                { num: 4, label: 'Results' }
              ].map(step => {
                const isActive = activeStep === step.num;
                const isDone = activeStep > step.num;
                return (
                  <div key={step.num} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    opacity: isActive || isDone ? 1 : 0.4, transition: 'all 0.2s'
                  }}>
                    <span style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 800,
                      background: isDone ? '#10b981' : (isActive ? '#2563eb' : '#1f293d'),
                      color: '#ffffff', boxShadow: isActive ? '0 0 12px rgba(37,99,235,0.6)' : 'none'
                    }}>
                      {isDone ? <CheckCircle2 size={14} /> : step.num}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? '#3b82f6' : '#d1d5db' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* MAIN SEARCH CONTROLS GRID */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                
                {/* 1. COUNTRY */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px' }}>
                    Country
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedCountry}
                      onChange={e => setSelectedCountry(e.target.value)}
                      style={{
                        width: '100%', height: '46px', padding: '0 14px', borderRadius: '10px',
                        background: '#162032', border: '1px solid #283754', color: '#ffffff',
                        fontSize: '14px', fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer'
                      }}
                    >
                      {countries.map(c => (
                        <option key={c.id} value={c.id}>🇮🇳 {c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#6b7280" style={{ position: 'absolute', right: '14px', top: '15px', pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* 2. STATE / UT */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px' }}>
                    State / Union Territory *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedState}
                      onChange={e => handleStateChange(e.target.value)}
                      style={{
                        width: '100%', height: '46px', padding: '0 14px', borderRadius: '10px',
                        background: selectedState ? '#162032' : '#141c2c',
                        border: selectedState ? '1px solid #3b82f6' : '1px solid #283754',
                        color: '#ffffff', fontSize: '14px', fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="">Select State / UT...</option>
                      <optgroup label="States (28)">
                        {states.filter(s => s.type === 'STATE').map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Union Territories (8)">
                        {states.filter(s => s.type === 'UNION_TERRITORY').map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown size={16} color="#6b7280" style={{ position: 'absolute', right: '14px', top: '15px', pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* 3. CITY / AREA (AUTOCOMPLETE) */}
                <div ref={locationRef} style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px' }}>
                    City / Area
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder={selectedState ? "Search city or area..." : "Select State first"}
                      disabled={!selectedState}
                      value={locationQuery}
                      onChange={e => handleLocationInput(e.target.value)}
                      onFocus={() => { if (locationSuggestions.length > 0) setShowSuggestions(true); }}
                      style={{
                        width: '100%', height: '46px', padding: '0 36px 0 14px', borderRadius: '10px',
                        background: selectedLocation ? '#162032' : '#141c2c',
                        border: selectedLocation ? '1px solid #3b82f6' : '1px solid #283754',
                        color: '#ffffff', fontSize: '14px', fontWeight: 500, outline: 'none'
                      }}
                    />
                    {locationLoading ? (
                      <Loader2 size={16} color="#3b82f6" className="animate-spin" style={{ position: 'absolute', right: '12px', top: '15px' }} />
                    ) : (
                      <MapPin size={16} color={selectedLocation ? "#3b82f6" : "#6b7280"} style={{ position: 'absolute', right: '12px', top: '15px' }} />
                    )}
                  </div>

                  {/* AUTOCOMPLETE DROPDOWN */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                      background: '#162032', border: '1px solid #283754', borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100, maxHeight: '240px', overflowY: 'auto'
                    }}>
                      {locationSuggestions.map(loc => (
                        <div
                          key={loc.id}
                          onClick={() => handleLocationSelect(loc)}
                          style={{
                            padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1f293d',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: selectedLocation?.id === loc.id ? 'rgba(59,130,246,0.15)' : 'transparent'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{loc.name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{loc.displayName}</div>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#1f293d', color: '#9ca3af' }}>
                            {loc.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. BUSINESS CATEGORY */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px' }}>
                    Business Category *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      style={{
                        width: '100%', height: '46px', padding: '0 14px', borderRadius: '10px',
                        background: selectedCategory ? '#162032' : '#141c2c',
                        border: selectedCategory ? '1px solid #3b82f6' : '1px solid #283754',
                        color: '#ffffff', fontSize: '14px', fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="">Select Category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#6b7280" style={{ position: 'absolute', right: '14px', top: '15px', pointerEvents: 'none' }} />
                  </div>
                </div>

              </div>

              {/* COLLAPSIBLE ADVANCED FILTERS */}
              <div style={{ borderTop: '1px solid #1f293d', paddingTop: '16px', marginTop: '16px' }}>
                {/* Provider Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1f293d' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>Business Data Provider</span>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                      <input type="radio" name="provider" value="apify" checked={selectedProvider === 'apify'} onChange={e => setSelectedProvider(e.target.value)} style={{ accentColor: '#3b82f6' }} />
                      <span>Apify (Default)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                      <input type="radio" name="provider" value="google_places" checked={selectedProvider === 'google_places'} onChange={e => setSelectedProvider(e.target.value)} style={{ accentColor: '#3b82f6' }} />
                      <span>Google Places</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                      <input type="radio" name="provider" value="mock" checked={selectedProvider === 'mock'} onChange={e => setSelectedProvider(e.target.value)} style={{ accentColor: '#3b82f6' }} />
                      <span>Mock Provider</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    <SlidersHorizontal size={14} />
                    {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                    {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    onClick={handleStartSearch}
                    disabled={jobStatus === 'Running'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px',
                      borderRadius: '10px', fontSize: '14px', fontWeight: 700, color: '#ffffff',
                      background: jobStatus === 'Running' ? '#374151' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none', cursor: jobStatus === 'Running' ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 16px rgba(37,99,235,0.35)'
                    }}
                  >
                    {jobStatus === 'Running' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Searching Businesses...
                      </>
                    ) : (
                      <>
                        <Search size={16} /> Search Businesses
                      </>
                    )}
                  </button>
                </div>

                {showFilters && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px', padding: '16px', background: '#0d131f', borderRadius: '12px', border: '1px solid #1f293d' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Website Filter</label>
                      <select value={websiteFilter} onChange={e => setWebsiteFilter(e.target.value)} style={{ width: '100%', height: '38px', marginTop: '6px', background: '#162032', border: '1px solid #283754', color: '#fff', borderRadius: '8px', fontSize: '13px', padding: '0 10px' }}>
                        <option value="all">All Businesses</option>
                        <option value="NO_WEBSITE">No Verified Website Only</option>
                        <option value="LOW_QUALITY_WEBSITE">Low Quality Website Only</option>
                        <option value="WEBSITE_VERIFIED">Website Verified</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Opportunity Level</label>
                      <select value={opportunityFilter} onChange={e => setOpportunityFilter(e.target.value)} style={{ width: '100%', height: '38px', marginTop: '6px', background: '#162032', border: '1px solid #283754', color: '#fff', borderRadius: '8px', fontSize: '13px', padding: '0 10px' }}>
                        <option value="all">All Levels</option>
                        <option value="HIGH">High Opportunity Only</option>
                        <option value="MEDIUM">Medium Opportunity</option>
                        <option value="LOW">Low Opportunity</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Phone Availability</label>
                      <select value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)} style={{ width: '100%', height: '38px', marginTop: '6px', background: '#162032', border: '1px solid #283754', color: '#fff', borderRadius: '8px', fontSize: '13px', padding: '0 10px' }}>
                        <option value="all">All</option>
                        <option value="available">With Phone Number Only</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Max Results</label>
                      <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} style={{ width: '100%', height: '38px', marginTop: '6px', background: '#162032', border: '1px solid #283754', color: '#fff', borderRadius: '8px', fontSize: '13px', padding: '0 10px' }}>
                        <option value={10}>10 Businesses</option>
                        <option value={20}>20 Businesses</option>
                        <option value={50}>50 Businesses</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* DYNAMIC POPULAR AREAS CARD */}
          {selectedState && (
            <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#3b82f6" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Popular Areas in {selectedStateObj?.name || 'Selected State'}
                  </h3>
                </div>
                <button
                  onClick={handleOpenViewAllModal}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              </div>

              {popularLoading ? (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ width: '100px', height: '36px', background: '#1f293d', borderRadius: '8px' }} />
                  ))}
                </div>
              ) : popularAreas.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {popularAreas.map(area => (
                    <button
                      key={area.id}
                      onClick={() => handleLocationSelect(area)}
                      style={{
                        padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        background: selectedLocation?.id === area.id ? '#2563eb' : '#162032',
                        color: selectedLocation?.id === area.id ? '#ffffff' : '#d1d5db',
                        border: selectedLocation?.id === area.id ? '1px solid #3b82f6' : '1px solid #283754',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No predefined popular areas found. Use the City/Area search box above.</p>
              )}
            </div>
          )}

          {/* RUNNING JOB STATUS BANNER */}
          {jobStatus === 'Running' && (
            <div style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid #2563eb40', borderRadius: '14px', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Loader2 size={24} color="#3b82f6" className="animate-spin" />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Scraper Running via Apify Provider</h4>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                    Job #{jobId} · Scraped real Google Maps listings in progress ({elapsedTime}s elapsed)
                  </p>
                </div>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: '999px', background: '#2563eb25', border: '1px solid #2563eb60', color: '#60a5fa', fontSize: '12px', fontWeight: 800 }}>
                RUNNING
              </span>
            </div>
          )}

          {/* STEP 4: BUSINESS RESULTS SECTION */}
          {businesses.length > 0 && (
            <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Discovered Business Opportunities ({totalResults})
                  </h3>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                    Showing page {currentPage} of {totalPages}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {businesses.map(biz => (
                  <div
                    key={biz.id}
                    style={{
                      background: '#162032', border: '1px solid #283754', borderRadius: '12px',
                      padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{biz.business_name}</h4>
                        <OpportunityBadge level={biz.opportunity_level} score={biz.opportunity_score} />
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#9ca3af' }}>
                        {biz.category && <span>📁 {biz.category.name}</span>}
                        {biz.full_address && <span>📍 {biz.full_address}</span>}
                        {biz.phone_number && <span>📞 {biz.phone_number}</span>}
                        {biz.rating && <span>⭐ {biz.rating} ({biz.review_count || 0} reviews)</span>}
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <WebsiteBadge status={biz.website_status} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                      {biz.google_maps_url ? (
                        <a
                          href={biz.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            background: '#1f293d', color: '#60a5fa', textDecoration: 'none', border: '1px solid #283754'
                          }}
                        >
                          <MapPin size={14} /> Google Maps <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>No Maps Link</span>
                      )}

                      {biz.website ? (
                        <a
                          href={biz.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            background: '#1f293d', color: '#34d399', textDecoration: 'none', border: '1px solid #283754'
                          }}
                        >
                          <Globe size={14} /> Official Website <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '6px', borderRadius: '6px' }}>
                          No verified website
                        </span>
                      )}

                      {biz.crm_lead ? (
                        <span style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#10b981', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
                          ✓ In CRM
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToCRM(biz.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer'
                          }}
                        >
                          <Plus size={14} /> Add to CRM
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DISCOVERY JOBS CARD */}
          <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Layers size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Discovery Jobs</h3>
            </div>

            {discoveryJobs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {discoveryJobs.slice(0, 5).map(j => (
                  <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#162032', border: '1px solid #283754', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        Job #{j.id} · {j.query}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        Provider: {j.provider} · Found {j._count?.businesses ?? j.total ?? 0} businesses
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectJobResults(j.id)}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: '#1f293d', color: '#60a5fa', border: '1px solid #283754', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View Results
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No active or past discovery jobs found.</p>
            )}
          </div>

          {/* RECENT SEARCHES CARD */}
          <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Clock size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Recent Searches</h3>
            </div>

            {searchHistory.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1f293d', color: '#9ca3af', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Location</th>
                      <th style={{ padding: '10px' }}>Category</th>
                      <th style={{ padding: '10px' }}>Provider</th>
                      <th style={{ padding: '10px' }}>Results</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchHistory.slice(0, 5).map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #162032', color: '#d1d5db' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{h.locationName}</td>
                        <td style={{ padding: '10px' }}>{h.categoryName || 'General'}</td>
                        <td style={{ padding: '10px' }}>{h.provider}</td>
                        <td style={{ padding: '10px' }}>{h.resultCount}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No recent search history logged yet.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: INFORMATION CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CARD 1: HOW BUSINESS DISCOVERY WORKS */}
          <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#3b82f6" /> How Business Discovery Works
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { num: 1, title: 'Select Location', desc: 'Choose Country, State/UT, City/Area to focus on the right target market.' },
                { num: 2, title: 'Choose Category', desc: 'Select the business niche (Salons, Gyms, Clinics, Restaurants, etc.).' },
                { num: 3, title: 'Apply Filters', desc: 'Set opportunity filters to isolate high-potential website development leads.' },
                { num: 4, title: 'Get Results', desc: 'We scrape real live businesses and output qualified website opportunities.' }
              ].map(step => (
                <div key={step.num} style={{ display: 'flex', gap: '12px' }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb',
                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800, flexShrink: 0
                  }}>
                    {step.num}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{step.title}</h4>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '3px 0 0 0', lineHeight: 1.4 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: WE USE REAL DATA FROM */}
          <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#10b981" /> We Use Real Data From
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '10px 14px', background: '#162032', border: '1px solid #283754', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌐 Google Maps / Places
              </div>
              <div style={{ padding: '10px 14px', background: '#162032', border: '1px solid #283754', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤖 Apify Google Maps Scraper
              </div>
              <div style={{ padding: '10px 14px', background: '#162032', border: '1px solid #283754', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🗺️ Google Business Profile Data
              </div>
              <div style={{ padding: '10px 14px', background: '#162032', border: '1px solid #283754', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ Verified Website Audits
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', margin: 0, padding: '10px', background: '#0d131f', borderRadius: '8px', border: '1px dashed #283754' }}>
              "We never show fake or random businesses. Only real, verified live business data."
            </p>
          </div>

        </div>

      </div>

      {/* VIEW ALL LOCATIONS SEARCH MODAL */}
      {showViewAllModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '560px', background: '#111827', border: '1px solid #1f293d', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Select Location in {selectedStateObj?.name}
              </h3>
              <button onClick={() => setShowViewAllModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Search cities, areas, localities..."
              value={viewAllQuery}
              onChange={e => handleViewAllSearch(e.target.value)}
              style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '10px', background: '#162032', border: '1px solid #283754', color: '#fff', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
            />

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {viewAllResults.map(loc => (
                <div
                  key={loc.id}
                  onClick={() => { handleLocationSelect(loc); setShowViewAllModal(false); }}
                  style={{ padding: '12px', background: '#162032', borderRadius: '8px', cursor: 'pointer', border: '1px solid #283754', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{loc.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{loc.displayName}</div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#1f293d', color: '#60a5fa' }}>{loc.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
