'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Search, MapPin, Star, PhoneCall, MessageCircle, 
  Mail, Calendar, DollarSign, Clock, TrendingUp, AlertCircle, 
  Filter, User, ExternalLink, Loader2, ArrowRight
} from 'lucide-react';

interface PipelineStage {
    id: number;
    name: string;
    order: number;
    pipelineId: number;
}

interface CRMLead {
    id: number;
    businessId: number;
    pipelineStageId: number;
    priority: string | null;
    estimatedValue: number;
    assignedTo: string | null;
    leadScore: number;
    updatedAt: Date;
    business: {
        id: number;
        business_name: string;
        phone_number: string | null;
        email: string | null;
        google_category: string | null;
        rating: number | null;
        review_count: number | null;
        city: { name: string } | null;
        state: { name: string } | null;
        category: { name: string } | null;
    };
    pipelineStage: PipelineStage;
    followUps: Array<{
        id: number;
        dueAt: Date;
        status: string;
    }>;
}

interface PipelineClientProps {
    categories: any[];
    states: any[];
    stages: PipelineStage[];
    initialLeads: CRMLead[];
    metrics: {
        totalLeads: number;
        openPipeline: number;
        wonPipeline: number;
    };
}

export default function PipelineClient({
    categories,
    states,
    stages,
    initialLeads,
    metrics
}: PipelineClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local copy of leads for optimistic UI updates
    const [leads, setLeads] = useState<CRMLead[]>(initialLeads);
    const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);
    const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);
    const [savingLeadId, setSavingLeadId] = useState<number | null>(null);

    // Filter controls
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [priority, setPriority] = useState(searchParams.get('priority') || '');
    const [minScore, setMinScore] = useState(searchParams.get('leadScore') || '');
    const [assignedTo, setAssignedTo] = useState(searchParams.get('assignedTo') || '');
    const [stateId, setStateId] = useState(searchParams.get('stateId') || '');
    const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');

    // Mobile state: active visible stage column
    const [mobileActiveStageId, setMobileActiveStageId] = useState<number>(stages[0]?.id || 0);

    // Follow-up scheduling modal state
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [followUpForm, setFollowUpForm] = useState({
        contactId: '',
        date: '',
        time: '10:00',
        assignedTo: 'Admin',
        reminderMinutes: 'None'
    });
    const [savingFollowUp, setSavingFollowUp] = useState(false);

    // Sync leads state when initialLeads server props change
    useEffect(() => {
        setLeads(initialLeads);
    }, [initialLeads]);

    // Push filter parameters to Next.js router
    const triggerSearch = useCallback(() => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set('search', searchTerm);
        if (priority) params.set('priority', priority);
        if (minScore) params.set('leadScore', minScore);
        if (assignedTo) params.set('assignedTo', assignedTo);
        if (stateId) params.set('stateId', stateId);
        if (categoryId) params.set('categoryId', categoryId);

        router.push(`${pathname}?${params.toString()}`);
    }, [searchTerm, priority, minScore, assignedTo, stateId, categoryId, router, pathname]);

    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setPriority('');
        setMinScore('');
        setAssignedTo('');
        setStateId('');
        setCategoryId('');
        router.push(pathname);
    };

    // Native Drag and Drop mechanics
    const handleDragStart = (e: React.DragEvent, leadId: number, sourceStageId: number) => {
        setDraggingLeadId(leadId);
        e.dataTransfer.setData('text/plain', leadId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, stageId: number) => {
        e.preventDefault();
        setDragOverStageId(stageId);
    };

    const handleDrop = async (e: React.DragEvent, destStageId: number) => {
        e.preventDefault();
        setDragOverStageId(null);

        const leadIdStr = e.dataTransfer.getData('text/plain');
        const leadId = parseInt(leadIdStr);
        if (isNaN(leadId) || savingLeadId !== null) return;

        const targetLead = leads.find(l => l.id === leadId);
        if (!targetLead || targetLead.pipelineStageId === destStageId) return;

        const originalStageId = targetLead.pipelineStageId;

        // 1. Optimistic Update in State
        setLeads(prev => prev.map(l => {
            if (l.id === leadId) {
                return { ...l, pipelineStageId: destStageId };
            }
            return l;
        }));

        setSavingLeadId(leadId);

        // 2. PATCH request to update stage database-side
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pipelineStageId: destStageId })
            });

            if (!res.ok) {
                throw new Error('Failed to update stage in PostgreSQL database.');
            }

            // Successfully updated: refresh server data to sync top metrics
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Stage modification failed. Rolling back changes.');
            // 3. Rollback safety on failure
            setLeads(prev => prev.map(l => {
                if (l.id === leadId) {
                    return { ...l, pipelineStageId: originalStageId };
                }
                return l;
            }));
        } finally {
            setSavingLeadId(null);
            setDraggingLeadId(null);
        }
    };

    // Inline dropdown select stage update (Mobile & Accessibility fallback)
    const handleSelectStage = async (leadId: number, destStageId: number) => {
        if (savingLeadId !== null) return;
        const targetLead = leads.find(l => l.id === leadId);
        if (!targetLead || targetLead.pipelineStageId === destStageId) return;

        const originalStageId = targetLead.pipelineStageId;

        // Optimistic update
        setLeads(prev => prev.map(l => {
            if (l.id === leadId) {
                return { ...l, pipelineStageId: destStageId };
            }
            return l;
        }));

        setSavingLeadId(leadId);

        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pipelineStageId: destStageId })
            });

            if (!res.ok) throw new Error('Stage change rejected by database.');
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Operation failed. Restoring original stage.');
            setLeads(prev => prev.map(l => {
                if (l.id === leadId) {
                    return { ...l, pipelineStageId: originalStageId };
                }
                return l;
            }));
        } finally {
            setSavingLeadId(null);
        }
    };

    // Open schedule modal and query contacts dynamically
    const handleOpenScheduleModal = async (leadId: number) => {
        setSelectedLeadId(leadId);
        setLoadingContacts(true);
        setShowFollowUpModal(true);
        setFollowUpForm({
            contactId: '',
            date: '',
            time: '10:00',
            assignedTo: 'Admin',
            reminderMinutes: 'None'
        });

        try {
            const res = await fetch(`/api/crm/leads/${leadId}/contacts`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
                const primary = data.find((c: any) => c.isPrimary);
                if (primary) {
                    setFollowUpForm(f => ({ ...f, contactId: primary.id.toString() }));
                } else if (data.length > 0) {
                    setFollowUpForm(f => ({ ...f, contactId: data[0].id.toString() }));
                }
            }
        } catch (e) {
            console.error('Failed to load contacts for lead scheduler:', e);
        } finally {
            setLoadingContacts(false);
        }
    };

    // Save scheduled follow-up
    const handleSaveFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeadId || !followUpForm.date) return;

        setSavingFollowUp(true);
        try {
            const dueAt = `${followUpForm.date}T${followUpForm.time}:00`;
            let reminderAt = null;
            if (followUpForm.reminderMinutes !== 'None') {
                const minutes = parseInt(followUpForm.reminderMinutes);
                if (!isNaN(minutes)) {
                    reminderAt = new Date(new Date(dueAt).getTime() - minutes * 60 * 1000).toISOString();
                }
            }

            const res = await fetch(`/api/crm/leads/${selectedLeadId}/follow-ups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: followUpForm.contactId ? parseInt(followUpForm.contactId) : null,
                    assignedTo: followUpForm.assignedTo,
                    dueAt,
                    reminderAt
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to save follow-up alert.');
            }

            setShowFollowUpModal(false);
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Failed to schedule follow-up');
        } finally {
            setSavingFollowUp(false);
        }
    };

    // Grouping helper by stage id
    const getLeadsByStage = (stageId: number) => {
        return leads.filter(l => l.pipelineStageId === stageId);
    };

    // Stage value helper
    const getStageValue = (stageId: number) => {
        return leads
            .filter(l => l.pipelineStageId === stageId)
            .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    };

    // Clean Indian Rupee Currency Formatter
    const formatRupees = (val: number | null) => {
        if (!val) return '₹0';
        return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* PIPELINE HEADER & METRICS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                <div>
                    <h1 className="text-gradient" style={{ margin: 0, marginBottom: '4px' }}>Sales Pipeline Board</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                        Visually manage stages, track deal volumes, and shift leads dynamically across columns.
                    </p>
                </div>

                {/* Glassmorphic Metrics Card */}
                <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 24px', flexWrap: 'wrap' }}>
                    <div style={{ paddingRight: '20px', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Leads</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{metrics.totalLeads}</div>
                    </div>
                    <div style={{ paddingRight: '20px', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Open Pipeline</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatRupees(metrics.openPipeline)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Closed Won</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-won)' }}>{formatRupees(metrics.wonPipeline)}</div>
                    </div>
                </div>
            </div>

            {/* FILTERS TOOLBAR */}
            <div className="glass-panel" style={{ marginBottom: '24px', padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
                    
                    {/* Search */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Search Leads</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                            <input 
                                type="text"
                                className="select-input"
                                placeholder="Business name, contact..."
                                style={{ paddingLeft: '28px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && triggerSearch()}
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Priority</label>
                        <select className="select-input" value={priority} onChange={e => setPriority(e.target.value)}>
                            <option value="">All Priorities</option>
                            <option value="A">Priority A (High)</option>
                            <option value="B">Priority B (Medium)</option>
                            <option value="C">Priority C (Low)</option>
                        </select>
                    </div>

                    {/* Lead Score */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Min Score</label>
                        <select className="select-input" value={minScore} onChange={e => setMinScore(e.target.value)}>
                            <option value="">All Scores</option>
                            <option value="90">90+ Hot Leads</option>
                            <option value="75">75+ Warm Leads</option>
                            <option value="50">50+ Moderate</option>
                        </select>
                    </div>

                    {/* State */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>State</label>
                        <select className="select-input" value={stateId} onChange={e => setStateId(e.target.value)}>
                            <option value="">All Locations</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Category</label>
                        <select className="select-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Agent</label>
                        <select className="select-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                            <option value="">All Agents</option>
                            <option value="sales.agent@bizrank.com">sales.agent@bizrank.com</option>
                            <option value="sales.manager@bizrank.com">sales.manager@bizrank.com</option>
                            <option value="admin@bizrank.com">admin@bizrank.com</option>
                        </select>
                    </div>

                    {/* Filter buttons */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={handleClearFilters} className="btn-icon" style={{ padding: '8px 12px', fontSize: '12px' }}>
                            Reset
                        </button>
                        <button onClick={triggerSearch} className="btn-icon primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE LAYOUT STAGE TABS SELECTOR */}
            <div className="mobile-only" style={{ display: 'none', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', overflowX: 'auto', whiteSpace: 'nowrap', gap: '12px', paddingBottom: '8px' }}>
                {stages.map(stage => {
                    const isActive = mobileActiveStageId === stage.id;
                    const leadsCount = getLeadsByStage(stage.id).length;
                    return (
                        <button
                            key={stage.id}
                            onClick={() => setMobileActiveStageId(stage.id)}
                            style={{
                                background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                                color: isActive ? '#000' : 'var(--text-muted)',
                                border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {stage.name} ({leadsCount})
                        </button>
                    );
                })}
            </div>

            {/* PIPELINE KANBAN BOARD VIEW */}
            <div className="pipeline-board-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'stretch', minHeight: '65vh' }}>
                
                {stages.map(stage => {
                    const stageLeads = getLeadsByStage(stage.id);
                    const stageTotalValue = getStageValue(stage.id);
                    const isClosedWon = stage.name === 'Closed Won';
                    const isClosedLost = stage.name === 'Closed Lost';
                    const isDraggedOver = dragOverStageId === stage.id;

                    return (
                        <div 
                            key={stage.id}
                            onDragOver={(e) => handleDragOver(e, stage.id)}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            className={`pipeline-stage-column ${isClosedWon ? 'stage-won' : ''} ${isClosedLost ? 'stage-lost' : ''} ${isDraggedOver ? 'stage-drag-over' : ''} ${mobileActiveStageId === stage.id ? 'mobile-visible' : 'mobile-hidden'}`}
                            style={{
                                flex: '0 0 310px',
                                minWidth: '310px',
                                background: isClosedWon ? 'rgba(34,197,94,0.02)' : isClosedLost ? 'rgba(239,68,68,0.02)' : 'rgba(0,0,0,0.15)',
                                border: isDraggedOver
                                    ? '1px dashed var(--accent-primary)' 
                                    : isClosedWon 
                                        ? '1px solid rgba(34,197,94,0.15)' 
                                        : isClosedLost 
                                            ? '1px solid rgba(239,68,68,0.15)' 
                                            : '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}
                        >
                            {/* Column Header Info */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                <div>
                                    <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, color: isClosedWon ? 'var(--status-won)' : isClosedLost ? 'var(--status-lost)' : '#fff' }}>
                                        {stage.name}
                                    </h3>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {stageLeads.length} leads
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: isClosedWon ? 'var(--status-won)' : 'var(--text-muted)' }}>
                                    {formatRupees(stageTotalValue)}
                                </div>
                            </div>

                            {/* Cards List container */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', minHeight: '150px' }}>
                                {stageLeads.map(lead => {
                                    const nextFollowUp = lead.followUps?.[0];
                                    const hasNextFollowUp = nextFollowUp && nextFollowUp.dueAt;
                                    const isSaving = savingLeadId === lead.id;

                                    return (
                                        <div
                                            key={lead.id}
                                            draggable={!isSaving}
                                            onDragStart={(e) => handleDragStart(e, lead.id, stage.id)}
                                            style={{
                                                background: 'var(--panel-bg)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                cursor: isSaving ? 'progress' : 'grab',
                                                position: 'relative',
                                                opacity: isSaving ? 0.6 : 1,
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                transition: 'border-color 0.2s, box-shadow 0.2s'
                                            }}
                                            className="kanban-card"
                                        >
                                            {isSaving && (
                                                <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
                                                    <Loader2 size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />
                                                </div>
                                            )}

                                            {/* Business Identity */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <Link 
                                                    href={`/crm/leads/${lead.id}`} 
                                                    style={{ textDecoration: 'none', color: '#fff', fontWeight: 600, fontSize: '13px' }}
                                                    className="card-title-link"
                                                >
                                                    {lead.business.business_name}
                                                </Link>
                                            </div>

                                            {/* Category & Location */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                <span>{lead.business.google_category || lead.business.category?.name || 'Uncategorized'}</span>
                                                <span>•</span>
                                                <MapPin size={10} />
                                                <span>{lead.business.city?.name || 'India'}</span>
                                            </div>

                                            {/* Lead Score & Priority */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 8px 0', fontSize: '11px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Score:</span>
                                                    <strong style={{ color: lead.leadScore >= 80 ? 'var(--status-won)' : 'var(--text-main)' }}>{lead.leadScore}</strong>
                                                </div>
                                                {lead.priority && (
                                                    <span className={`badge badge-priority-${lead.priority.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                                                        Priority {lead.priority}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Next pending Follow-up alert */}
                                            {hasNextFollowUp && (
                                                <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', padding: '6px 8px', borderRadius: '4px', marginBottom: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={10} style={{ color: 'var(--accent-primary)' }} />
                                                    <span style={{ color: 'var(--text-muted)' }}>Follow-up:</span>
                                                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                                        {new Date(nextFollowUp.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, {new Date(nextFollowUp.dueAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Est Value & Assignee footer */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '11px' }}>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Deal Value</span>
                                                    <strong style={{ color: 'var(--status-won)' }}>{formatRupees(lead.estimatedValue)}</strong>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Assigned</span>
                                                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '10px' }}>
                                                        {lead.assignedTo ? lead.assignedTo.split('@')[0] : 'Unassigned'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* COMMUNICATIONS / ACCESSIBLE ACTIONS */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {lead.business.phone_number ? (
                                                        <>
                                                            <a href={`tel:${lead.business.phone_number}`} title="Voice Callback" className="card-action-btn">
                                                                <PhoneCall size={12} />
                                                            </a>
                                                            <a href={`https://wa.me/${lead.business.phone_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp Business" className="card-action-btn" style={{ background: 'rgba(34, 197, 94, 0.05)', color: '#22c55e' }}>
                                                                <MessageCircle size={12} />
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No Contact Info</span>
                                                    )}
                                                    <button onClick={() => handleOpenScheduleModal(lead.id)} title="Schedule callback task" className="card-action-btn">
                                                        <Calendar size={12} />
                                                    </button>
                                                </div>

                                                {/* Dropdown select stage selector (For mobile accessibility) */}
                                                <select 
                                                    value={lead.pipelineStageId} 
                                                    onChange={e => handleSelectStage(lead.id, parseInt(e.target.value))}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.3)',
                                                        color: 'var(--text-muted)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        padding: '2px 4px',
                                                        outline: 'none',
                                                        maxWidth: '100px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {stages.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}

                                {stageLeads.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: '11px', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        No leads in this stage.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {leads.length === 0 && (
                    <div className="glass-panel" style={{ width: '100%', padding: '48px', textAlign: 'center' }}>
                        <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h3>Your pipeline is empty</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                            Add qualified businesses from the Discovery dashboard to start building your sales pipeline.
                        </p>
                        <Link href="/discovery">
                            <button className="btn-icon primary" style={{ padding: '8px 16px' }}>
                                Go to Business Discovery <ArrowRight size={14} />
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {/* SCHEDULE FOLLOWUP MODAL */}
            {showFollowUpModal && selectedLeadId && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '16px' }}>Schedule Follow-up Task</h3>
                        <form onSubmit={handleSaveFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {loadingContacts ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                                    <Loader2 size={16} className="spin" style={{ marginRight: '6px' }} /> Loading associated contacts...
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Associated Contact</label>
                                    <select 
                                        className="select-input" 
                                        value={followUpForm.contactId}
                                        onChange={e => setFollowUpForm({ ...followUpForm, contactId: e.target.value })}
                                    >
                                        <option value="">No Contact Mapping</option>
                                        {contacts.map((c: any) => (
                                            <option key={c.id} value={c.id.toString()}>
                                                {c.name} ({c.role || 'No Role'}) {c.isPrimary ? '⭐️ Primary' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Due Date *</label>
                                <input 
                                    type="date" 
                                    required
                                    className="select-input" 
                                    value={followUpForm.date}
                                    onChange={e => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Due Time</label>
                                <input 
                                    type="time" 
                                    className="select-input" 
                                    value={followUpForm.time}
                                    onChange={e => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reminder Alert</label>
                                <select 
                                    className="select-input"
                                    value={followUpForm.reminderMinutes}
                                    onChange={e => setFollowUpForm({ ...followUpForm, reminderMinutes: e.target.value })}
                                >
                                    <option value="None">None</option>
                                    <option value="15">15 Minutes Before</option>
                                    <option value="30">30 Minutes Before</option>
                                    <option value="60">1 Hour Before</option>
                                    <option value="1440">1 Day Before</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                <button type="button" onClick={() => setShowFollowUpModal(false)} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingFollowUp} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {savingFollowUp ? 'Scheduling...' : 'Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .card-action-btn {
                    background: rgba(255,255,255,0.03);
                    color: var(--text-muted);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    padding: 4px 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .card-action-btn:hover {
                    color: var(--text-main);
                    background: rgba(255,255,255,0.08);
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 1.2s linear infinite; }

                /* CSS styles for card highlights */
                .kanban-card:hover {
                    border-color: rgba(59, 130, 246, 0.4) !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
                }
                .card-title-link:hover {
                    color: var(--accent-primary) !important;
                }

                /* Mobile media query overrides */
                @media (max-width: 768px) {
                    .pipeline-board-container {
                        overflow-x: hidden !important;
                        flex-direction: column !important;
                    }
                    .pipeline-stage-column.mobile-hidden {
                        display: none !important;
                    }
                    .pipeline-stage-column.mobile-visible {
                        display: flex !important;
                        flex: 1 1 auto !important;
                        width: 100% !important;
                        min-width: unset !important;
                    }
                    .mobile-only {
                        display: flex !important;
                    }
                }
            `}</style>
        </div>
    );
}
