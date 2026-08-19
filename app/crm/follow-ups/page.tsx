'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Calendar, CheckCircle, Clock, Search, Filter, 
    ArrowLeft, User, Phone, MessageCircle, MoreVertical, 
    Trash2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight,
    Play, Edit3, X, HelpCircle, UserCheck
} from 'lucide-react';

export default function FollowUpsPage() {
    const router = useRouter();

    // Query states
    const [tab, setTab] = useState<'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'ALL'>('TODAY');
    const [q, setQ] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [priority, setPriority] = useState('');
    const [pipelineStageId, setPipelineStageId] = useState('');
    
    // Master data options for filtering
    const [stages, setStages] = useState<any[]>([]);
    
    // Pagination & results state
    const [items, setItems] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected Follow-up for modal actions
    const [selectedFollowUp, setSelectedFollowUp] = useState<any | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Complete Form State
    const [outcome, setOutcome] = useState('INTERESTED');
    const [outcomeNotes, setOutcomeNotes] = useState('');
    const [scheduleNext, setScheduleNext] = useState(false);
    const [nextDate, setNextDate] = useState('');
    const [nextTime, setNextTime] = useState('10:00');
    const [nextReminder, setNextReminder] = useState('None');

    // Reschedule Form State
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('10:00');

    // Action execution states
    const [saving, setSaving] = useState(false);

    // Fetch master stages and initial data
    const fetchStages = async () => {
        try {
            const res = await fetch('/api/crm/leads');
            const data = await res.json();
            // Fallback list of stages
            setStages([
                { id: 1, name: 'New' },
                { id: 2, name: 'Contacted' },
                { id: 3, name: 'Meeting Scheduled' },
                { id: 4, name: 'Proposal Sent' },
                { id: 5, name: 'Closed Won' },
                { id: 6, name: 'Closed Lost' }
            ]);
        } catch (err) {
            console.error('Failed to load stages', err);
        }
    };

    const fetchFollowUps = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                tab,
                q,
                assignedTo,
                priority,
                pipelineStageId,
                page: page.toString(),
                pageSize: pageSize.toString()
            });

            const res = await fetch(`/api/crm/follow-ups?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to query follow-ups');
            const data = await res.json();
            setItems(data.items || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (err: any) {
            setError(err.message || 'An error occurred fetching follow-ups.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStages();
    }, []);

    useEffect(() => {
        setPage(1); // Reset page on tab/filter change
        fetchFollowUps();
    }, [tab, assignedTo, priority, pipelineStageId]);

    useEffect(() => {
        fetchFollowUps();
    }, [page]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchFollowUps();
    };

    const handleClearFilters = () => {
        setQ('');
        setAssignedTo('');
        setPriority('');
        setPipelineStageId('');
        setPage(1);
        setTimeout(() => fetchFollowUps(), 0);
    };

    // Actions completion API submit
    const handleCompleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFollowUp) return;

        setSaving(true);
        try {
            const body: any = {
                status: 'COMPLETED',
                outcome,
                outcomeNotes
            };

            if (scheduleNext && nextDate) {
                body.nextFollowUpDate = nextDate;
                body.nextFollowUpTime = nextTime;
                body.nextFollowUpReminder = nextReminder;
            }

            const res = await fetch(`/api/crm/follow-ups/${selectedFollowUp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to complete follow-up');
            }

            setShowCompleteModal(false);
            setOutcome('INTERESTED');
            setOutcomeNotes('');
            setScheduleNext(false);
            setNextDate('');
            fetchFollowUps();
        } catch (err: any) {
            alert(err.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    // Actions rescheduling API submit
    const handleRescheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFollowUp || !newDate) return;

        setSaving(true);
        try {
            const dueAt = `${newDate}T${newTime || '10:00'}:00`;
            const res = await fetch(`/api/crm/follow-ups/${selectedFollowUp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dueAt })
            });

            if (!res.ok) throw new Error('Failed to reschedule');

            setShowRescheduleModal(false);
            setNewDate('');
            fetchFollowUps();
        } catch (err: any) {
            alert(err.message || 'Failed to reschedule');
        } finally {
            setSaving(false);
        }
    };

    // Actions cancel API submit
    const handleCancelSubmit = async () => {
        if (!selectedFollowUp) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/crm/follow-ups/${selectedFollowUp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED', reason: 'Manually cancelled from dashboard' })
            });

            if (!res.ok) throw new Error('Failed to cancel follow-up');

            setShowCancelModal(false);
            fetchFollowUps();
        } catch (err: any) {
            alert(err.message || 'Failed to cancel follow-up');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFollowUp = async (id: number) => {
        if (!confirm('Are you sure you want to delete this follow-up? This action is recorded in the audit trail.')) return;

        try {
            const res = await fetch(`/api/crm/follow-ups/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete follow-up');
            fetchFollowUps();
        } catch (err: any) {
            alert(err.message || 'Delete failed');
        }
    };

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="crm-workspace" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            {/* Header section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/crm/leads" style={{ color: 'var(--text-color)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Follow-ups & Tasks
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                            Manage schedule calls, emails, and meetings to hit your conversion targets.
                        </p>
                    </div>
                </div>
                <button onClick={fetchFollowUps} className="btn-icon" style={{ padding: '8px' }}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {/* Status tabs row */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '24px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
                {(['TODAY', 'UPCOMING', 'OVERDUE', 'COMPLETED', 'ALL'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: '12px 4px',
                            background: 'none',
                            border: 'none',
                            color: tab === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                            fontWeight: tab === t ? 'bold' : 'normal',
                            fontSize: '14px',
                            borderBottom: tab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {t === 'TODAY' && <Clock size={14} />}
                        {t === 'UPCOMING' && <Calendar size={14} />}
                        {t === 'OVERDUE' && <AlertCircle size={14} style={{ color: 'var(--status-lost)' }} />}
                        {t === 'COMPLETED' && <CheckCircle size={14} style={{ color: 'var(--status-won)' }} />}
                        <span>{t}</span>
                        {tab === t && total > 0 && (
                            <span style={{ fontSize: '11px', background: 'var(--accent-primary)', color: '#000', borderRadius: '10px', padding: '1px 6px', fontWeight: 'bold' }}>
                                {total}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Filter toolbar */}
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Search Query</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                className="select-input" 
                                placeholder="Business, contact, phone..." 
                                style={{ paddingLeft: '34px' }}
                                value={q}
                                onChange={e => setQ(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned Agent</label>
                        <select 
                            className="select-input" 
                            value={assignedTo}
                            onChange={e => setAssignedTo(e.target.value)}
                        >
                            <option value="">All Agents</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pipeline Stage</label>
                        <select 
                            className="select-input" 
                            value={pipelineStageId}
                            onChange={e => setPipelineStageId(e.target.value)}
                        >
                            <option value="">All Stages</option>
                            {stages.map(st => (
                                <option key={st.id} value={st.id.toString()}>{st.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Priority Flag</label>
                        <select 
                            className="select-input" 
                            value={priority}
                            onChange={e => setPriority(e.target.value)}
                        >
                            <option value="">All Priorities</option>
                            <option value="A">Priority A (High)</option>
                            <option value="B">Priority B (Medium)</option>
                            <option value="C">Priority C (Low)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn-icon primary" style={{ flex: 1, padding: '10px' }}>
                            <Filter size={14} style={{ marginRight: '6px' }} /> Apply
                        </button>
                        <button type="button" onClick={handleClearFilters} className="btn-icon" style={{ flex: 1, padding: '10px' }}>
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {/* List entries */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-panel skeleton" style={{ height: '120px', borderRadius: '12px' }} />
                    ))}
                </div>
            ) : error ? (
                <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--status-lost)' }}>
                    <AlertCircle size={24} style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0 }}>{error}</p>
                </div>
            ) : items.length === 0 ? (
                <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <HelpCircle size={36} style={{ marginBottom: '12px' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: '#fff' }}>No Follow-ups Found</h3>
                    <p style={{ margin: 0, fontSize: '13px' }}>
                        {tab === 'TODAY' && 'You have no scheduled calls or tasks due today! Enjoy the clear schedule.'}
                        {tab === 'UPCOMING' && 'No upcoming follow-ups scheduled yet.'}
                        {tab === 'OVERDUE' && 'Great job! You have 0 overdue interactions.'}
                        {tab === 'COMPLETED' && 'No completed sales follow-ups logged yet.'}
                        {tab === 'ALL' && 'No follow-up database logs match your query.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {items.map(fu => {
                        const lead = fu.crmLead;
                        const biz = lead?.business;
                        const lastAct = lead?.activities?.[0];

                        // Calculate if overdue on UI (as secondary check)
                        const isOverdue = fu.status === 'PENDING' && new Date(fu.dueAt) < new Date();

                        return (
                            <div 
                                key={fu.id} 
                                className="glass-panel card-hover" 
                                style={{ 
                                    padding: '20px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start',
                                    gap: '24px',
                                    borderLeft: isOverdue ? '4px solid var(--status-lost)' : fu.status === 'COMPLETED' ? '4px solid var(--status-won)' : '1px solid var(--border-color)',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px' }}>
                                            <Link href={`/crm/leads/${lead.id}`} style={{ color: '#fff', textDecoration: 'none' }} className="hover-link">
                                                {biz?.business_name || 'Business ID ' + lead.businessId}
                                            </Link>
                                        </h3>
                                        <span className={`badge-priority-${lead.priority?.toLowerCase() || 'c'}`}>
                                            Priority {lead.priority || 'C'}
                                        </span>
                                        {lead.pipelineStage && (
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                {lead.pipelineStage.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* FollowUp specifics */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={13} style={{ color: isOverdue ? 'var(--status-lost)' : 'var(--text-muted)' }} />
                                            <span>
                                                Due: <strong style={{ color: isOverdue ? 'var(--status-lost)' : '#fff' }}>{formatDateTime(fu.dueAt)}</strong>
                                                {isOverdue && <span style={{ color: 'var(--status-lost)', marginLeft: '6px', fontSize: '11px', fontWeight: 'bold' }}>(OVERDUE)</span>}
                                            </span>
                                        </div>

                                        {fu.contact ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={13} />
                                                <span>
                                                    Contact: <strong>{fu.contact.name}</strong> ({fu.contact.role || 'No Role'})
                                                    {fu.contact.phone && ` • ${fu.contact.phone}`}
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={13} />
                                                <span>No Contact Mapping</span>
                                            </div>
                                        )}

                                        {fu.assignedTo && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <UserCheck size={13} />
                                                <span>Assigned to: <strong>{fu.assignedTo}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* History indicators */}
                                    {lastAct && (
                                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                Latest Contact Interaction ({new Date(lastAct.occurredAt).toLocaleDateString()})
                                            </div>
                                            <div>
                                                <strong>{lastAct.type}</strong>: {lastAct.summary}
                                            </div>
                                            {lastAct.details && (
                                                <div style={{ fontStyle: 'italic', marginTop: '2px' }}>
                                                    "{lastAct.details.length > 80 ? lastAct.details.slice(0, 80) + '...' : lastAct.details}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action items */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {fu.status === 'PENDING' && (
                                        <>
                                            <button 
                                                onClick={() => {
                                                    setSelectedFollowUp(fu);
                                                    setShowCompleteModal(true);
                                                }}
                                                className="btn-icon primary"
                                                style={{ padding: '8px 16px', fontSize: '12px' }}
                                            >
                                                Complete
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setSelectedFollowUp(fu);
                                                    setNewDate(fu.dueAt.slice(0, 10));
                                                    setShowRescheduleModal(true);
                                                }}
                                                className="btn-icon"
                                                style={{ padding: '8px 12px', fontSize: '12px' }}
                                            >
                                                Reschedule
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setSelectedFollowUp(fu);
                                                    setShowCancelModal(true);
                                                }}
                                                className="btn-icon"
                                                style={{ padding: '8px', color: 'var(--text-muted)' }}
                                                title="Cancel"
                                            >
                                                <X size={15} />
                                            </button>
                                        </>
                                    )}

                                    {fu.status === 'COMPLETED' && (
                                        <div style={{ fontSize: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                            <div style={{ color: 'var(--status-won)', fontWeight: 'bold' }}>COMPLETED</div>
                                            <div>Outcome: {fu.outcome}</div>
                                            {fu.completedAt && <div style={{ fontSize: '10px' }}>At: {new Date(fu.completedAt).toLocaleDateString()}</div>}
                                        </div>
                                    )}

                                    {fu.status === 'CANCELLED' && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            CANCELLED
                                        </div>
                                    )}

                                    <div style={{ borderLeft: '1px solid var(--border-color)', height: '28px', margin: '0 4px' }} />

                                    <Link href={`/crm/leads/${lead.id}`} className="btn-icon" style={{ padding: '8px 12px', fontSize: '12px', textDecoration: 'none' }}>
                                        Open Cockpit
                                    </Link>
                                    
                                    <button 
                                        onClick={() => handleDeleteFollowUp(fu.id)}
                                        className="btn-icon"
                                        style={{ padding: '8px', minWidth: 'unset', color: 'var(--status-lost)' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', alignItems: 'center' }}>
                    <button 
                        disabled={page === 1} 
                        onClick={() => setPage(page - 1)} 
                        className="btn-icon"
                        style={{ padding: '6px 12px' }}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Page <strong>{page}</strong> of {totalPages}
                    </span>
                    <button 
                        disabled={page === totalPages} 
                        onClick={() => setPage(page + 1)} 
                        className="btn-icon"
                        style={{ padding: '6px 12px' }}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Complete modal dialog */}
            {showCompleteModal && selectedFollowUp && (
                <div className="modal-backdrop">
                    <div className="glass-panel modal-content" style={{ maxWidth: '500px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Complete Follow-up</h3>
                            <button onClick={() => setShowCompleteModal(false)} className="btn-icon" style={{ padding: '4px' }}><X size={16} /></button>
                        </div>

                        <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Interaction Outcome *</label>
                                <select 
                                    className="select-input" 
                                    value={outcome}
                                    onChange={e => setOutcome(e.target.value)}
                                >
                                    <option value="INTERESTED">INTERESTED</option>
                                    <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                                    <option value="NO_RESPONSE">NO_RESPONSE</option>
                                    <option value="DEMO_SENT">DEMO_SENT</option>
                                    <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
                                    <option value="NEGOTIATION">NEGOTIATION</option>
                                    <option value="WON">WON</option>
                                    <option value="LOST">LOST</option>
                                    <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Interaction Log Summary Notes</label>
                                <textarea 
                                    className="select-input" 
                                    style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                                    placeholder="Brief outline of follow-up results..."
                                    required
                                    value={outcomeNotes}
                                    onChange={e => setOutcomeNotes(e.target.value)}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={scheduleNext}
                                        onChange={e => setScheduleNext(e.target.checked)}
                                    />
                                    <strong>Schedule Next Follow-up Task</strong>
                                </label>
                            </div>

                            {scheduleNext && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date</label>
                                        <input 
                                            type="date" 
                                            required={scheduleNext}
                                            className="select-input"
                                            value={nextDate}
                                            onChange={e => setNextDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Time</label>
                                        <input 
                                            type="time" 
                                            className="select-input"
                                            value={nextTime}
                                            onChange={e => setNextTime(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reminder</label>
                                        <select 
                                            className="select-input"
                                            value={nextReminder}
                                            onChange={e => setNextReminder(e.target.value)}
                                        >
                                            <option value="None">None</option>
                                            <option value="15">15 Minutes Before</option>
                                            <option value="30">30 Minutes Before</option>
                                            <option value="60">1 Hour Before</option>
                                            <option value="1440">1 Day Before</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowCompleteModal(false)} className="btn-icon">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '8px 20px' }}>
                                    {saving ? 'Completing...' : 'Complete Follow-up'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reschedule modal dialog */}
            {showRescheduleModal && selectedFollowUp && (
                <div className="modal-backdrop">
                    <div className="glass-panel modal-content" style={{ maxWidth: '400px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Reschedule Follow-up</h3>
                            <button onClick={() => setShowRescheduleModal(false)} className="btn-icon" style={{ padding: '4px' }}><X size={16} /></button>
                        </div>

                        <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Select New Date</label>
                                <input 
                                    type="date" 
                                    required
                                    className="select-input" 
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Select New Time</label>
                                <input 
                                    type="time" 
                                    required
                                    className="select-input" 
                                    value={newTime}
                                    onChange={e => setNewTime(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn-icon">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '8px 20px' }}>
                                    {saving ? 'Rescheduling...' : 'Reschedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel confirmation modal dialog */}
            {showCancelModal && selectedFollowUp && (
                <div className="modal-backdrop">
                    <div className="glass-panel modal-content" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '24px' }}>
                        <AlertCircle size={36} style={{ color: 'var(--status-lost)', marginBottom: '12px' }} />
                        <h3 style={{ margin: '0 0 8px 0' }}>Cancel Follow-up?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>
                            Are you sure you want to cancel the scheduled follow-up for <strong>{selectedFollowUp.crmLead?.business?.business_name || 'this lead'}</strong>? This interaction record remains in history as CANCELLED.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => setShowCancelModal(false)} className="btn-icon" style={{ width: '100px' }}>
                                Dismiss
                            </button>
                            <button type="button" onClick={handleCancelSubmit} disabled={saving} className="btn-icon primary" style={{ width: '120px', background: 'var(--status-lost)' }}>
                                {saving ? 'Cancelling...' : 'Cancel Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
