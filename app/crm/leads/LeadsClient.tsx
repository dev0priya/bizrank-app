'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, MapPin, Globe, Star, ExternalLink, 
  Filter, ArrowUpDown, Loader2, AlertCircle, TrendingUp,
  DollarSign, Check, ShieldAlert, Calendar
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
    const searchParams = useSearchParams();
    
    // Pagination & Loading
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Multi-Select & Bulk operations
    const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    
    const [bulkAgent, setBulkAgent] = useState('');
    const [bulkStage, setBulkStage] = useState('');
    const [bulkPriority, setBulkPriority] = useState('');
    const [bulkTag, setBulkTag] = useState('');
    const [bulkFollowUpDate, setBulkFollowUpDate] = useState('');
    const [bulkFollowUpSummary, setBulkFollowUpSummary] = useState('');

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

    // Search & Debounce
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Filters
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [hasWebsite, setHasWebsite] = useState('');
    const [minScore, setMinScore] = useState(0);
    const [selectedAssignee, setSelectedAssignee] = useState('');

    // Sorting
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter === 'mine') {
            const myUsername = localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com';
            setSelectedAssignee(myUsername);
        } else if (filter === 'hot') {
            setSelectedPriority('A');
        } else if (filter === 'unassigned') {
            setSelectedAssignee('UNASSIGNED');
        } else if (filter === 'recent') {
            setSortField('createdAt');
            setSortOrder('desc');
        }
    }, [searchParams]);

    // Row Saving States
    const [savingLeadId, setSavingLeadId] = useState<number | null>(null);
    const [savedLeadId, setSavedLeadId] = useState<number | null>(null);

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
            sortOrder,
            minLeadScore: minScore.toString()
        });

        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedStage) params.append('stageId', selectedStage);
        if (selectedPriority) params.append('priority', selectedPriority);
        if (selectedCategory) params.append('categoryId', selectedCategory);
        if (selectedState) params.append('stateId', selectedState);
        if (hasWebsite) params.append('hasWebsite', hasWebsite);
        if (selectedAssignee) params.append('assignedTo', selectedAssignee);

        try {
            const res = await fetch(`/api/crm/leads?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load CRM leads from API.');
            const data = await res.json();
            
            if (data.data) {
                setLeads(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalResults(data.pagination.total);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, selectedStage, selectedPriority, selectedCategory, selectedState, hasWebsite, minScore, selectedAssignee, sortField, sortOrder]);

    useEffect(() => {
        fetchLeads();
        setSelectedLeadIds([]);
    }, [fetchLeads]);

    // Handle Inline PATCH updates
    const handleInlineUpdate = async (leadId: number, field: string, value: any) => {
        setSavingLeadId(leadId);
        try {
            const body: any = {};
            if (field === 'pipelineStageId') body.pipelineStageId = parseInt(value);
            if (field === 'priority') body.priority = value || null;
            if (field === 'assignedTo') body.assignedTo = value || null;
            if (field === 'estimatedValue') body.estimatedValue = parseFloat(value) || 0;

            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to update lead properties');

            // Optimistic / DB response Sync
            setLeads(leads.map(l => {
                if (l.id === leadId) {
                    const updated = { ...l };
                    if (field === 'pipelineStageId') {
                        updated.pipelineStageId = parseInt(value);
                        updated.pipelineStage = stages.find(s => s.id === parseInt(value));
                    }
                    if (field === 'priority') updated.priority = value || null;
                    if (field === 'assignedTo') updated.assignedTo = value || null;
                    if (field === 'estimatedValue') updated.estimatedValue = parseFloat(value) || 0;
                    return updated;
                }
                return l;
            }));

            setSavedLeadId(leadId);
            setTimeout(() => setSavedLeadId(null), 1500);
        } catch (err) {
            console.error(err);
            alert('Failed to update CRM lead property. Verify inputs.');
        } finally {
            setSavingLeadId(null);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const formatCurrency = (val: number | null) => {
        if (!val) return '$0';
        return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const getStageBadgeColor = (stageName: string) => {
        switch (stageName) {
            case 'New': return 'rgba(59, 130, 246, 0.2)'; // Blue
            case 'Contacted': return 'rgba(168, 85, 247, 0.2)'; // Purple
            case 'Meeting Scheduled': return 'rgba(234, 179, 8, 0.2)'; // Yellow
            case 'Proposal Sent': return 'rgba(249, 115, 22, 0.2)'; // Orange
            case 'Closed Won': return 'rgba(34, 197, 94, 0.2)'; // Green
            case 'Closed Lost': return 'rgba(239, 68, 68, 0.2)'; // Red
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={28} className="text-gradient" />
                        <h1 className="text-gradient" style={{ margin: 0 }}>CRM Leads Management</h1>
                    </div>
                    <Link href="/crm/follow-ups" style={{ textDecoration: 'none' }}>
                        <button className="btn-icon primary" style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={13} /> View Follow-ups & Tasks
                        </button>
                    </Link>
                </div>

                <div style={{ position: 'relative', width: '300px', minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search by name, category, phone..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 38px', background: 'rgba(0, 0, 0, 0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '13px' }} 
                    />
                </div>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Manage promoted sales leads, assign deals, schedule callbacks, and log customer activities directly.
            </p>

            {/* DEEP FILTERS PANEL */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
                    <Filter size={18} /> Sales Pipeline Filters
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Pipeline Stage</label>
                        <select className="select-input" value={selectedStage} onChange={e => { setSelectedStage(e.target.value); setPage(1); }}>
                            <option value="">All Stages</option>
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Priority</label>
                        <select className="select-input" value={selectedPriority} onChange={e => { setSelectedPriority(e.target.value); setPage(1); }}>
                            <option value="">All Priorities</option>
                            <option value="A">Priority A (High)</option>
                            <option value="B">Priority B (Med)</option>
                            <option value="C">Priority C (Low)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Category</label>
                        <select className="select-input" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>State</label>
                        <select className="select-input" value={selectedState} onChange={e => { setSelectedState(e.target.value); setPage(1); }}>
                            <option value="">All States</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Website Presence</label>
                        <select className="select-input" value={hasWebsite} onChange={e => { setHasWebsite(e.target.value); setPage(1); }}>
                            <option value="">All Leads</option>
                            <option value="true">Has Website</option>
                            <option value="false">No Website</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Assigned Agent</label>
                        <select className="select-input" value={selectedAssignee} onChange={e => { setSelectedAssignee(e.target.value); setPage(1); }}>
                            <option value="">All Agents</option>
                            <option value="sales.agent@bizrank.com">sales.agent@bizrank.com</option>
                            <option value="sales.manager@bizrank.com">sales.manager@bizrank.com</option>
                            <option value="admin@bizrank.com">admin@bizrank.com</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Min Opp Score: {minScore}</label>
                        <input 
                            type="range" min="0" max="100" step="10"
                            value={minScore} 
                            onChange={e => { setMinScore(parseInt(e.target.value)); setPage(1); }}
                            style={{ width: '100%', cursor: 'pointer', height: '36px' }} 
                        />
                    </div>
                </div>
            </div>

            {/* RESULTS METADATA & SORT INFO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Showing page {page} of {totalPages} (Total: {totalResults} active leads)
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => p - 1)}
                        style={{ padding: '6px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                        Previous
                    </button>
                    <button 
                        disabled={page === totalPages || totalPages === 0 || loading}
                        onClick={() => setPage(p => p + 1)}
                        style={{ padding: '6px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* CRM LEADS DATA TABLE */}
            {error && (
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-lost)', borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
                    <ShieldAlert size={20} />
                    <span>Error loading Leads database: {error}. Please refresh or try again.</span>
                </div>
            )}

            <div className="glass-panel" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease', padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', background: 'rgba(0,0,0,0.15)' }}>
                                <th style={{ width: '40px', padding: '16px 12px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedLeadIds.length === leads.length && leads.length > 0} 
                                        onChange={handleSelectAll} 
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th onClick={() => handleSort('businessName')} style={{ padding: '16px 12px', cursor: 'pointer', userSelect: 'none' }}>
                                    Business Details <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                                </th>
                                <th style={{ padding: '16px 12px' }}>Location</th>
                                <th onClick={() => handleSort('leadScore')} style={{ padding: '16px 12px', cursor: 'pointer', userSelect: 'none' }}>
                                    Score <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                                </th>
                                <th onClick={() => handleSort('priority')} style={{ padding: '16px 12px', cursor: 'pointer', userSelect: 'none' }}>
                                    Priority <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                                </th>
                                <th style={{ padding: '16px 12px' }}>Pipeline Stage</th>
                                <th onClick={() => handleSort('estimatedValue')} style={{ padding: '16px 12px', cursor: 'pointer', userSelect: 'none' }}>
                                    Est. Value ($) <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                                </th>
                                <th style={{ padding: '16px 12px' }}>Next Follow-Up</th>
                                <th style={{ padding: '16px 12px' }}>Assigned To</th>
                                <th style={{ padding: '16px 12px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => {
                                const nextFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[0] : null;

                                return (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedLeadIds.includes(lead.id) ? 'rgba(59,130,246,0.05)' : savingLeadId === lead.id ? 'rgba(59,130,246,0.03)' : undefined }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedLeadIds.includes(lead.id)} 
                                                onChange={() => handleSelectLead(lead.id)} 
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{lead.business.business_name}</div>
                                                {lead.business.website && (
                                                    <a href={lead.business.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }} title="Visit site">
                                                        <Globe size={12} />
                                                    </a>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {lead.business.google_category || lead.business.category?.name || 'No Category'}
                                            </div>
                                        </td>
                                        
                                        <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>
                                            <div>{lead.business.city?.name || 'Unknown City'}</div>
                                            <div style={{ fontSize: '11px', opacity: 0.8 }}>{lead.business.state?.name || '-'}</div>
                                        </td>

                                        <td style={{ padding: '16px 12px' }}>
                                            <span className={`badge ${lead.leadScore >= 70 ? 'badge-priority-c' : lead.leadScore >= 40 ? 'badge-priority-b' : 'badge-priority-a'}`} style={{ fontWeight: 600 }}>
                                                {lead.leadScore}
                                            </span>
                                        </td>

                                        {/* Dynamic Priority Selector */}
                                        <td style={{ padding: '16px 12px' }}>
                                            <select 
                                                value={lead.priority || ''} 
                                                onChange={e => handleInlineUpdate(lead.id, 'priority', e.target.value)}
                                                style={{ padding: '4px 6px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', fontSize: '12px' }}
                                            >
                                                <option value="">Unassigned</option>
                                                <option value="A">A (High)</option>
                                                <option value="B">B (Medium)</option>
                                                <option value="C">C (Low)</option>
                                            </select>
                                        </td>

                                        {/* Dynamic Stage Selector */}
                                        <td style={{ padding: '16px 12px' }}>
                                            <select 
                                                value={lead.pipelineStageId} 
                                                onChange={e => handleInlineUpdate(lead.id, 'pipelineStageId', e.target.value)}
                                                style={{ 
                                                    padding: '4px 6px', 
                                                    background: getStageBadgeColor(lead.pipelineStage?.name), 
                                                    color: 'white', 
                                                    border: '1px solid var(--border-color)', 
                                                    borderRadius: '4px', 
                                                    outline: 'none', 
                                                    fontSize: '12px',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {stages.map(s => (
                                                    <option key={s.id} value={s.id} style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Inline Revenue Value Selector */}
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ position: 'relative', width: '100px' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '6px', top: '7px', color: 'var(--text-muted)' }} />
                                                <input 
                                                    type="number"
                                                    defaultValue={lead.estimatedValue || ''}
                                                    onBlur={e => {
                                                        if (parseFloat(e.target.value) !== lead.estimatedValue) {
                                                            handleInlineUpdate(lead.id, 'estimatedValue', e.target.value);
                                                        }
                                                    }}
                                                    placeholder="0"
                                                    style={{ width: '100%', padding: '4px 6px 4px 18px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', fontSize: '12px' }}
                                                />
                                            </div>
                                        </td>

                                        {/* Next Follow-Up */}
                                        <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>
                                            {nextFollowUp ? (
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                                        {new Date(nextFollowUp.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <div style={{ fontSize: '11px' }}>
                                                        {new Date(nextFollowUp.dueAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '12px', opacity: 0.6 }}>No follow-up</span>
                                            )}
                                        </td>

                                        {/* Dynamic Assignee Selector */}
                                        <td style={{ padding: '16px 12px' }}>
                                            <select 
                                                value={lead.assignedTo || ''} 
                                                onChange={e => handleInlineUpdate(lead.id, 'assignedTo', e.target.value)}
                                                style={{ padding: '4px 6px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', fontSize: '12px', maxWidth: '140px' }}
                                            >
                                                <option value="">Unassigned</option>
                                                <option value="sales.agent@bizrank.com">sales.agent@bizrank.com</option>
                                                <option value="sales.manager@bizrank.com">sales.manager@bizrank.com</option>
                                                <option value="admin@bizrank.com">admin@bizrank.com</option>
                                            </select>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {savingLeadId === lead.id && <Loader2 size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />}
                                                {savedLeadId === lead.id && <Check size={14} style={{ color: 'var(--status-won)' }} />}
                                                
                                                <Link 
                                                    href={`/crm/leads/${lead.id}`} 
                                                    className="btn-icon primary" 
                                                    style={{ padding: '6px 10px', minWidth: 'unset', fontSize: '12px' }}
                                                    title="Open Lead Profile"
                                                >
                                                    <ExternalLink size={14} /> Open
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {leads.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={10} style={{ padding: '48px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <TrendingUp size={24} color="var(--text-muted)" />
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 600 }}>No leads match criteria</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                                {debouncedSearch || selectedStage || selectedPriority || selectedCategory || selectedState || selectedAssignee
                                                    ? "Clear some of your deep filters to find matching pipeline records."
                                                    : "Promote qualified businesses from the discovery staging area to get started."}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {loading && (
                                <tr>
                                    <td colSpan={10} style={{ padding: '40px', textAlign: 'center' }}>
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
