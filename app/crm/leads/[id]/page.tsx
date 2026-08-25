'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, MapPin, Phone, Globe, Star, Clock, 
    Target, Building, CheckCircle2, Copy, Check,
    User, Mail, PhoneCall, History, MessageCircle,
    AlertCircle, Edit, Trash2, Plus, Calendar,
    ShieldAlert, Award, Loader2, DollarSign, ExternalLink, X
} from 'lucide-react';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const leadId = parseInt(resolvedParams.id);

    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dynamic Options (fetched for stage transitions & developer assignment)
    const [stages, setStages] = useState<any[]>([]);
    const [developers, setDevelopers] = useState<any[]>([]);

    // Local Copied Flag
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Active Section Tab
    const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'followups' | 'timeline' | 'notes'>('overview');

    // Modals and Forms State
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingContact, setEditingContact] = useState<any | null>(null);
    const [contactForm, setContactForm] = useState({
        name: '', role: '', phone: '', email: '', whatsapp: '', preferredContactMethod: 'EMAIL', isPrimary: false
    });

    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityForm, setActivityForm] = useState({
        type: 'CALL', summary: '', details: '', outcome: '', performedBy: 'Admin', contactId: ''
    });

    const [showNoteModal, setShowNoteModal] = useState(false);
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [noteContent, setNoteContent] = useState('');

    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpForm, setFollowUpForm] = useState({
        contactId: '', date: '', time: '10:00', assignedTo: '', reminderMinutes: 'None'
    });

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

    const [saving, setSaving] = useState(false);

    // Deal Management States
    const [showCreateDealModal, setShowCreateDealModal] = useState(false);
    const [dealForm, setDealForm] = useState({
        name: '',
        value: '',
        currency: 'INR',
        expectedCloseDate: '',
        description: ''
    });
    const [statusModalDealId, setStatusModalDealId] = useState<number | null>(null);
    const [statusModalType, setStatusModalType] = useState<'WON' | 'LOST' | null>(null);
    const [dealLostReason, setDealLostReason] = useState('PRICE');
    const [dealLostNotes, setDealLostNotes] = useState('');

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/deals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: dealForm.name,
                    value: dealForm.value,
                    currency: dealForm.currency,
                    expectedCloseDate: dealForm.expectedCloseDate || null,
                    description: dealForm.description
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create deal.');
            }

            setShowCreateDealModal(false);
            setDealForm({
                name: '',
                value: '',
                currency: 'INR',
                expectedCloseDate: '',
                description: ''
            });
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to create deal');
        } finally {
            setSaving(false);
        }
    };

    const handleQuickDealStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusModalDealId || !statusModalType) return;
        setSaving(true);
        try {
            const body: any = { status: statusModalType };
            if (statusModalType === 'LOST') {
                body.lostReason = `${dealLostReason} - ${dealLostNotes}`.trim();
            }

            const res = await fetch(`/api/crm/deals/${statusModalDealId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update deal status.');
            }

            setStatusModalDealId(null);
            setStatusModalType(null);
            setDealLostNotes('');
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to transition deal status.');
        } finally {
            setSaving(false);
        }
    };

    const formatDealCurrency = (val: number, curr: string = 'INR') => {
        return val.toLocaleString(curr === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    // Fetch lead details and pipeline stages
    const loadLeadDetails = async () => {
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`);
            if (!res.ok) throw new Error('Lead not found or API failure.');
            const data = await res.json();
            setLead(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to retrieve Lead.');
        } finally {
            setLoading(false);
        }
    };

    const loadStages = async () => {
        try {
            // Fetch stages to select from on the sidebar
            const res = await fetch('/api/crm/leads');
            const data = await res.json();
            // In a production system, fetch stages via /api/crm/stages, but since
            // they are loaded on leads client, we can grab them from the first lead
            // or fetch them. Let's make an API call to settings/stages or similar, 
            // or default to common pipeline stage items.
            // Let's seed common stages as fallback if list leads fails
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

    const loadDevelopers = async () => {
        try {
            const res = await fetch('/api/crm/users');
            if (res.ok) {
                const uData = await res.json();
                setDevelopers(uData.filter((u: any) => u.role === 'DEVELOPER'));
            }
        } catch (err) {
            console.error('Failed to load developers:', err);
        }
    };

    useEffect(() => {
        if (isNaN(leadId)) {
            setError('Invalid Lead ID');
            setLoading(false);
            return;
        }
        loadLeadDetails();
        loadStages();
        loadDevelopers();
    }, [leadId]);

    useEffect(() => {
        if (lead) {
            const primary = lead.contacts?.find((c: any) => c.isPrimary);
            if (primary) {
                setActivityForm(prev => ({ ...prev, contactId: primary.id.toString() }));
            } else if (lead.contacts && lead.contacts.length > 0) {
                setActivityForm(prev => ({ ...prev, contactId: lead.contacts[0].id.toString() }));
            }
        }
    }, [lead]);

    // Handle Quick Header updates (Stage, Priority, Assignee, Est. Value)
    const handleQuickUpdate = async (field: string, value: any) => {
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

            if (!res.ok) throw new Error('Failed to update lead');
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to update field.');
        }
    };

    const handleDeveloperUpdate = async (developerId: string) => {
        setSaving(true);
        try {
            if (!developerId) {
                // Clear assignment using PATCH
                const res = await fetch(`/api/crm/leads/${leadId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignedTo: null })
                });
                if (!res.ok) throw new Error('Failed to clear developer assignment');
            } else {
                // Assign using assign endpoint
                const res = await fetch(`/api/crm/leads/${leadId}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignedTo: developerId })
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to assign developer.');
                }
            }
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to update developer assignment.');
        } finally {
            setSaving(false);
        }
    };

    // Contacts CRUD Actions
    const openAddContact = () => {
        setEditingContact(null);
        setContactForm({
            name: '', role: '', phone: '', email: '', whatsapp: '', preferredContactMethod: 'EMAIL', isPrimary: false
        });
        setShowContactModal(true);
    };

    const openEditContact = (contact: any) => {
        setEditingContact(contact);
        setContactForm({
            name: contact.name,
            role: contact.role || '',
            phone: contact.phone || '',
            email: contact.email || '',
            whatsapp: contact.whatsapp || '',
            preferredContactMethod: contact.preferredContactMethod || 'EMAIL',
            isPrimary: contact.isPrimary
        });
        setShowContactModal(true);
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.name.trim()) return alert('Name is required');

        setSaving(true);
        try {
            let res;
            if (editingContact) {
                res = await fetch(`/api/crm/contacts/${editingContact.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactForm)
                });
            } else {
                res = await fetch(`/api/crm/leads/${leadId}/contacts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactForm)
                });
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to persist contact');
            }

            setShowContactModal(false);
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteContact = async (contactId: number) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            const res = await fetch(`/api/crm/contacts/${contactId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete contact');
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        }
    };

    const handleSetPrimaryContact = async (contactId: number) => {
        try {
            const res = await fetch(`/api/crm/contacts/${contactId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPrimary: true })
            });
            if (!res.ok) throw new Error('Failed to update primary contact status');
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to update');
        }
    };

    // Notes CRUD Actions
    const openAddNote = () => {
        setEditingNote(null);
        setNoteContent('');
        setShowNoteModal(true);
    };

    const openEditNote = (note: any) => {
        setEditingNote(note);
        setNoteContent(note.content);
        setShowNoteModal(true);
    };

    const handleSaveNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim()) return alert('Note content is required');

        setSaving(true);
        try {
            let res;
            if (editingNote) {
                res = await fetch(`/api/crm/notes/${editingNote.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: noteContent })
                });
            } else {
                res = await fetch(`/api/crm/leads/${leadId}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: noteContent, author: 'Admin' })
                });
            }

            if (!res.ok) throw new Error('Failed to save note');

            setShowNoteModal(false);
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            const res = await fetch(`/api/crm/notes/${noteId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete note');
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to delete note');
        }
    };

    // Activity Log Actions
    const handleLogActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityForm.summary.trim()) return alert('Activity summary is required');

        setSaving(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityForm)
            });

            if (!res.ok) throw new Error('Failed to log activity');

            const primary = lead.contacts?.find((c: any) => c.isPrimary);
            setActivityForm({ 
                type: 'CALL', 
                summary: '', 
                details: '', 
                outcome: '', 
                performedBy: 'Admin',
                contactId: primary ? primary.id.toString() : (lead.contacts?.[0]?.id.toString() || '')
            });
            setShowActivityModal(false);
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to log activity');
        } finally {
            setSaving(false);
        }
    };

    // Follow-up Actions
    const openAddFollowUp = () => {
        const primary = lead.contacts?.find((c: any) => c.isPrimary);
        setFollowUpForm({
            contactId: primary ? primary.id.toString() : (lead.contacts?.[0]?.id.toString() || ''),
            date: '',
            time: '10:00',
            assignedTo: lead.assignedTo || 'Admin',
            reminderMinutes: 'None'
        });
        setShowFollowUpModal(true);
    };

    const handleSaveFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!followUpForm.date) return alert('Date is required');

        setSaving(true);
        try {
            const dueAt = `${followUpForm.date}T${followUpForm.time}:00`;
            let reminderAt = null;
            if (followUpForm.reminderMinutes !== 'None') {
                const minutes = parseInt(followUpForm.reminderMinutes);
                if (!isNaN(minutes)) {
                    const dueTime = new Date(dueAt).getTime();
                    reminderAt = new Date(dueTime - minutes * 60 * 1000).toISOString();
                }
            }

            const res = await fetch(`/api/crm/leads/${leadId}/follow-ups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: followUpForm.contactId ? parseInt(followUpForm.contactId) : null,
                    assignedTo: followUpForm.assignedTo || 'Admin',
                    dueAt,
                    reminderAt
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to schedule follow-up');
            }

            setShowFollowUpModal(false);
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to schedule follow-up');
        } finally {
            setSaving(false);
        }
    };
    // Complete Follow-up Submit Handler
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
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    // Reschedule Follow-up Submit Handler
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
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to reschedule');
        } finally {
            setSaving(false);
        }
    };

    // Cancel Follow-up Submit Handler
    const handleCancelSubmit = async () => {
        if (!selectedFollowUp) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/crm/follow-ups/${selectedFollowUp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED', reason: 'Manually cancelled from cockpit' })
            });

            if (!res.ok) throw new Error('Failed to cancel follow-up');

            setShowCancelModal(false);
            await loadLeadDetails();
        } catch (err: any) {
            alert(err.message || 'Failed to cancel follow-up');
        } finally {
            setSaving(false);
        }
    };
    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="spin" style={{ marginRight: '8px' }} />
                <span>Loading CRM lead details...</span>
                <style jsx>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .spin { animation: spin 1s linear infinite; }
                `}</style>
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <AlertCircle size={48} style={{ color: 'var(--status-lost)', marginBottom: '16px' }} />
                <h2>Lead Profile Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The lead record could not be retrieved from PostgreSQL.</p>
                <button onClick={() => router.push('/crm/leads')} className="btn-icon">
                    <ArrowLeft size={16} /> Back to Leads list
                </button>
            </div>
        );
    }

    const { business, pipelineStage } = lead;
    const primaryContact = lead.contacts?.find((c: any) => c.isPrimary);

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Top Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <button 
                    onClick={() => router.push('/crm/leads')}
                    className="btn-icon"
                    style={{ background: 'var(--panel-bg)', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: 'var(--text-main)' }}
                >
                    <ArrowLeft size={16} /> Back to Leads
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={openAddContact} className="btn-icon primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
                        <Plus size={14} /> Add Contact
                    </button>
                    <button onClick={() => setShowActivityModal(true)} className="btn-icon" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.05)' }}>
                        <Plus size={14} /> Log Activity
                    </button>
                    <button onClick={openAddFollowUp} className="btn-icon" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.05)' }}>
                        <Calendar size={14} style={{ marginRight: '4px' }} /> Schedule Follow-up
                    </button>
                    <button onClick={openAddNote} className="btn-icon" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.05)' }}>
                        <Plus size={14} /> Add Note
                    </button>
                </div>
            </div>

            {/* HEADER COMPONENT */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ margin: 0, marginBottom: '8px', fontSize: '28px' }}>{business.business_name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            <Target size={16} />
                            <span>{business.google_category || business.category?.name || 'Uncategorized'}</span>
                            <span style={{ margin: '0 4px' }}>•</span>
                            <MapPin size={14} />
                            <span>{business.city?.name || 'Unknown City'}, {business.state?.name || '-'}</span>
                            {business.rating && (
                                <>
                                    <span style={{ margin: '0 4px' }}>•</span>
                                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{business.rating}</span>
                                    <span>({business.review_count} reviews)</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', minWidth: '320px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Lead Score</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-won)' }}>{lead.leadScore} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/100</span></div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Priority</div>
                            <span className={`badge ${lead.priority ? `badge-priority-${lead.priority.toLowerCase()}` : ''}`} style={{ display: 'inline-block', marginTop: '2px' }}>
                                {lead.priority || 'None'}
                            </span>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Current Stage</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '4px' }}>{pipelineStage?.name}</div>
                        </div>
                    </div>
                </div>

                {/* QUICK COMMUNICATIONS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    {business.phone_number ? (
                        <a href={`tel:${business.phone_number}`} className="btn-icon primary" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
                            <PhoneCall size={14} /> Call {business.phone_number}
                        </a>
                    ) : (
                        <button disabled className="btn-icon" style={{ padding: '8px 16px', fontSize: '13px', opacity: 0.5, cursor: 'not-allowed' }}>
                            Phone number unavailable
                        </button>
                    )}

                    {business.phone_number ? (
                        <a 
                            href={`https://wa.me/${business.phone_number.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn-icon" 
                            style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }}
                        >
                            <MessageCircle size={14} /> WhatsApp Business
                        </a>
                    ) : (
                        <button disabled className="btn-icon" style={{ padding: '8px 16px', fontSize: '13px', opacity: 0.5, cursor: 'not-allowed' }}>
                            WhatsApp unavailable
                        </button>
                    )}

                    {business.email ? (
                        <a href={`mailto:${business.email}`} className="btn-icon" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
                            <Mail size={14} /> Email Lead
                        </a>
                    ) : (
                        <button disabled className="btn-icon" style={{ padding: '8px 16px', fontSize: '13px', opacity: 0.5, cursor: 'not-allowed' }}>
                            Email unavailable
                        </button>
                    )}
                </div>
            </div>

            {/* DUAL WORKSPACE LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* LEFT WORKSPACE PANEL */}
                <div>
                    {/* Tabs navigation */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', gap: '24px' }}>
                        <button 
                            onClick={() => setActiveTab('overview')}
                            style={{ padding: '12px 4px', background: 'none', border: 'none', color: activeTab === 'overview' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'overview' ? '2px solid var(--accent-primary)' : 'none', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('contacts')}
                            style={{ padding: '12px 4px', background: 'none', border: 'none', color: activeTab === 'contacts' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'contacts' ? '2px solid var(--accent-primary)' : 'none', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            Contacts <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{lead.contacts?.length || 0}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('followups')}
                            style={{ padding: '12px 4px', background: 'none', border: 'none', color: activeTab === 'followups' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'followups' ? '2px solid var(--accent-primary)' : 'none', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            Follow-ups <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{lead.followUps?.length || 0}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('timeline')}
                            style={{ padding: '12px 4px', background: 'none', border: 'none', color: activeTab === 'timeline' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'timeline' ? '2px solid var(--accent-primary)' : 'none', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                        >
                            Activity Timeline
                        </button>
                        <button 
                            onClick={() => setActiveTab('notes')}
                            style={{ padding: '12px 4px', background: 'none', border: 'none', color: activeTab === 'notes' ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: activeTab === 'notes' ? '2px solid var(--accent-primary)' : 'none', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            Notes <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{lead.notes?.length || 0}</span>
                        </button>
                    </div>

                    {/* TAB CONTENTS */}
                    {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Business Profile */}
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={16} /> Business details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Business Name</div>
                                        <div style={{ fontWeight: 600 }}>{business.business_name}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Google Category</div>
                                        <div style={{ fontWeight: 600 }}>{business.google_category || business.category?.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</div>
                                        <div style={{ fontWeight: 600 }}>{business.phone_number || 'No phone recorded'}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Website</div>
                                        {business.website ? (
                                            <a href={business.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                {business.website} <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No website listed</div>
                                        )}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Full Address</div>
                                        <div style={{ fontWeight: 600, lineHeight: 1.4 }}>{business.full_address || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Website Development & Swati Handoff Info */}
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16} /> Website Development & Handoff</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Assigned Developer</div>
                                        <div style={{ fontWeight: 600 }}>{lead.developer?.name || 'Not assigned'}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Website Status</div>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            background: lead.websiteStatus === 'COMPLETED' ? 'rgba(16,185,129,0.15)' : lead.websiteStatus === 'IN_PROGRESS' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: lead.websiteStatus === 'COMPLETED' ? '#10b981' : lead.websiteStatus === 'IN_PROGRESS' ? 'var(--accent-primary)' : 'var(--text-muted)',
                                            display: 'inline-block',
                                            marginTop: '2px'
                                        }}>
                                            {lead.websiteStatus || 'ASSIGNED'}
                                        </span>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Website URL</div>
                                        {lead.websiteUrl ? (
                                            <a href={lead.websiteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                {lead.websiteUrl} <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Website Completed Date</div>
                                        <div style={{ fontWeight: 600 }}>{lead.websiteCompletedAt ? new Date(lead.websiteCompletedAt).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', gridColumn: 'span 2', paddingTop: '16px', marginTop: '4px' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Swati Chaudhary Handoff Status</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Handoff Status</div>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: lead.handoffStatus === 'HANDED_OVER' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                                    color: lead.handoffStatus === 'HANDED_OVER' ? '#10b981' : 'var(--text-muted)',
                                                    display: 'inline-block',
                                                    marginTop: '2px'
                                                }}>
                                                    {lead.handoffStatus || 'PENDING'}
                                                </span>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Handoff Date</div>
                                                <div style={{ fontWeight: 600 }}>{lead.handoffDate ? new Date(lead.handoffDate).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Scoring details & Intelligence */}
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={16} /> Lead Intelligence & Website Audit</h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Lead Score</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: lead.leadScore >= 70 ? 'var(--status-won)' : 'inherit' }}>{lead.leadScore || 0}</div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Opp. Score</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6' }}>{business.opportunity_score || 0}</div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Est. Deal Value</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{formatCurrency(lead.estimatedValue)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                    {/* Web audit findings */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Technical Audit Findings</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Website Exists</span>
                                                <span style={{ fontWeight: 600, color: business.website_exists ? '#22c55e' : '#ef4444' }}>{business.website_exists ? 'YES' : 'NO'}</span>
                                            </div>
                                            {business.website_exists && (
                                                <>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>Mobile Responsive</span>
                                                        <span style={{ fontWeight: 600, color: business.audit_mobile_responsive ? '#22c55e' : '#ef4444' }}>{business.audit_mobile_responsive ? 'YES' : 'NO'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>HTTPS Encryption (SSL)</span>
                                                        <span style={{ fontWeight: 600, color: business.audit_https ? '#22c55e' : '#ef4444' }}>{business.audit_https ? 'YES' : 'NO'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>Contact Info Visible</span>
                                                        <span style={{ fontWeight: 600, color: business.audit_contact_visible ? '#22c55e' : '#ef4444' }}>{business.audit_contact_visible ? 'YES' : 'NO'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>Booking Calendar Engine</span>
                                                        <span style={{ fontWeight: 600, color: business.audit_booking_engine ? '#22c55e' : '#ef4444' }}>{business.audit_booking_engine ? 'YES' : 'NO'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>Speed Score</span>
                                                        <span style={{ fontWeight: 600, color: business.audit_speed_score >= 80 ? '#22c55e' : business.audit_speed_score >= 50 ? '#f59e0b' : '#ef4444' }}>{business.audit_speed_score || 0}/100</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>SEO Score</span>
                                                        <span style={{ fontWeight: 600, color: business.audit_seo_score >= 80 ? '#22c55e' : business.audit_seo_score >= 50 ? '#f59e0b' : '#ef4444' }}>{business.audit_seo_score || 0}/100</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actionable recommendations */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Prioritized Sales Actions</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                            {!business.website_exists ? (
                                                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
                                                    <strong>Pitch Landing Page:</strong> Client has no online presence. High opportunity for standard web design package.
                                                </div>
                                            ) : (
                                                <>
                                                    {business.audit_mobile_responsive === false && (
                                                        <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
                                                            <strong>Mobile Responsiveness pitch:</strong> Site fails mobile optimization checks.
                                                        </div>
                                                    )}
                                                    {business.audit_https === false && (
                                                        <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid #f59e0b', borderRadius: '4px' }}>
                                                            <strong>Security SSL Pitch:</strong> Site is flagged insecure. Offer SSL integration.
                                                        </div>
                                                    )}
                                                    {business.audit_booking_engine === false && (
                                                        <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #3b82f6', borderRadius: '4px' }}>
                                                            <strong>Booking Engine Pitch:</strong> No direct calendar booking detected. Offer booking engine setup.
                                                        </div>
                                                    )}
                                                    {(!business.audit_mobile_responsive && business.audit_https && business.audit_booking_engine) && (
                                                        <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.05)', borderLeft: '3px solid #22c55e', borderRadius: '4px' }}>
                                                            <strong>SEO & Maintenance:</strong> Pitch premium monthly maintenance and SEO upgrades.
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                Use these technical audit insights directly during lead callbacks to demonstrate domain expertise and convert prospects.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="glass-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>Contacts Directory</h3>
                                <button onClick={openAddContact} className="btn-icon primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    <Plus size={14} /> Add Contact
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {lead.contacts && lead.contacts.map((contact: any) => (
                                    <div key={contact.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: contact.isPrimary ? 'rgba(59, 130, 246, 0.03)' : 'rgba(0,0,0,0.1)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ fontSize: '15px' }}>{contact.name}</strong>
                                                {contact.isPrimary && (
                                                    <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '10px', fontWeight: 'bold' }}>
                                                        PRIMARY
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                <span>{contact.role || 'No role mapped'}</span>
                                                {contact.activities && contact.activities.length > 0 && (
                                                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>
                                                        📞 {contact.activities.length} interactions
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {contact.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {contact.phone}</span>}
                                                {contact.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {contact.email}</span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {!contact.isPrimary && (
                                                <button 
                                                    onClick={() => handleSetPrimaryContact(contact.id)}
                                                    className="btn-icon" 
                                                    style={{ padding: '6px 10px', fontSize: '11px' }}
                                                >
                                                    Set Primary
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => openEditContact(contact)}
                                                className="btn-icon" 
                                                style={{ padding: '6px', minWidth: 'unset' }}
                                                title="Edit Contact"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteContact(contact.id)}
                                                className="btn-icon" 
                                                style={{ padding: '6px', minWidth: 'unset', color: 'var(--status-lost)' }}
                                                title="Delete Contact"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {(!lead.contacts || lead.contacts.length === 0) && (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                        No contacts added yet. Click "+ Add Contact" to build the profile.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'followups' && (
                        <div className="glass-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>Follow-up Tasks</h3>
                                <button onClick={openAddFollowUp} className="btn-icon primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    <Calendar size={14} style={{ marginRight: '4px' }} /> Schedule Follow-up
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {lead.followUps && lead.followUps.map((fu: any) => {
                                    const isPending = fu.status === 'PENDING';
                                    const isOverdue = isPending && new Date(fu.dueAt) < new Date();
                                    return (
                                        <div 
                                            key={fu.id} 
                                            style={{ 
                                                border: '1px solid var(--border-color)', 
                                                borderRadius: '10px', 
                                                padding: '16px', 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                background: isOverdue ? 'rgba(239, 68, 68, 0.05)' : fu.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.03)' : 'rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: isOverdue ? 'var(--status-lost)' : '#fff' }}>
                                                        {new Date(fu.dueAt).toLocaleDateString()} at {new Date(fu.dueAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                    {isOverdue && (
                                                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '9px', fontWeight: 'bold' }}>
                                                            OVERDUE
                                                        </span>
                                                    )}
                                                    {fu.status === 'COMPLETED' && (
                                                        <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '9px', fontWeight: 'bold' }}>
                                                            COMPLETED
                                                        </span>
                                                    )}
                                                    {fu.status === 'CANCELLED' && (
                                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '9px' }}>
                                                            CANCELLED
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {fu.contact ? `Contact: ${fu.contact.name} (${fu.contact.role || 'No Role'})` : 'No Contact Mapping'}
                                                    {` • Assigned: ${fu.assignedTo || 'Admin'}`}
                                                </div>

                                                {fu.status === 'COMPLETED' && fu.outcome && (
                                                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginTop: '6px', fontStyle: 'italic' }}>
                                                        Outcome: {fu.outcome}
                                                    </div>
                                                )}
                                            </div>

                                            {isPending && (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedFollowUp(fu);
                                                            setShowCompleteModal(true);
                                                        }}
                                                        className="btn-icon primary" 
                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
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
                                                        style={{ padding: '6px 10px', fontSize: '11px' }}
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedFollowUp(fu);
                                                            setShowCancelModal(true);
                                                        }}
                                                        className="btn-icon" 
                                                        style={{ padding: '6px', minWidth: 'unset', color: 'var(--text-muted)' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {(!lead.followUps || lead.followUps.length === 0) && (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                        No follow-ups scheduled yet. Click "+ Schedule Follow-up" to set one.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Log New Activity Section */}
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '16px' }}>Log New Interaction Activity</h3>
                                <form onSubmit={handleLogActivity} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Activity Type</label>
                                        <select 
                                            className="select-input" 
                                            value={activityForm.type}
                                            onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                                        >
                                            <option value="CALL">📞 CALL</option>
                                            <option value="WHATSAPP">💬 WHATSAPP</option>
                                            <option value="EMAIL">✉️ EMAIL</option>
                                            <option value="MEETING">🤝 MEETING</option>
                                            <option value="DEMO">🖥️ DEMO</option>
                                            <option value="PROPOSAL">💼 PROPOSAL</option>
                                            <option value="OTHER">⚙️ OTHER</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Associated Contact</label>
                                        <select 
                                            className="select-input" 
                                            value={activityForm.contactId}
                                            onChange={e => setActivityForm({ ...activityForm, contactId: e.target.value })}
                                        >
                                            <option value="">No Contact Mapping</option>
                                            {lead.contacts && lead.contacts.map((c: any) => (
                                                <option key={c.id} value={c.id.toString()}>
                                                    {c.name} ({c.role || 'No Role'}) {c.isPrimary ? '⭐️ Primary' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Outcome Status</label>
                                        <select 
                                            className="select-input" 
                                            value={activityForm.outcome}
                                            onChange={e => setActivityForm({ ...activityForm, outcome: e.target.value })}
                                        >
                                            <option value="">Choose Outcome</option>
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

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Summary Title *</label>
                                        <input 
                                            type="text" 
                                            className="select-input" 
                                            required
                                            placeholder="Brief description of the interaction"
                                            value={activityForm.summary}
                                            onChange={e => setActivityForm({ ...activityForm, summary: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Detailed Notes</label>
                                        <textarea 
                                            className="select-input" 
                                            style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                                            placeholder="Full discussion transcript, objections raised, next steps..."
                                            value={activityForm.details}
                                            onChange={e => setActivityForm({ ...activityForm, details: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                                        <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '8px 20px' }}>
                                            {saving ? 'Logging...' : 'Log Activity'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Chronological Timeline */}
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><History size={16} /> Chronological Workspace Timeline</h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                    
                                    {/* Merge and sort Activities + AuditLogs chronologically */}
                                    {(() => {
                                        const events = [
                                            ...(lead.activities || []).map((a: any) => ({ ...a, eventType: 'activity', sortDate: new Date(a.occurredAt) })),
                                            ...(lead.auditLogs || []).map((l: any) => ({ ...l, eventType: 'audit', sortDate: new Date(l.createdAt) }))
                                        ].sort((x, y) => y.sortDate.getTime() - x.sortDate.getTime());

                                        if (events.length === 0) {
                                            return (
                                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                                    No activities logged yet.
                                                </div>
                                            );
                                        }

                                        return events.map((ev: any, idx: number) => {
                                            if (ev.eventType === 'activity') {
                                                return (
                                                    <div key={`act-${ev.id}`} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', minWidth: '110px' }}>
                                                            {ev.sortDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                                                            {ev.sortDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span>{ev.type === 'CALL' ? '📞' : ev.type === 'WHATSAPP' ? '💬' : ev.type === 'EMAIL' ? '✉️' : ev.type === 'MEETING' ? '🤝' : '⚙️'}</span>
                                                                <span>{ev.summary}</span>
                                                            </div>
                                                            {ev.details && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{ev.details}</div>}
                                                            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
                                                                Outcome: {ev.outcome || 'N/A'}
                                                                {ev.contact && ` • Contact: ${ev.contact.name} (${ev.contact.role || 'No Role'})`}
                                                                {` • Logged by: ${ev.performedBy}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div key={`audit-${ev.id}`} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', opacity: 0.8 }}>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', minWidth: '110px' }}>
                                                            {ev.sortDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                                                            {ev.sortDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                                🛡️ System Audit: <strong>{ev.action}</strong>
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                {ev.previousValue ? `Changed from "${ev.previousValue}" to "${ev.newValue}"` : ev.newValue}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="glass-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>Notes Cockpit</h3>
                                <button onClick={openAddNote} className="btn-icon primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    <Plus size={14} /> Add Note
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                {lead.notes && lead.notes.map((note: any) => (
                                    <div key={note.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                                        <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                            <span>By {note.author}</span>
                                            
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button onClick={() => openEditNote(note)} className="btn-icon" style={{ padding: '4px', minWidth: 'unset', border: 'none', background: 'none' }}>
                                                    <Edit size={12} />
                                                </button>
                                                <button onClick={() => handleDeleteNote(note.id)} className="btn-icon" style={{ padding: '4px', minWidth: 'unset', border: 'none', background: 'none', color: 'var(--status-lost)' }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!lead.notes || lead.notes.length === 0) && (
                                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                        No notes added yet. Note down critical guidelines or objections here.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT CONTROL SIDEBAR */}
                <div>
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '12px' }}>Sales Properties</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                {/* Pipeline Stage Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Pipeline Stage</label>
                                    <select 
                                        className="select-input"
                                        value={lead.pipelineStageId}
                                        onChange={e => handleQuickUpdate('pipelineStageId', e.target.value)}
                                    >
                                        {stages.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>CRM Lead Priority</label>
                                    <select 
                                        className="select-input"
                                        value={lead.priority || ''}
                                        onChange={e => handleQuickUpdate('priority', e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        <option value="A">Priority A (High)</option>
                                        <option value="B">Priority B (Medium)</option>
                                        <option value="C">Priority C (Low)</option>
                                    </select>
                                </div>

                                {/* Assignee Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Assigned Agent</label>
                                    <select 
                                        className="select-input"
                                        value={lead.assignedTo || ''}
                                        onChange={e => handleQuickUpdate('assignedTo', e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        <option value="sales.agent@bizrank.com">sales.agent@bizrank.com</option>
                                        <option value="sales.manager@bizrank.com">sales.manager@bizrank.com</option>
                                        <option value="admin@bizrank.com">admin@bizrank.com</option>
                                    </select>
                                </div>

                                {/* Developer Assignment Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Assigned Developer</label>
                                    <select 
                                        className="select-input"
                                        value={lead.developerId || ''}
                                        onChange={e => handleDeveloperUpdate(e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        {developers.map(dev => (
                                            <option key={dev.id} value={dev.id}>{dev.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Est. Deal Value Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Est. Deal Value ($)</label>
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign size={14} style={{ position: 'absolute', left: '8px', top: '11px', color: 'var(--text-muted)' }} />
                                        <input 
                                            type="number" 
                                            className="select-input" 
                                            style={{ paddingLeft: '24px' }}
                                            defaultValue={lead.estimatedValue}
                                            onBlur={e => handleQuickUpdate('estimatedValue', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Deals Panel */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Active Contract Deals</h4>
                                {(!lead.deals || !lead.deals.some((d: any) => d.status === 'OPEN')) && (
                                    <button onClick={() => setShowCreateDealModal(true)} className="hover-link" style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Plus size={10} /> Create Deal
                                    </button>
                                )}
                            </div>
                            
                            {lead.deals && lead.deals.map((deal: any) => (
                                <div key={deal.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '8px', borderLeft: deal.status === 'WON' ? '3px solid var(--status-won)' : deal.status === 'LOST' ? '3px solid var(--status-lost)' : '3px solid var(--accent-primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <div>
                                            <Link href={`/crm/deals/${deal.id}`} style={{ textDecoration: 'none', color: '#fff', fontWeight: 600, fontSize: '13px' }}>
                                                {deal.name || `Deal #${deal.id}`}
                                            </Link>
                                            {deal.expectedCloseDate && (
                                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    Expected: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ color: 'var(--status-won)', fontSize: '13px', display: 'block' }}>
                                                {formatDealCurrency(deal.value, deal.currency)}
                                            </strong>
                                            <span className={`badge badge-deal-${deal.status.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 4px', marginTop: '2px', display: 'inline-block' }}>
                                                {deal.status}
                                            </span>
                                        </div>
                                    </div>
                                    {deal.status === 'OPEN' && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                                            <button onClick={() => { setStatusModalDealId(deal.id); setStatusModalType('WON'); }} style={{ flex: 1, fontSize: '10px', padding: '4px', background: 'rgba(34,197,94,0.1)', color: 'var(--status-won)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '4px', cursor: 'pointer' }}>
                                                Mark Won
                                            </button>
                                            <button onClick={() => { setStatusModalDealId(deal.id); setStatusModalType('LOST'); }} style={{ flex: 1, fontSize: '10px', padding: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--status-lost)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', cursor: 'pointer' }}>
                                                Mark Lost
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!lead.deals || lead.deals.length === 0) && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.8, padding: '8px 0' }}>
                                    No active deal milestones.
                                </div>
                            )}
                        </div>

                        {/* Follow-Ups Panel */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Upcoming Follow-ups</h4>
                                <button onClick={openAddFollowUp} className="hover-link" style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Plus size={10} /> Schedule
                                </button>
                            </div>
                            {lead.followUps && lead.followUps.filter((f: any) => f.status === 'PENDING').slice(0, 3).map((fu: any) => {
                                const isOverdue = new Date(fu.dueAt) < new Date();
                                return (
                                    <div key={fu.id} style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', borderLeft: isOverdue ? '3px solid var(--status-lost)' : '3px solid var(--accent-primary)' }}>
                                        <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{fu.contact ? fu.contact.name : 'General Followup'}</span>
                                            {isOverdue && <span style={{ color: 'var(--status-lost)', fontSize: '9px', fontWeight: 'bold' }}>OVERDUE</span>}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={10} />
                                            <span>{new Date(fu.dueAt).toLocaleDateString()} at {new Date(fu.dueAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!lead.followUps || lead.followUps.filter((f: any) => f.status === 'PENDING').length === 0) && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.8 }}>No pending follow-ups scheduled.</div>
                            )}
                        </div>

                    </div>
                </div>

            </div>

            {/* CONTACTS FORM MODAL */}
            {showContactModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '450px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '16px' }}>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
                        <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Name *</label>
                                <input 
                                    type="text" 
                                    className="select-input" 
                                    required 
                                    value={contactForm.name} 
                                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Role / Designation</label>
                                <input 
                                    type="text" 
                                    className="select-input" 
                                    value={contactForm.role} 
                                    placeholder="e.g. Owner, Purchasing Manager"
                                    onChange={e => setContactForm({ ...contactForm, role: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</label>
                                <input 
                                    type="text" 
                                    className="select-input" 
                                    value={contactForm.phone} 
                                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    className="select-input" 
                                    value={contactForm.email} 
                                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>WhatsApp ID/Phone</label>
                                <input 
                                    type="text" 
                                    className="select-input" 
                                    value={contactForm.whatsapp} 
                                    onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Preferred Contact Method</label>
                                <select 
                                    className="select-input" 
                                    value={contactForm.preferredContactMethod} 
                                    onChange={e => setContactForm({ ...contactForm, preferredContactMethod: e.target.value })}
                                >
                                    <option value="EMAIL">EMAIL</option>
                                    <option value="PHONE">PHONE</option>
                                    <option value="WHATSAPP">WHATSAPP</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    id="isPrimaryCheck"
                                    checked={contactForm.isPrimary} 
                                    onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })} 
                                />
                                <label htmlFor="isPrimaryCheck" style={{ fontSize: '12px', cursor: 'pointer' }}>Mark as Primary Contact</label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                <button type="button" onClick={() => setShowContactModal(false)} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {saving ? 'Saving...' : 'Save Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* NOTES FORM MODAL */}
            {showNoteModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '16px' }}>{editingNote ? 'Edit Note' : 'Add Lead Note'}</h3>
                        <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Note Content *</label>
                                <textarea 
                                    className="select-input" 
                                    style={{ minHeight: '120px', fontFamily: 'inherit', resize: 'vertical' }}
                                    required 
                                    value={noteContent} 
                                    onChange={e => setNoteContent(e.target.value)} 
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                <button type="button" onClick={() => setShowNoteModal(false)} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {saving ? 'Saving...' : 'Save Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SCHEDULE FOLLOWUP MODAL */}
            {showFollowUpModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '16px' }}>Schedule Follow-up Task</h3>
                        <form onSubmit={handleSaveFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Associated Contact</label>
                                <select 
                                    className="select-input" 
                                    value={followUpForm.contactId}
                                    onChange={e => setFollowUpForm({ ...followUpForm, contactId: e.target.value })}
                                >
                                    <option value="">No Contact Mapping</option>
                                    {lead.contacts && lead.contacts.map((c: any) => (
                                        <option key={c.id} value={c.id.toString()}>
                                            {c.name} ({c.role || 'No Role'}) {c.isPrimary ? '⭐️ Primary' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

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
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {saving ? 'Scheduling...' : 'Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* COMPLETE FOLLOWUP MODAL */}
            {showCompleteModal && selectedFollowUp && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '450px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '16px' }}>Complete Follow-up Task</h3>
                        <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Interaction Outcome *</label>
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
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Interaction Log Summary Notes</label>
                                <textarea 
                                    className="select-input" 
                                    style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                                    placeholder="Brief outline of follow-up results..."
                                    required
                                    value={outcomeNotes}
                                    onChange={e => setOutcomeNotes(e.target.value)}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
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

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                <button type="button" onClick={() => setShowCompleteModal(false)} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {saving ? 'Completing...' : 'Complete Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESCHEDULE FOLLOWUP MODAL */}
            {showRescheduleModal && selectedFollowUp && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '380px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '16px' }}>Reschedule Follow-up</h3>
                        <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Select New Date</label>
                                <input 
                                    type="date" 
                                    required
                                    className="select-input" 
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Select New Time</label>
                                <input 
                                    type="time" 
                                    required
                                    className="select-input" 
                                    value={newTime}
                                    onChange={e => setNewTime(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {saving ? 'Rescheduling...' : 'Reschedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CANCEL FOLLOWUP MODAL */}
            {showCancelModal && selectedFollowUp && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '380px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', textAlign: 'center', padding: '24px' }}>
                        <AlertCircle size={32} style={{ color: 'var(--status-lost)', marginBottom: '12px' }} />
                        <h3 style={{ margin: '0 0 8px 0' }}>Cancel Follow-up?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>
                            Are you sure you want to cancel the scheduled follow-up? This interaction record remains in history as CANCELLED.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => setShowCancelModal(false)} className="btn-icon" style={{ padding: '6px 12px', width: '100px' }}>
                                Dismiss
                            </button>
                            <button type="button" onClick={handleCancelSubmit} disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px', width: '120px', background: 'var(--status-lost)' }}>
                                {saving ? 'Cancelling...' : 'Cancel Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE DEAL MODAL */}
            {showCreateDealModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '450px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Create Commercial Deal</h3>
                        <form onSubmit={handleCreateDeal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Deal Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Website redesign + SEO"
                                    className="select-input"
                                    value={dealForm.name}
                                    onChange={e => setDealForm({ ...dealForm, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Deal Value (INR) *</label>
                                <input 
                                    type="number" 
                                    required 
                                    min="0"
                                    placeholder="25000"
                                    className="select-input"
                                    value={dealForm.value}
                                    onChange={e => setDealForm({ ...dealForm, value: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Currency</label>
                                <select 
                                    className="select-input"
                                    value={dealForm.currency}
                                    onChange={e => setDealForm({ ...dealForm, currency: e.target.value })}
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Expected Close Date</label>
                                <input 
                                    type="date" 
                                    className="select-input"
                                    value={dealForm.expectedCloseDate}
                                    onChange={e => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
                                <textarea 
                                    className="select-input" 
                                    rows={3}
                                    placeholder="Provide deal-specific commercial context..."
                                    value={dealForm.description}
                                    onChange={e => setDealForm({ ...dealForm, description: e.target.value })}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <button type="button" onClick={() => setShowCreateDealModal(false)} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {saving ? 'Creating...' : 'Create Deal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DEAL STATUS QUICK TRANSITION MODAL */}
            {statusModalDealId && statusModalType && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>
                            {statusModalType === 'WON' ? 'Mark Deal as WON 🎉' : 'Mark Deal as LOST 😞'}
                        </h3>
                        <form onSubmit={handleQuickDealStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {statusModalType === 'LOST' ? (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Lost Reason *</label>
                                        <select 
                                            className="select-input" 
                                            value={dealLostReason} 
                                            onChange={e => setDealLostReason(e.target.value)}
                                        >
                                            <option value="PRICE">Price Too High</option>
                                            <option value="COMPETITOR">Competitor Chosen</option>
                                            <option value="NO_BUDGET">No Budget / Cashflow constraints</option>
                                            <option value="NOT_INTERESTED">Not Interested anymore</option>
                                            <option value="TIMING">Timing not right</option>
                                            <option value="NO_RESPONSE">No response / Ghosted</option>
                                            <option value="OTHER">Other Reason</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Lost Notes (Optional)</label>
                                        <textarea 
                                            className="select-input" 
                                            rows={2} 
                                            placeholder="Provide detail context on lost factors..."
                                            value={dealLostNotes}
                                            onChange={e => setDealLostNotes(e.target.value)}
                                            style={{ resize: 'none' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                                    Are you sure you want to mark this deal as Won? This transaction sets won timestamp and updates the parent lead stage to Closed Won.
                                </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <button type="button" onClick={() => { setStatusModalDealId(null); setStatusModalType(null); }} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className={`btn-icon ${statusModalType === 'WON' ? 'primary' : ''}`} style={{ padding: '6px 16px', background: statusModalType === 'WON' ? '' : 'rgba(239,68,68,0.2)', color: statusModalType === 'WON' ? '' : '#f87171' }}>
                                    {saving ? 'Saving...' : statusModalType === 'WON' ? 'Mark Won' : 'Mark Lost'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
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

function formatCurrency(val: number | null) {
    if (!val) return '$0';
    return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
