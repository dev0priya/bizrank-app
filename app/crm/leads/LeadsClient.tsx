'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, MapPin, Globe, ExternalLink, 
  Filter, ArrowUpDown, Loader2, AlertCircle, TrendingUp,
  DollarSign, Check, ShieldAlert, Calendar, Phone, Briefcase, User
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LeadsClient({ 
    categories, 
    states, 
    stages 
}: { 
    categories: any[]; 
    states: any[]; 
    stages: any[]; 
}) {
    const [leads, setLeads] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const searchParams = useSearchParams();
    
    // Pagination & Loading
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dynamic Summary metrics
    const [summary, setSummary] = useState<any>({
        totalLeads: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        shared: 0
    });

    // Multi-Select & Bulk operations
    const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    
    const [bulkAgent, setBulkAgent] = useState('');
    const [bulkStage, setBulkStage] = useState('');
    const [bulkPriority, setBulkPriority] = useState('');
    const [bulkTag, setBulkTag] = useState('');
    const [bulkFollowUpDate, setBulkFollowUpDate] = useState('');
    const [bulkFollowUpSummary, setBulkFollowUpSummary] = useState('');

    // Search & Debounce
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // New Filter States
    const [selectedDeveloper, setSelectedDeveloper] = useState('');
    const [selectedWebsiteStatus, setSelectedWebsiteStatus] = useState('');
    const [selectedScoreRange, setSelectedScoreRange] = useState('');
    const [selectedHandoffStatus, setSelectedHandoffStatus] = useState('');
    const [selectedFollowUpStatus, setSelectedFollowUpStatus] = useState('');
    const [selectedAssignedTo, setSelectedAssignedTo] = useState('');

    // Legacy/Extra Filters (to keep support)
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedState, setSelectedState] = useState('');

    // Sorting
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch active users list for Developer dropdown filter
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/crm/users');
                if (res.ok) {
                    const uData = await res.json();
                    setUsers(uData);
                }
            } catch (err) {
                console.error("Failed to load users for filter dropdown", err);
            }
        };
        fetchUsers();
    }, []);

    // Sync search parameters from URL into filter states
    useEffect(() => {
        const paramAssigned = searchParams.get('assignedTo');
        if (paramAssigned !== null) {
            setSelectedAssignedTo(paramAssigned);
            setPage(1);
        } else {
            setSelectedAssignedTo('');
        }

        const paramStage = searchParams.get('stageId');
        if (paramStage !== null) {
            setSelectedStage(paramStage);
            setPage(1);
        }

        const paramPriority = searchParams.get('priority');
        if (paramPriority !== null) {
            setSelectedPriority(paramPriority);
            setPage(1);
        }

        const paramFilter = searchParams.get('filter');
        if (paramFilter === 'hot') {
            setSelectedPriority('A');
            setSelectedScoreRange('high');
            setPage(1);
        } else if (paramFilter === 'new') {
            const newStage = stages.find(s => s.name === 'New');
            if (newStage) {
                setSelectedStage(String(newStage.id));
            } else {
                setSelectedStage('1');
            }
            setPage(1);
        }
    }, [searchParams, stages]);

    const developers = users.filter(u => u.role === 'DEVELOPER');

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLeadIds(leads.map(l => l.id));
        } else {
            setSelectedLeadIds([]);
        }
    };

    const handleSelectLead = (id: number) => {
        if (selectedLeadIds.includes(id)) {
            setSelectedLeadIds(selectedLeadIds.filter(lid => lid !== id));
        } else {
            setSelectedLeadIds([...selectedLeadIds, id]);
        }
    };

    const handleBulkAction = async (action: string, actionPayload: any) => {
        if (selectedLeadIds.length === 0) return;
        setBulkLoading(true);
        try {
            const res = await fetch('/api/crm/leads/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    leadIds: selectedLeadIds,
                    payload: actionPayload
                })
            });
            if (!res.ok) throw new Error('Bulk action failed');
            
            alert(`Successfully updated ${selectedLeadIds.length} leads.`);
            setSelectedLeadIds([]);
            
            // Reset bulk inputs
            setBulkAgent('');
            setBulkStage('');
            setBulkPriority('');
            setBulkTag('');
            setBulkFollowUpDate('');
            setBulkFollowUpSummary('');
            
            fetchLeads();
        } catch (err: any) {
            console.error(err);
            alert(`Error running bulk action: ${err.message}`);
        } finally {
            setBulkLoading(false);
        }
    };

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 400);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch active CRM leads from API
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '15',
            sortField,
            sortOrder
        });

        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedStage) params.append('stageId', selectedStage);
        if (selectedPriority) params.append('priority', selectedPriority);
        if (selectedCategory) params.append('categoryId', selectedCategory);
        if (selectedState) params.append('stateId', selectedState);

        // New Filters
        if (selectedDeveloper) params.append('developerId', selectedDeveloper);
        if (selectedAssignedTo) params.append('assignedTo', selectedAssignedTo);
        if (selectedWebsiteStatus) params.append('websiteStatus', selectedWebsiteStatus);
        if (selectedHandoffStatus) params.append('handoffStatus', selectedHandoffStatus);
        if (selectedFollowUpStatus) params.append('followUpStatus', selectedFollowUpStatus);
        
        // Score Ranges mapping
        if (selectedScoreRange === 'high') {
            params.append('minLeadScore', '70');
        } else if (selectedScoreRange === 'medium') {
            params.append('minLeadScore', '40');
            // Backend will do score >= 40, which includes high, but we'll sort on UI if needed.
        } else if (selectedScoreRange === 'low') {
            params.append('minLeadScore', '0');
        }

        try {
            const res = await fetch(`/api/crm/leads?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load CRM leads from API.');
            const data = await res.json();
            
            if (data.data) {
                // Client-side score ranges filtering for strict bounds if necessary
                let fetchedLeads = data.data;
                if (selectedScoreRange === 'medium') {
                    fetchedLeads = fetchedLeads.filter((l: any) => l.leadScore >= 40 && l.leadScore < 70);
                } else if (selectedScoreRange === 'low') {
                    fetchedLeads = fetchedLeads.filter((l: any) => l.leadScore < 40);
                }

                setLeads(fetchedLeads);
                setTotalPages(data.pagination.totalPages);
                setTotalResults(data.pagination.total);
                if (data.summary) {
                    setSummary(data.summary);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }, [
        page, debouncedSearch, selectedStage, selectedPriority, selectedCategory, 
        selectedState, selectedDeveloper, selectedWebsiteStatus, 
        selectedHandoffStatus, selectedFollowUpStatus, selectedScoreRange, 
        selectedAssignedTo, sortField, sortOrder
    ]);

    useEffect(() => {
        fetchLeads();
        setSelectedLeadIds([]);
    }, [fetchLeads]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const getScoreBadge = (score: number) => {
        if (score >= 70) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{score}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>High</span>
                </div>
            );
        } else if (score >= 40) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{score}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>Medium</span>
                </div>
            );
        } else {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{score}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)', padding: '1px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>Low</span>
                </div>
            );
        }
    };

    const getWebsiteStatusBadge = (status: string) => {
        switch (status) {
            case 'ASSIGNED':
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', 
                        padding: '3px 8px', borderRadius: '12px', fontWeight: 600 
                    }}>
                        Assigned
                    </span>
                );
            case 'IN_PROGRESS':
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', 
                        padding: '3px 8px', borderRadius: '12px', fontWeight: 600 
                    }}>
                        In Progress
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#10b981', 
                        padding: '3px 8px', borderRadius: '12px', fontWeight: 600 
                    }}>
                        Completed
                    </span>
                );
            default:
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', 
                        padding: '3px 8px', borderRadius: '12px', fontWeight: 600 
                    }}>
                        Not Started
                    </span>
                );
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header section */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={28} className="text-gradient" />
                    <h1 style={{ margin: 0, fontSize: '26px' }}>Leads</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    All businesses discovered and added to CRM
                </p>
            </div>

            {/* KPI Cards Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Leads</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)' }}>{summary.totalLeads}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Assigned</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{summary.assigned}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Website In Progress</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{summary.inProgress}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Completed</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{summary.completed}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Shared with Swati</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{summary.shared}</div>
                </div>
            </div>

            {/* Filter Cockpit Panel */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    
                    {/* Search Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Search Lead</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                className="select-input" 
                                placeholder="Business name, phone, location..." 
                                style={{ paddingLeft: '34px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Developer Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Developer</label>
                        <select className="select-input" value={selectedDeveloper} onChange={e => { setSelectedDeveloper(e.target.value); setPage(1); }}>
                            <option value="">All Developers</option>
                            <option value="UNASSIGNED">Unassigned</option>
                            {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    {/* Salesperson Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Assigned Salesperson</label>
                        <select className="select-input" value={selectedAssignedTo} onChange={e => { setSelectedAssignedTo(e.target.value); setPage(1); }}>
                            <option value="">All Team Members</option>
                            <option value="UNASSIGNED">Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.username}>{u.name}</option>)}
                        </select>
                    </div>

                    {/* Website Status Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Website Status</label>
                        <select className="select-input" value={selectedWebsiteStatus} onChange={e => { setSelectedWebsiteStatus(e.target.value); setPage(1); }}>
                            <option value="">All Statuses</option>
                            <option value="ASSIGNED">Assigned / Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    {/* Opportunity Score Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Opportunity Score</label>
                        <select className="select-input" value={selectedScoreRange} onChange={e => { setSelectedScoreRange(e.target.value); setPage(1); }}>
                            <option value="">All Scores</option>
                            <option value="high">High (&gt;= 70)</option>
                            <option value="medium">Medium (40 - 69)</option>
                            <option value="low">Low (&lt; 40)</option>
                        </select>
                    </div>

                    {/* Swati Handoff Status Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Handoff Status</label>
                        <select className="select-input" value={selectedHandoffStatus} onChange={e => { setSelectedHandoffStatus(e.target.value); setPage(1); }}>
                            <option value="">All Handoffs</option>
                            <option value="HANDED_OVER">Shared</option>
                            <option value="PENDING">Not Shared</option>
                        </select>
                    </div>

                    {/* Follow-up Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Follow-up</label>
                        <select className="select-input" value={selectedFollowUpStatus} onChange={e => { setSelectedFollowUpStatus(e.target.value); setPage(1); }}>
                            <option value="">All Follow-ups</option>
                            <option value="true">Has Pending Follow-up</option>
                            <option value="false">No Follow-up</option>
                        </select>
                    </div>

                </div>
            </div>

            {/* Results Metadata Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Showing page <strong>{page}</strong> of {totalPages} (Total: {totalResults} active leads)
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => p - 1)}
                        style={{ padding: '6px 14px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                        Previous
                    </button>
                    <button 
                        disabled={page === totalPages || totalPages === 0 || loading}
                        onClick={() => setPage(p => p + 1)}
                        style={{ padding: '6px 14px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Error alerts */}
            {error && (
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-lost)', borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
                    <ShieldAlert size={20} />
                    <span>Error loading Leads database: {error}. Please refresh or try again.</span>
                </div>
            )}

            {/* Leads Listing Table */}
            <div className="glass-panel" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease', padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.15)' }}>
                                <th style={{ width: '40px', padding: '16px 14px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedLeadIds.length === leads.length && leads.length > 0} 
                                        onChange={handleSelectAll} 
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th onClick={() => handleSort('businessName')} style={{ padding: '16px 14px', cursor: 'pointer', userSelect: 'none' }}>
                                    Business Details <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                                </th>
                                <th onClick={() => handleSort('leadScore')} style={{ padding: '16px 14px', cursor: 'pointer', userSelect: 'none' }}>
                                    Opportunity Score <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                                </th>
                                <th style={{ padding: '16px 14px' }}>Developer</th>
                                <th style={{ padding: '16px 14px' }}>Website Status</th>
                                <th style={{ padding: '16px 14px' }}>Website URL</th>
                                <th style={{ padding: '16px 14px' }}>Handoff Status</th>
                                <th style={{ padding: '16px 14px' }}>Next Follow-up</th>
                                <th style={{ padding: '16px 14px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => {
                                const nextFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[0] : null;
                                const hasPhone = lead.business.phone_number?.trim();

                                return (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedLeadIds.includes(lead.id) ? 'rgba(59,130,246,0.05)' : undefined }}>
                                        {/* Row Checkbox */}
                                        <td style={{ padding: '16px 14px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedLeadIds.includes(lead.id)} 
                                                onChange={() => handleSelectLead(lead.id)} 
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>

                                        {/* Business Details */}
                                        <td style={{ padding: '16px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{lead.business.business_name}</div>
                                                
                                                {/* Maps icon link */}
                                                {lead.business.google_maps_url && (
                                                    <a href={lead.business.google_maps_url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }} title="Google Maps Link">
                                                        <MapPin size={12} className="hover-link" />
                                                    </a>
                                                )}

                                                {/* Existing website icon link */}
                                                {lead.business.website && (
                                                    <a href={lead.business.website} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }} title="Existing Website">
                                                        <Globe size={12} className="hover-link" />
                                                    </a>
                                                )}
                                            </div>
                                            
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div>{lead.business.google_category || lead.business.category?.displayName || lead.business.category?.name || 'No Category'}</div>
                                                <div>{lead.business.city?.name || 'Unknown Location'}{lead.business.state?.name ? `, ${lead.business.state.name}` : ''}</div>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: hasPhone ? 'var(--text-muted)' : 'rgba(255,255,255,0.2)' }}>
                                                    <Phone size={11} />
                                                    <span>{hasPhone ? lead.business.phone_number : 'Not available'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Opportunity Score */}
                                        <td style={{ padding: '16px 14px' }}>
                                            {getScoreBadge(lead.leadScore)}
                                        </td>

                                        {/* Assigned Developer */}
                                        <td style={{ padding: '16px 14px' }}>
                                            {lead.developer ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>
                                                        {lead.developer.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{lead.developer.name}</strong>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                                            )}
                                        </td>

                                        {/* Website Status */}
                                        <td style={{ padding: '16px 14px' }}>
                                            {getWebsiteStatusBadge(lead.websiteStatus)}
                                        </td>

                                        {/* Website URL */}
                                        <td style={{ padding: '16px 14px' }}>
                                            {lead.websiteUrl ? (
                                                <a 
                                                    href={lead.websiteUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    className="hover-link"
                                                >
                                                    Link <ExternalLink size={12} />
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            )}
                                        </td>

                                        {/* Handoff Status */}
                                        <td style={{ padding: '16px 14px' }}>
                                            {lead.handoffStatus === 'HANDED_OVER' ? (
                                                <span style={{ 
                                                    fontSize: '11px', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', 
                                                    padding: '3px 8px', borderRadius: '12px', fontWeight: 600 
                                                }}>
                                                    Shared
                                                </span>
                                            ) : (
                                                <span style={{ 
                                                    fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', 
                                                    padding: '3px 8px', borderRadius: '12px', fontWeight: 600 
                                                }}>
                                                    Not Shared
                                                </span>
                                            )}
                                        </td>

                                        {/* Next Follow-up */}
                                        <td style={{ padding: '16px 14px' }}>
                                            {nextFollowUp ? (
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                                        {new Date(nextFollowUp.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {new Date(nextFollowUp.dueAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No follow-up</span>
                                            )}
                                        </td>

                                        {/* Action: Open */}
                                        <td style={{ padding: '16px 14px', textAlign: 'right' }}>
                                            <Link 
                                                href={`/crm/leads/${lead.id}`} 
                                                className="btn-secondary" 
                                                style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', gap: '4px' }}
                                                title="Open details page"
                                            >
                                                Open <ExternalLink size={11} />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}

                            {leads.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={9} style={{ padding: '48px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <TrendingUp size={24} color="var(--text-muted)" />
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 600 }}>No leads found.</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                                Clear some of your filters or search keywords to find matching pipeline records.
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {loading && (
                                <tr>
                                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                            <Loader2 size={18} className="spin" />
                                            <span>Loading leads records from PostgreSQL...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BULK ACTIONS DRAWER */}
            {selectedLeadIds.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: '1000px',
                    background: 'rgba(30, 41, 59, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    animation: 'slideUp 0.3s ease'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: 'var(--accent-primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                                {selectedLeadIds.length} Selected
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>Bulk Actions Bar</span>
                        </div>
                        <button 
                            onClick={() => setSelectedLeadIds([])} 
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Cancel
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
                        {/* Assign agent */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Assign Agent</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <select className="select-input" value={bulkAgent} onChange={e => setBulkAgent(e.target.value)}>
                                    <option value="">Choose Agent</option>
                                    <option value="sales.agent@bizrank.com">sales.agent@bizrank.com</option>
                                    <option value="sales.manager@bizrank.com">sales.manager@bizrank.com</option>
                                    <option value="admin@bizrank.com">admin@bizrank.com</option>
                                </select>
                                <button disabled={!bulkAgent || bulkLoading} onClick={() => handleBulkAction('assign', { assignedTo: bulkAgent })} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Apply</button>
                            </div>
                        </div>

                        {/* Move stage */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Change Stage</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <select className="select-input" value={bulkStage} onChange={e => setBulkStage(e.target.value)}>
                                    <option value="">Choose Stage</option>
                                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button disabled={!bulkStage || bulkLoading} onClick={() => handleBulkAction('stage', { stageId: parseInt(bulkStage) })} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Apply</button>
                            </div>
                        </div>

                        {/* Change priority */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Set Priority</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <select className="select-input" value={bulkPriority} onChange={e => setBulkPriority(e.target.value)}>
                                    <option value="">Choose Priority</option>
                                    <option value="A">A (High)</option>
                                    <option value="B">B (Medium)</option>
                                    <option value="C">C (Low)</option>
                                </select>
                                <button disabled={!bulkPriority || bulkLoading} onClick={() => handleBulkAction('priority', { priority: bulkPriority })} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Apply</button>
                            </div>
                        </div>

                        {/* Add tag */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Add Tag</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input 
                                    type="text" placeholder="Tag Name" value={bulkTag} onChange={e => setBulkTag(e.target.value)}
                                    className="select-input" style={{ width: '100%' }}
                                />
                                <button disabled={!bulkTag || bulkLoading} onClick={() => handleBulkAction('tag', { name: bulkTag.toUpperCase() })} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Apply</button>
                            </div>
                        </div>

                        {/* Schedule follow-up */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Schedule Bulk Follow-Up</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input 
                                    type="datetime-local" value={bulkFollowUpDate} onChange={e => setBulkFollowUpDate(e.target.value)}
                                    className="select-input" style={{ width: '40%' }}
                                />
                                <input 
                                    type="text" placeholder="Follow-up note" value={bulkFollowUpSummary} onChange={e => setBulkFollowUpSummary(e.target.value)}
                                    className="select-input" style={{ width: '40%' }}
                                />
                                <button disabled={!bulkFollowUpDate || !bulkFollowUpSummary || bulkLoading} onClick={() => handleBulkAction('follow_up', { dueAt: bulkFollowUpDate, summary: bulkFollowUpSummary })} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', width: '20%' }}>Schedule</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                :global(.spin) {
                    animation: spin 1s linear infinite;
                }
                .select-input {
                    width: 100%;
                    padding: 8px 10px;
                    background: rgba(0, 0, 0, 0.2);
                    color: var(--text-main);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    outline: none;
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
}
