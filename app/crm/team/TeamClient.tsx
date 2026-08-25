'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, User, ArrowLeft, Globe, Phone, ExternalLink, Calendar, CheckCircle2, Edit2, Trash2, MessageSquare, Clock, Plus, RefreshCw, AlertCircle } from 'lucide-react';

interface TeamClientProps {
    initialUsers: any[];
    initialLeads: any[];
}

export default function TeamClient({ initialUsers, initialLeads }: TeamClientProps) {
    const [users, setUsers] = useState<any[]>(initialUsers);
    const [leads, setLeads] = useState<any[]>(initialLeads);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    
    // Developer Website completed / editing modal state
    const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
    const [editStatus, setEditStatus] = useState('ASSIGNED');
    const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
    
    // Developer Deletion state
    const [deletingLeadId, setDeletingLeadId] = useState<number | null>(null);

    // Swati Workspace state
    const [swatiTab, setSwatiTab] = useState('handoffs');
    const [swatiOpenLeadId, setSwatiOpenLeadId] = useState<number | null>(null);
    const [showAddCommForm, setShowAddCommForm] = useState(false);
    
    // Add Communication form state
    const [commMethod, setCommMethod] = useState('Call');
    const [commNotes, setCommNotes] = useState('');
    const [commStatus, setCommStatus] = useState('Follow-up Required');
    const [commFollowUpDate, setCommFollowUpDate] = useState('');
    const [commFollowUpTime, setCommFollowUpTime] = useState('');
    const [commFollowUpPurpose, setCommFollowUpPurpose] = useState('');
    const [commChannel, setCommChannel] = useState('');
    const [commInternalNotes, setCommInternalNotes] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync selected member from URL query param to allow persistent page refresh
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const userId = params.get('userId');
            if (userId) {
                setSelectedUserId(userId);
            } else {
                setSelectedUserId(null);
            }
        }
    }, []);

    const handleSelectUser = (userId: string | null) => {
        setSelectedUserId(userId);
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (userId) {
                params.set('userId', userId);
            } else {
                params.delete('userId');
            }
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState({}, '', newUrl);
        }
    };

    const fetchLatestData = async () => {
        try {
            const res = await fetch('/api/crm/leads', { cache: 'no-store' });
            const data = await res.json();
            if (Array.isArray(data)) {
                // Fetch user data as well
                const userRes = await fetch('/api/crm/users', { cache: 'no-store' });
                if (userRes.ok) {
                    const uData = await userRes.json();
                    setUsers(uData);
                }
                
                // Fetch full leads details with contacts and business details
                const leadsRes = await Promise.all(data.map(l => fetch(`/api/crm/leads/${l.id}`, { cache: 'no-store' }).then(r => r.json())));
                setLeads(leadsRes);
            }
        } catch (e) {
            console.error('Failed to reload data:', e);
        }
    };

    // Calculate current work counts dynamically from real database records (excluding archived)
    const getUserWorkCount = (user: any) => {
        if (user.role === 'DEVELOPER') {
            return leads.filter(l => l.developerId === user.id && !l.isArchived).length;
        } else if (user.role === 'COMMUNICATION') {
            return leads.filter(l => l.swatiId === user.id && l.handoffStatus === 'HANDED_OVER' && !l.isArchived).length;
        }
        return 0;
    };

    // Developer Workspace status update action
    const handleUpdateStatusAndUrl = async (leadId: number, status: string, websiteUrl?: string) => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/website-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, websiteUrl })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update website status');
            
            // Clear input and modal
            setEditingLeadId(null);
            setEditWebsiteUrl('');
            await fetchLatestData();
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Handoff to Swati Action
    const handleShareWithSwati = async (leadId: number) => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/handoff`, {
                method: 'POST'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to share with Swati');
            await fetchLatestData();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete/Archive Action (Developer own work)
    const handleDeleteLead = async (leadId: number) => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete website work');
            setDeletingLeadId(null);
            await fetchLatestData();
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Swati Log Communication Action
    const handleLogCommunication = async (leadId: number) => {
        setLoading(true);
        setErrorMsg('');
        try {
            let finalNotes = commNotes;
            if (commFollowUpPurpose || commChannel || commInternalNotes) {
                finalNotes += '\n';
                if (commFollowUpPurpose) finalNotes += `\nNext Follow-up Purpose: ${commFollowUpPurpose}`;
                if (commChannel) finalNotes += `\nCommunication Channel: ${commChannel}`;
                if (commInternalNotes) finalNotes += `\nInternal Notes: ${commInternalNotes}`;
            }

            const res = await fetch(`/api/crm/leads/${leadId}/communication`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: commMethod,
                    notes: finalNotes,
                    status: commStatus,
                    nextFollowUpDate: commFollowUpDate || null,
                    nextFollowUpTime: commFollowUpTime || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to log communication');
            
            // Reset form
            setCommNotes('');
            setCommFollowUpDate('');
            setCommFollowUpTime('');
            setCommFollowUpPurpose('');
            setCommChannel('');
            setCommInternalNotes('');
            setShowAddCommForm(false);
            
            await fetchLatestData();
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Date Helper Functions
    const isToday = (dateStr: string | Date) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    const isOverdue = (dateStr: string | Date) => {
        const d = new Date(dateStr);
        const now = new Date();
        return d < now && !isToday(d);
    };

    const isUpcoming = (dateStr: string | Date) => {
        const d = new Date(dateStr);
        const now = new Date();
        return d > now && !isToday(d);
    };

    // Filtered selected user
    const selectedUser = users.find(u => u.id === selectedUserId);
    const userLeads = leads.filter(l => {
        if (!selectedUser || l.isArchived) return false;
        if (selectedUser.role === 'DEVELOPER') {
            return l.developerId === selectedUser.id;
        } else if (selectedUser.role === 'COMMUNICATION') {
            return l.swatiId === selectedUser.id && l.handoffStatus === 'HANDED_OVER';
        }
        return false;
    });

    if (selectedUser) {
        const isDeveloper = selectedUser.role === 'DEVELOPER';

        if (isDeveloper) {
            // ==========================================
            // RENDERING DEVELOPER WORKSPACE
            // ==========================================
            const assignedCount = userLeads.filter(l => l.websiteStatus === 'ASSIGNED').length;
            const progressCount = userLeads.filter(l => l.websiteStatus === 'IN_PROGRESS').length;
            const completedCount = userLeads.filter(l => l.websiteStatus === 'COMPLETED').length;

            return (
                <div style={{ paddingBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button 
                            onClick={() => handleSelectUser(null)}
                            className="btn-icon ripple"
                            style={{ border: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%', color: 'var(--text-main)', cursor: 'pointer' }}
                            title="Back to team overview"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px' }}>{selectedUser.name}'s Workspace</h1>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                                Frontend Website Development Tasks
                            </p>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="glass-panel" style={{ borderLeft: '4px solid var(--status-lost)', marginBottom: '16px', color: 'var(--status-lost)', padding: '12px 16px', borderRadius: '8px' }}>
                            {errorMsg}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned Websites</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>{assignedCount}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '4px' }}>{progressCount}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--status-won)', marginTop: '4px' }}>{completedCount}</div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
                        {userLeads.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No website development tasks are currently assigned.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                                        <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Business details</th>
                                        <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Client phone</th>
                                        <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Assigned Date</th>
                                        <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Website Status</th>
                                        <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Website URL</th>
                                        <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userLeads.map((lead, idx) => {
                                        const primaryContact = lead.contacts?.find((c: any) => c.isPrimary) || lead.contacts?.[0];
                                        const clientPhone = lead.business?.phone_number || primaryContact?.phone || 'No phone number available';
                                        const businessName = lead.business?.business_name || 'Unnamed Business';
                                        const category = lead.business?.category?.displayName || lead.business?.category?.name || 'Uncategorized';
                                        const location = lead.business?.city ? `${lead.business.city.name}, ${lead.business.state?.name || ''}` : 'No location details';

                                        return (
                                            <tr key={lead.id} style={{ borderBottom: idx === userLeads.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '13px' }}>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{businessName}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{category} • {location}</div>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                                                        <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                                                        <span>{clientPhone}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={13} />
                                                        <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    <span style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        background: lead.websiteStatus === 'COMPLETED' ? 'rgba(16,185,129,0.15)' : lead.websiteStatus === 'IN_PROGRESS' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                                        color: lead.websiteStatus === 'COMPLETED' ? '#10b981' : lead.websiteStatus === 'IN_PROGRESS' ? 'var(--accent-primary)' : 'var(--text-muted)'
                                                    }}>
                                                        {lead.websiteStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 18px' }}>
                                                    {lead.websiteUrl ? (
                                                        <a 
                                                            href={lead.websiteUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
                                                        >
                                                            <Globe size={13} />
                                                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>{lead.websiteUrl}</span>
                                                            <ExternalLink size={11} />
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Website link not set</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        <Link href={`/crm/leads/${lead.id}`} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                                                            Open
                                                        </Link>
                                                        <button 
                                                            onClick={() => {
                                                                setEditingLeadId(lead.id);
                                                                setEditStatus(lead.websiteStatus);
                                                                setEditWebsiteUrl(lead.websiteUrl || '');
                                                            }}
                                                            className="btn-secondary" 
                                                            style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Edit2 size={11} /> Update Status
                                                        </button>
                                                        {lead.websiteStatus === 'COMPLETED' && lead.handoffStatus !== 'HANDED_OVER' && (
                                                            <button 
                                                                onClick={() => handleShareWithSwati(lead.id)}
                                                                className="btn-primary" 
                                                                style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--status-won)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                            >
                                                                Share with Swati
                                                            </button>
                                                        )}
                                                        {lead.handoffStatus === 'HANDED_OVER' && (
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                <CheckCircle2 size={13} style={{ color: '#10b981' }} /> Shared
                                                            </span>
                                                        )}
                                                        <button 
                                                            onClick={() => setDeletingLeadId(lead.id)}
                                                            className="btn-icon ripple"
                                                            style={{ border: 'none', color: 'var(--status-lost)', cursor: 'pointer', padding: '6px', background: 'transparent' }}
                                                            title="Delete work item"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Developer Unified Edit Status & website URL Modal */}
                    {editingLeadId !== null && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                        }}>
                            <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '24px', position: 'relative' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Update Website Work Management</h3>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Website Status</label>
                                    <select 
                                        value={editStatus}
                                        onChange={e => setEditStatus(e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.1)',
                                            border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)',
                                            outline: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        <option value="ASSIGNED" style={{ background: '#1e293b' }}>Assigned</option>
                                        <option value="IN_PROGRESS" style={{ background: '#1e293b' }}>In Progress</option>
                                        <option value="COMPLETED" style={{ background: '#1e293b' }}>Completed</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        Website URL {editStatus === 'COMPLETED' && <span style={{ color: 'var(--status-lost)' }}>*</span>}
                                    </label>
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com" 
                                        value={editWebsiteUrl}
                                        onChange={e => setEditWebsiteUrl(e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.1)',
                                            border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={() => { setEditingLeadId(null); setEditWebsiteUrl(''); }} 
                                        className="btn-secondary" 
                                        style={{ padding: '8px 16px' }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatusAndUrl(editingLeadId, editStatus, editWebsiteUrl)} 
                                        className="btn-primary" 
                                        style={{ padding: '8px 16px' }}
                                        disabled={loading || (editStatus === 'COMPLETED' && !editWebsiteUrl)}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Developer Delete Confirmation Modal */}
                    {deletingLeadId !== null && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                        }}>
                            <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '24px', position: 'relative', borderLeft: '4px solid var(--status-lost)' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Confirm Deletion</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                                    Are you sure you want to remove this website work?
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={() => setDeletingLeadId(null)} 
                                        className="btn-secondary" 
                                        style={{ padding: '8px 16px' }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteLead(deletingLeadId)} 
                                        className="btn-primary" 
                                        style={{ padding: '8px 16px', background: 'var(--status-lost)' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Removing...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            // ==========================================
            // RENDERING SWATI CHAUDHARY WORKSPACE
            // ==========================================
            
            // Calculate Swati Counts dynamically from real database records
            const newHandoffs = userLeads.filter(l => l.clientStatus === 'New' || (l.activities && l.activities.length === 0));
            const activeFollowups = userLeads.filter(l => l.followUps && l.followUps.some((f: any) => f.status === 'PENDING'));
            
            const todaysCallsLeads = activeFollowups.filter(l => l.followUps.some((f: any) => f.status === 'PENDING' && isToday(f.dueAt)));
            const overdueLeads = activeFollowups.filter(l => l.followUps.some((f: any) => f.status === 'PENDING' && isOverdue(f.dueAt)));
            const upcomingLeads = activeFollowups.filter(l => l.followUps.some((f: any) => f.status === 'PENDING' && isUpcoming(f.dueAt)));
            
            const interestedLeads = userLeads.filter(l => l.clientStatus === 'Interested');
            const notInterestedLeads = userLeads.filter(l => l.clientStatus === 'Not Interested');
            const noResponseLeads = userLeads.filter(l => l.clientStatus === 'No Response');
            const closedLeads = userLeads.filter(l => l.clientStatus === 'Closed');

            // Find current lead selected for detailing
            const openedLead = leads.find(l => l.id === swatiOpenLeadId);

            // Tab Filtering Logic
            let tabLeads = [];
            if (swatiTab === 'handoffs') tabLeads = newHandoffs;
            else if (swatiTab === 'calls') tabLeads = todaysCallsLeads;
            else if (swatiTab === 'interested') tabLeads = interestedLeads;
            else if (swatiTab === 'nurture') tabLeads = notInterestedLeads;
            else if (swatiTab === 'no_response') tabLeads = noResponseLeads;
            else if (swatiTab === 'closed') tabLeads = closedLeads;
            else if (swatiTab === 'followups') tabLeads = activeFollowups;

            return (
                <div style={{ paddingBottom: '40px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button 
                            onClick={() => handleSelectUser(null)}
                            className="btn-icon ripple"
                            style={{ border: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%', color: 'var(--text-main)', cursor: 'pointer' }}
                            title="Back to team overview"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px' }}>{selectedUser.name}</h1>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>
                                Client Communication
                            </p>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="glass-panel" style={{ borderLeft: '4px solid var(--status-lost)', marginBottom: '16px', color: 'var(--status-lost)', padding: '12px 16px', borderRadius: '8px' }}>
                            {errorMsg}
                        </div>
                    )}

                    {/* Summary Counts Banner */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', cursor: 'pointer', border: swatiTab === 'handoffs' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }} onClick={() => setSwatiTab('handoffs')}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>New Handoffs</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>{newHandoffs.length}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', cursor: 'pointer', border: swatiTab === 'calls' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }} onClick={() => setSwatiTab('calls')}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Calls</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '4px' }}>{todaysCallsLeads.length}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', cursor: 'pointer', border: swatiTab === 'followups' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }} onClick={() => setSwatiTab('followups')}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Follow-ups</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>{todaysCallsLeads.length}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', cursor: 'pointer', border: swatiTab === 'interested' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }} onClick={() => setSwatiTab('interested')}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Interested</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>{interestedLeads.length}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', cursor: 'pointer', border: swatiTab === 'followups' ? '1px solid var(--status-lost)' : '1px solid var(--border-color)' }} onClick={() => { setSwatiTab('followups'); }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Overdue</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--status-lost)', marginTop: '4px' }}>{overdueLeads.length}</div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
                        <button onClick={() => setSwatiTab('handoffs')} style={{ padding: '6px 12px', border: 'none', background: swatiTab === 'handoffs' ? 'rgba(255,255,255,0.08)' : 'transparent', color: swatiTab === 'handoffs' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>New Handoffs</button>
                        <button onClick={() => setSwatiTab('calls')} style={{ padding: '6px 12px', border: 'none', background: swatiTab === 'calls' ? 'rgba(255,255,255,0.08)' : 'transparent', color: swatiTab === 'calls' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>Today's Calls</button>
                        <button onClick={() => setSwatiTab('followups')} style={{ padding: '6px 12px', border: 'none', background: swatiTab === 'followups' ? 'rgba(255,255,255,0.08)' : 'transparent', color: swatiTab === 'followups' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>Follow-ups</button>
                        <button onClick={() => setSwatiTab('interested')} style={{ padding: '6px 12px', border: 'none', background: swatiTab === 'interested' ? 'rgba(255,255,255,0.08)' : 'transparent', color: swatiTab === 'interested' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>Interested</button>
                        <button onClick={() => setSwatiTab('no_response')} style={{ padding: '6px 12px', border: 'none', background: swatiTab === 'no_response' ? 'rgba(255,255,255,0.08)' : 'transparent', color: swatiTab === 'no_response' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>No Response</button>
                        <button onClick={() => setSwatiTab('nurture')} style={{ padding: '6px 12px', border: 'none', background: swatiTab === 'nurture' ? 'rgba(255,255,255,0.08)' : 'transparent', color: swatiTab === 'nurture' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>Not Interested / Nurture</button>
                        <button onClick={() => setSwatiTab('closed')} style={{ padding: '6px 12px', border: 'none', background: swatiTab === 'closed' ? 'rgba(255,255,255,0.08)' : 'transparent', color: swatiTab === 'closed' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>Closed</button>
                    </div>

                    {/* Calls specific banner */}
                    {swatiTab === 'calls' && tabLeads.length === 0 && (
                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                            No calls scheduled for today.
                        </div>
                    )}

                    {/* Swati Tab Main Content */}
                    {swatiTab === 'followups' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* OVERDUE FOLLOWUPS */}
                            <div className="glass-panel" style={{ padding: 0 }}>
                                <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--status-lost)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={15} /> Overdue Follow-ups ({overdueLeads.length})
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    {overdueLeads.length === 0 ? (
                                        <div style={{ padding: '20px', fontStyle: 'italic', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No overdue follow-ups.</div>
                                    ) : (
                                        <FollowUpsTable leads={overdueLeads} onOpen={setSwatiOpenLeadId} isOverdue={true} />
                                    )}
                                </div>
                            </div>

                            {/* TODAY FOLLOWUPS */}
                            <div className="glass-panel" style={{ padding: 0 }}>
                                <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.05)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={15} /> Today's Follow-ups ({todaysCallsLeads.length})
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    {todaysCallsLeads.length === 0 ? (
                                        <div style={{ padding: '20px', fontStyle: 'italic', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No follow-ups scheduled for today.</div>
                                    ) : (
                                        <FollowUpsTable leads={todaysCallsLeads} onOpen={setSwatiOpenLeadId} />
                                    )}
                                </div>
                            </div>

                            {/* UPCOMING FOLLOWUPS */}
                            <div className="glass-panel" style={{ padding: 0 }}>
                                <div style={{ padding: '14px 18px', background: 'rgba(59,130,246,0.05)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={15} /> Upcoming Follow-ups ({upcomingLeads.length})
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    {upcomingLeads.length === 0 ? (
                                        <div style={{ padding: '20px', fontStyle: 'italic', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No upcoming follow-ups.</div>
                                    ) : (
                                        <FollowUpsTable leads={upcomingLeads} onOpen={setSwatiOpenLeadId} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other Swati List Tables */}
                    {swatiTab !== 'followups' && (
                        <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
                            {tabLeads.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {swatiTab === 'handoffs' && 'No new client handoffs.'}
                                    {swatiTab === 'calls' && 'No calls scheduled for today.'}
                                    {swatiTab === 'interested' && 'No interested clients.'}
                                    {swatiTab === 'no_response' && 'No clients marked as No Response.'}
                                    {swatiTab === 'nurture' && 'No clients marked as Not Interested.'}
                                    {swatiTab === 'closed' && 'No closed clients.'}
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                                            <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Business Name</th>
                                            <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Client Phone</th>
                                            <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Website URL</th>
                                            <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Developer Name</th>
                                            <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Handoff Date</th>
                                            {swatiTab === 'calls' && <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Follow-up Time</th>}
                                            <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Current Status</th>
                                            <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tabLeads.map((lead, idx) => {
                                            const primaryContact = lead.contacts?.find((c: any) => c.isPrimary) || lead.contacts?.[0];
                                            const clientPhone = lead.business?.phone_number || primaryContact?.phone || 'No phone available';
                                            const activeFollowup = lead.followUps?.find((f: any) => f.status === 'PENDING');

                                            return (
                                                <tr key={lead.id} style={{ borderBottom: idx === tabLeads.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '13px' }}>
                                                    <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                                                        {lead.business?.business_name || 'Unnamed Business'}
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                                                            <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                                                            <span>{clientPhone}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        {lead.websiteUrl ? (
                                                            <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                                                                <Globe size={13} />
                                                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>{lead.websiteUrl}</span>
                                                                <ExternalLink size={11} />
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Website link not set</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                                                        {lead.developer?.name || 'Unknown'}
                                                    </td>
                                                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                                                        {lead.handoffDate ? new Date(lead.handoffDate).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    {swatiTab === 'calls' && (
                                                        <td style={{ padding: '14px 18px', color: '#f59e0b', fontWeight: 500 }}>
                                                            {activeFollowup ? new Date(activeFollowup.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <span style={{
                                                            padding: '3px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: lead.clientStatus === 'Interested' ? 'rgba(16,185,129,0.15)' : lead.clientStatus === 'Not Interested' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                            color: lead.clientStatus === 'Interested' ? '#10b981' : lead.clientStatus === 'Not Interested' ? 'var(--status-lost)' : '#f59e0b'
                                                        }}>
                                                            {lead.clientStatus}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            <button onClick={() => setSwatiOpenLeadId(lead.id)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>
                                                                Open
                                                            </button>
                                                            <a href={`tel:${clientPhone}`} className="btn-primary" style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                                                <Phone size={11} /> Call
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Detailed Open Client Communication Workspace Modal */}
                    {swatiOpenLeadId !== null && openedLead && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
                        }}>
                            <div className="glass-panel" style={{ maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '20px' }}>{openedLead.business?.business_name || 'Unnamed Business'}</h2>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Client Communication Workspace</span>
                                    </div>
                                    <button 
                                        onClick={() => { setSwatiOpenLeadId(null); setShowAddCommForm(false); }} 
                                        className="btn-secondary" 
                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                    >
                                        Close
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                    {/* Business & Website details */}
                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Information</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <div><strong>Category:</strong> {openedLead.business?.category?.displayName || openedLead.business?.category?.name || 'Uncategorized'}</div>
                                            <div><strong>Location:</strong> {openedLead.business?.city ? `${openedLead.business.city.name}, ${openedLead.business.state?.name || ''}` : 'No location details'}</div>
                                            <div><strong>Phone:</strong> {openedLead.business?.phone_number || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website Information</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <div>
                                                <strong>Website URL:</strong>{' '}
                                                {openedLead.websiteUrl ? (
                                                    <a href={openedLead.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                                        {openedLead.websiteUrl} <ExternalLink size={11} style={{ display: 'inline' }} />
                                                    </a>
                                                ) : (
                                                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Not set</span>
                                                )}
                                            </div>
                                            <div><strong>Developer:</strong> {openedLead.developer?.name || 'Unknown'}</div>
                                            <div><strong>Completed Date:</strong> {openedLead.websiteCompletedAt ? new Date(openedLead.websiteCompletedAt).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</h4>
                                        <div style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                                            {openedLead.clientStatus}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Follow-up</h4>
                                        <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                                            {openedLead.followUps?.find((f: any) => f.status === 'PENDING') ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600 }}>
                                                    <Clock size={14} />
                                                    <span>{new Date(openedLead.followUps.find((f: any) => f.status === 'PENDING').dueAt).toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No follow-up scheduled</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ADD COMMUNICATION BUTTON / FORM */}
                                <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                    <button 
                                        onClick={() => {
                                            setShowAddCommForm(true);
                                            setCommStatus(openedLead.clientStatus);
                                        }} 
                                        className="btn-primary" 
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                                    >
                                        <Plus size={16} /> Add Communication Log
                                    </button>
                                </div>

                                {/* COMMUNICATION HISTORY */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication History</h4>
                                    
                                    {openedLead.activities && openedLead.activities.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '12px' }}>
                                            No communication history recorded.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {openedLead.activities?.map((activity: any) => (
                                                <div key={activity.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                        <strong style={{ color: 'var(--accent-primary)' }}>{activity.summary}</strong>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            {new Date(activity.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: '0 0 8px 0', color: 'var(--text-main)', lineHeight: 1.4 }}>{activity.details}</p>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        Logged by: <strong>{activity.performedBy}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Redesigned Centered Add Communication Log Modal Overlay */}
                    {showAddCommForm && openedLead && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px'
                        }}>
                            <div className="glass-panel" style={{ 
                                maxWidth: '650px', 
                                width: '100%', 
                                maxHeight: '90vh', 
                                overflowY: 'auto', 
                                padding: '30px', 
                                position: 'relative',
                                background: '#151c2c',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                            }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Plus size={18} style={{ color: 'var(--accent-primary)' }} /> Log Client Communication
                                        </h3>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record the latest conversation details</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setShowAddCommForm(false);
                                            setCommFollowUpPurpose('');
                                            setCommChannel('');
                                            setCommInternalNotes('');
                                        }} 
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                                        title="Close"
                                    >
                                        &times;
                                    </button>
                                </div>

                                {/* Context Strip */}
                                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Client Context</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{openedLead.business?.business_name || 'Unnamed Business'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} /> {openedLead.business?.phone_number || 'No Phone'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: openedLead.websiteUrl ? '#10b981' : 'var(--text-muted)' }}>
                                                <Globe size={12} /> {openedLead.websiteUrl ? 'Website Available' : 'No Website'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* SECTION 1 — COMMUNICATION */}
                                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 14px 0', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication</h4>
                                        
                                        {/* Method select cards */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                Communication Method <span style={{ color: 'var(--status-lost)' }}>*</span>
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                                {[
                                                    { value: 'Call', label: '📞 Call' },
                                                    { value: 'WhatsApp', label: '💬 WhatsApp' },
                                                    { value: 'SMS', label: '✉ SMS' },
                                                    { value: 'Other', label: 'Other' }
                                                ].map(m => {
                                                    const isActive = commMethod === m.value;
                                                    return (
                                                        <button
                                                            key={m.value}
                                                            type="button"
                                                            onClick={() => setCommMethod(m.value)}
                                                            style={{
                                                                padding: '12px 6px',
                                                                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                                                                border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                                                borderRadius: '8px',
                                                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                                                fontWeight: isActive ? 600 : 500,
                                                                fontSize: '12px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                textAlign: 'center'
                                                            }}
                                                        >
                                                            {m.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Date</label>
                                                <input 
                                                    type="date" 
                                                    defaultValue={new Date().toISOString().split('T')[0]} 
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} 
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Time</label>
                                                <input 
                                                    type="time" 
                                                    defaultValue={new Date().toTimeString().split(' ')[0].slice(0, 5)} 
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2 — CLIENT RESPONSE */}
                                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 14px 0', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Response</h4>
                                        
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                                What did the client say? <span style={{ color: 'var(--status-lost)' }}>*</span>
                                            </label>
                                            <textarea 
                                                value={commNotes} 
                                                onChange={e => setCommNotes(e.target.value)} 
                                                rows={4} 
                                                placeholder="Write what the client said during the conversation..." 
                                                required
                                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontSize: '13px', lineHeight: 1.5 }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                Current Client Status <span style={{ color: 'var(--status-lost)' }}>*</span>
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                                                {[
                                                    { value: 'New', label: 'New' },
                                                    { value: 'Interested', label: 'Interested' },
                                                    { value: 'Follow-up Required', label: 'Follow-up Required' },
                                                    { value: 'No Response', label: 'No Response' },
                                                    { value: 'Not Interested', label: 'Not Interested' },
                                                    { value: 'Closed', label: 'Closed' }
                                                ].map(s => {
                                                    const isActive = commStatus === s.value;
                                                    return (
                                                        <button
                                                            key={s.value}
                                                            type="button"
                                                            onClick={() => setCommStatus(s.value)}
                                                            style={{
                                                                padding: '8px 4px',
                                                                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                                                                border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                                                borderRadius: '20px',
                                                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                                                fontWeight: isActive ? 600 : 500,
                                                                fontSize: '11px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                textAlign: 'center'
                                                            }}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3 — NEXT FOLLOW-UP */}
                                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 14px 0', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Follow-up</h4>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>📅 Follow-up Date</label>
                                                <input 
                                                    type="date" 
                                                    value={commFollowUpDate} 
                                                    onChange={e => setCommFollowUpDate(e.target.value)} 
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} 
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>🕐 Follow-up Time</label>
                                                <input 
                                                    type="time" 
                                                    value={commFollowUpTime} 
                                                    onChange={e => setCommFollowUpTime(e.target.value)} 
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }} 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Purpose of Follow-up</label>
                                            <input 
                                                type="text" 
                                                placeholder="What should be discussed next?" 
                                                value={commFollowUpPurpose} 
                                                onChange={e => setCommFollowUpPurpose(e.target.value)} 
                                                style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                                            />
                                        </div>
                                    </div>

                                    {/* SECTION 4 — NOTES */}
                                    <div style={{ paddingBottom: '10px' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Notes</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Communication Channel</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. Swati's Personal Phone" 
                                                    value={commChannel} 
                                                    onChange={e => setCommChannel(e.target.value)} 
                                                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Internal Notes</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Optional internal note..." 
                                                    value={commInternalNotes} 
                                                    onChange={e => setCommInternalNotes(e.target.value)} 
                                                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* FOOTER */}
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '10px' }}>
                                        <button 
                                            onClick={() => {
                                                setShowAddCommForm(false);
                                                setCommFollowUpPurpose('');
                                                setCommChannel('');
                                                setCommInternalNotes('');
                                            }} 
                                            className="btn-secondary" 
                                            style={{ padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => handleLogCommunication(openedLead.id)} 
                                            className="btn-primary" 
                                            style={{ padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                                            disabled={loading || !commNotes}
                                        >
                                            {loading ? 'Saving...' : 'Save Communication'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    }

    // RENDERING TEAM OVERVIEW VIEW (FOUR CARDS)
    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Team & Member Workspaces</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Real-time work assignments and team member cockpits.
                </p>
            </div>

            {/* Responsive grid of the four team members */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {users.map(user => {
                    const workCount = getUserWorkCount(user);
                    return (
                        <div 
                            key={user.id} 
                            className="glass-panel" 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between',
                                height: '220px',
                                padding: '20px',
                                background: 'var(--panel-bg)',
                                transition: 'transform 0.2s',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '50%', 
                                        background: 'var(--accent-gradient)', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' 
                                    }}>
                                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{user.name}</h3>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                            {user.role === 'DEVELOPER' ? 'Frontend Developer' : 'Client Communication'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Current Workload: <strong style={{ color: 'var(--text-main)' }}>{workCount}</strong> {user.role === 'DEVELOPER' ? 'websites' : 'handoffs'}
                                </div>
                            </div>

                            <button 
                                onClick={() => handleSelectUser(user.id)}
                                className="btn-primary" 
                                style={{ width: '100%', textAlign: 'center', display: 'block', padding: '10px', fontSize: '13px' }}
                            >
                                View Workspace
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Subcomponent for displaying lists of follow-ups
interface FollowUpsTableProps {
    leads: any[];
    onOpen: (leadId: number) => void;
    isOverdue?: boolean;
}

function FollowUpsTable({ leads, onOpen, isOverdue = false }: FollowUpsTableProps) {
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', fontSize: '12px' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Business Name</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Phone</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Follow-up Date</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Follow-up Time</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Current Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {leads.map((lead, idx) => {
                    const primaryContact = lead.contacts?.find((c: any) => c.isPrimary) || lead.contacts?.[0];
                    const phone = lead.business?.phone_number || primaryContact?.phone || 'No phone';
                    const activeFollowup = lead.followUps?.find((f: any) => f.status === 'PENDING');

                    return (
                        <tr key={lead.id} style={{ borderBottom: idx === leads.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '13px' }}>
                            <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-main)' }}>{lead.business?.business_name || 'Unnamed Business'}</td>
                            <td style={{ padding: '12px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                                    <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                                    <span>{phone}</span>
                                </div>
                            </td>
                            <td style={{ padding: '12px 18px', color: isOverdue ? 'var(--status-lost)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                                {activeFollowup ? new Date(activeFollowup.dueAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ padding: '12px 18px', color: isOverdue ? 'var(--status-lost)' : '#f59e0b', fontWeight: 500 }}>
                                {activeFollowup ? new Date(activeFollowup.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                            <td style={{ padding: '12px 18px' }}>
                                <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: lead.clientStatus === 'Interested' ? 'rgba(16,185,129,0.15)' : lead.clientStatus === 'Not Interested' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                    color: lead.clientStatus === 'Interested' ? '#10b981' : lead.clientStatus === 'Not Interested' ? 'var(--status-lost)' : '#f59e0b'
                                }}>
                                    {lead.clientStatus}
                                </span>
                            </td>
                            <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                                <button onClick={() => onOpen(lead.id)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>
                                    Open
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
