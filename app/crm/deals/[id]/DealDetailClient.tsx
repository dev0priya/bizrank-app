'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Edit3, Award, XCircle, MapPin, 
  Calendar, Clock, User, ExternalLink, FileText, 
  AlertCircle, DollarSign, Loader2, List
} from 'lucide-react';

interface Deal {
    id: number;
    crmLeadId: number;
    name: string | null;
    description: string | null;
    value: number;
    currency: string;
    expectedCloseDate: Date | string | null;
    status: 'OPEN' | 'WON' | 'LOST';
    wonAt: Date | string | null;
    lostAt: Date | string | null;
    lostReason: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    crmLead: {
        id: number;
        assignedTo: string | null;
        priority: string | null;
        leadScore: number;
        pipelineStage: { name: string };
        business: {
            business_name: string;
            google_category: string | null;
            phone_number: string | null;
            email: string | null;
            city: { name: string } | null;
            state: { name: string } | null;
            category: { name: string } | null;
        };
        contacts: Array<{
            id: number;
            name: string;
            role: string | null;
            phone: string | null;
            email: string | null;
            isPrimary: boolean;
        }>;
        activities: Array<{
            id: number;
            type: any;
            summary: string;
            details: string | null;
            createdAt: Date | string;
        }>;
    };
}

interface AuditLog {
    id: number;
    performedBy: string;
    action: string;
    entityType: string;
    entityId: number;
    previousValue: string | null;
    newValue: string | null;
    createdAt: Date | string;
}

interface DealDetailProps {
    categories: any[];
    states: any[];
    initialDeal: Deal;
    initialAuditLogs: AuditLog[];
}

export default function DealDetailClient({
    categories,
    states,
    initialDeal,
    initialAuditLogs
}: DealDetailProps) {
    const router = useRouter();

    // Local states
    const [deal, setDeal] = useState<Deal>(initialDeal);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

    // Modals visibility
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState<'WON' | 'LOST' | null>(null);

    // Edit form states
    const [editForm, setEditForm] = useState({
        name: deal.name || '',
        value: deal.value.toString(),
        currency: deal.currency,
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
        description: deal.description || ''
    });

    // Status transition form states
    const [lostReason, setLostReason] = useState('PRICE');
    const [lostNotes, setLostNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Synchronize props when refreshed server-side
    useEffect(() => {
        setDeal(initialDeal);
        setAuditLogs(initialAuditLogs);
        setEditForm({
            name: initialDeal.name || '',
            value: initialDeal.value.toString(),
            currency: initialDeal.currency,
            expectedCloseDate: initialDeal.expectedCloseDate ? new Date(initialDeal.expectedCloseDate).toISOString().split('T')[0] : '',
            description: initialDeal.description || ''
        });
    }, [initialDeal, initialAuditLogs]);

    // Format money helper
    const formatCurrency = (val: number, curr: string = 'INR') => {
        return val.toLocaleString(curr === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    // Handle Edit Submit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/crm/deals/${deal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    value: editForm.value,
                    currency: editForm.currency,
                    expectedCloseDate: editForm.expectedCloseDate || null,
                    description: editForm.description
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update deal.');
            }

            setShowEditModal(false);
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Failed to edit deal');
        } finally {
            setSaving(false);
        }
    };

    // Handle status change Submit
    const handleStatusSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showStatusModal) return;

        setSaving(true);
        try {
            const body: any = { status: showStatusModal };
            if (showStatusModal === 'LOST') {
                body.lostReason = `${lostReason} - ${lostNotes}`.trim();
            }

            const res = await fetch(`/api/crm/deals/${deal.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update status.');
            }

            setShowStatusModal(null);
            setLostNotes('');
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Status update failed.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ paddingBottom: '60px' }}>
            
            {/* BREADCRUMB & BACK LINKS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Link href="/crm/deals" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <ArrowLeft size={14} /> Back to Deals
                </Link>
            </div>

            {/* DEAL TITLE HEADER & ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>{deal.name || `Deal #${deal.id}`}</h1>
                        <span className={`badge badge-deal-${deal.status.toLowerCase()}`}>
                            {deal.status}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                        Created on {new Date(deal.createdAt).toLocaleDateString()} • Associated with{' '}
                        <Link href={`/crm/leads/${deal.crmLeadId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                            {deal.crmLead.business.business_name} <ExternalLink size={11} style={{ display: 'inline' }} />
                        </Link>
                    </p>
                </div>

                {/* DEAL HEADER QUICK ACTIONS */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href={`/crm/leads/${deal.crmLeadId}`} className="btn-icon" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                        <List size={14} /> Open Lead Cockpit
                    </Link>

                    {deal.status === 'OPEN' && (
                        <>
                            <button onClick={() => setShowEditModal(true)} className="btn-icon" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Edit3 size={14} /> Edit Deal
                            </button>
                            <button onClick={() => setShowStatusModal('WON')} className="btn-icon primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Award size={14} /> Mark WON
                            </button>
                            <button onClick={() => setShowStatusModal('LOST')} className="btn-icon" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <XCircle size={14} /> Mark LOST
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* TWO-COLUMN GRID LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                
                {/* LEFT MAIN PANELS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Deal Overview panel */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Deal Overview</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Deal Value</span>
                                <strong style={{ fontSize: '20px', color: 'var(--status-won)' }}>{formatCurrency(deal.value, deal.currency)}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Expected Close Date</span>
                                <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>
                                    {deal.expectedCloseDate ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                                            {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>Not specified</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {deal.status === 'WON' && deal.wonAt && (
                            <div style={{ background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '12px', marginTop: '20px', fontSize: '13px', color: 'var(--status-won)' }}>
                                <strong>Won timestamp:</strong> {new Date(deal.wonAt).toLocaleString()}
                            </div>
                        )}

                        {deal.status === 'LOST' && deal.lostAt && (
                            <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '12px', marginTop: '20px', fontSize: '13px', color: '#f87171' }}>
                                <div style={{ marginBottom: '4px' }}><strong>Lost timestamp:</strong> {new Date(deal.lostAt).toLocaleString()}</div>
                                <div><strong>Lost Reason:</strong> {deal.lostReason || 'Not specified'}</div>
                            </div>
                        )}

                        {deal.description && (
                            <div style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Commercial Context</span>
                                <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                    {deal.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Lead & Business Details Panel */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Lead & Business Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Business Category</span>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                    {deal.crmLead.business.google_category || deal.crmLead.business.category?.name || 'Uncategorized'}
                                </div>
                            </div>

                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Location</span>
                                <div style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                                    {deal.crmLead.business.city?.name || 'India'}
                                </div>
                            </div>

                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Lead Score</span>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: deal.crmLead.leadScore >= 80 ? 'var(--status-won)' : 'var(--text-main)' }}>
                                    {deal.crmLead.leadScore}
                                </div>
                            </div>

                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Priority</span>
                                <div>
                                    {deal.crmLead.priority ? (
                                        <span className={`badge badge-priority-${deal.crmLead.priority.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                            Priority {deal.crmLead.priority}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pipeline Stage</span>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent-primary)' }}>
                                    {deal.crmLead.pipelineStage.name}
                                </div>
                            </div>

                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Assigned Agent</span>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                    {deal.crmLead.assignedTo || 'Unassigned'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN SIDEBAR PANELS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Primary Contacts list */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Lead Contacts</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {deal.crmLead.contacts.map(c => (
                                <div key={c.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <strong style={{ fontSize: '13px', color: '#fff' }}>{c.name}</strong>
                                        {c.isPrimary && <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '1px 6px', borderRadius: '4px' }}>Primary</span>}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Role: {c.role || 'No role'}</div>
                                    {c.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {c.phone}</div>}
                                    {c.email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email: {c.email}</div>}
                                </div>
                            ))}

                            {deal.crmLead.contacts.length === 0 && (
                                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                    No contacts registered on this lead.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline System Audit Trail */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Deal Audit History</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                            {auditLogs.map(log => (
                                <div key={log.id} style={{ fontSize: '11px', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '10px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                        <strong style={{ color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}>{log.action}</strong>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{log.newValue}</div>
                                    {log.previousValue && log.previousValue !== 'None' && (
                                        <div style={{ color: 'rgba(239,68,68,0.6)', textDecoration: 'line-through', fontSize: '10px' }}>Was: {log.previousValue}</div>
                                    )}
                                    <span style={{ color: 'var(--text-muted)', fontSize: '9px', display: 'block', marginTop: '2px' }}>By: {log.performedBy}</span>
                                </div>
                            ))}

                            {auditLogs.length === 0 && (
                                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                    No changes recorded yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT DEAL MODAL */}
            {showEditModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '450px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Edit Deal Context</h3>
                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Deal Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="select-input"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Deal Value (monetary bounds) *</label>
                                <input 
                                    type="number" 
                                    required 
                                    min="0"
                                    step="any"
                                    className="select-input"
                                    value={editForm.value}
                                    onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Currency</label>
                                <select 
                                    className="select-input"
                                    value={editForm.currency}
                                    onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
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
                                    value={editForm.expectedCloseDate}
                                    onChange={e => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
                                <textarea 
                                    className="select-input" 
                                    rows={3}
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-icon primary" style={{ padding: '6px 16px' }}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STATUS MODALS WON/LOST */}
            {showStatusModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>
                            {showStatusModal === 'WON' ? 'Mark Deal as WON 🎉' : 'Mark Deal as LOST 😞'}
                        </h3>

                        <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {showStatusModal === 'LOST' ? (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Lost Reason *</label>
                                        <select 
                                            className="select-input" 
                                            value={lostReason} 
                                            onChange={e => setLostReason(e.target.value)}
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
                                            rows={3} 
                                            placeholder="Provide detail context on lost factors..."
                                            value={lostNotes}
                                            onChange={e => setLostNotes(e.target.value)}
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
                                <button type="button" onClick={() => { setShowStatusModal(null); setLostNotes(''); }} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className={`btn-icon ${showStatusModal === 'WON' ? 'primary' : ''}`} style={{ padding: '6px 16px', background: showStatusModal === 'WON' ? '' : 'rgba(239,68,68,0.2)', color: showStatusModal === 'WON' ? '' : '#f87171' }}>
                                    {saving ? 'Saving...' : showStatusModal === 'WON' ? 'Mark Won' : 'Mark Lost'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .badge-deal-open {
                    background: rgba(59,130,246,0.08);
                    color: var(--accent-primary);
                    border: 1px solid rgba(59,130,246,0.15);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .badge-deal-won {
                    background: rgba(34,197,94,0.08);
                    color: var(--status-won);
                    border: 1px solid rgba(34,197,94,0.15);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .badge-deal-lost {
                    background: rgba(239,68,68,0.08);
                    color: var(--status-lost);
                    border: 1px solid rgba(239,68,68,0.15);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}
