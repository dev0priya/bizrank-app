'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, MapPin, DollarSign, Calendar, Clock, 
  TrendingUp, Award, XCircle, User, ExternalLink, 
  Filter, ChevronLeft, ChevronRight, AlertCircle
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
    crmLead: {
        id: number;
        assignedTo: string | null;
        pipelineStage: { name: string };
        business: {
            business_name: string;
            google_category: string | null;
            city: { name: string } | null;
            state: { name: string } | null;
            category: { name: string } | null;
        };
        contacts: Array<{
            name: string;
            isPrimary: boolean;
        }>;
    };
}

interface DealsClientProps {
    categories: any[];
    states: any[];
    deals: Deal[];
    metrics: {
        wonRevenue: number;
        wonCount: number;
        openPipeline: number;
    };
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default function DealsClient({
    categories,
    states,
    deals,
    metrics,
    pagination
}: DealsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Filters local states
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [minValue, setMinValue] = useState(searchParams.get('minValue') || '');
    const [maxValue, setMaxValue] = useState(searchParams.get('maxValue') || '');
    const [closeFrom, setCloseFrom] = useState(searchParams.get('expectedCloseFrom') || '');
    const [closeTo, setCloseTo] = useState(searchParams.get('expectedCloseTo') || '');
    const [assignedTo, setAssignedTo] = useState(searchParams.get('assignedTo') || '');
    const [stateId, setStateId] = useState(searchParams.get('stateId') || '');
    const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');

    // Modal state
    const [transitionDeal, setTransitionDeal] = useState<Deal | null>(null);
    const [transitionType, setTransitionType] = useState<'WON' | 'LOST' | null>(null);
    const [lostReason, setLostReason] = useState('PRICE');
    const [lostNotes, setLostNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // CENTRAL MONETARY FORMATTER
    const formatCurrency = (val: number, curr: string = 'INR') => {
        return val.toLocaleString(curr === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    // Apply filters
    const handleApplyFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set('search', searchTerm);
        if (status) params.set('status', status);
        if (minValue) params.set('minValue', minValue);
        if (maxValue) params.set('maxValue', maxValue);
        if (closeFrom) params.set('expectedCloseFrom', closeFrom);
        if (closeTo) params.set('expectedCloseTo', closeTo);
        if (assignedTo) params.set('assignedTo', assignedTo);
        if (stateId) params.set('stateId', stateId);
        if (categoryId) params.set('categoryId', categoryId);
        params.set('page', '1'); // reset page

        router.push(`${pathname}?${params.toString()}`);
    }, [searchTerm, status, minValue, maxValue, closeFrom, closeTo, assignedTo, stateId, categoryId, router, pathname]);

    // Clear filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setStatus('');
        setMinValue('');
        setMaxValue('');
        setCloseFrom('');
        setCloseTo('');
        setAssignedTo('');
        setStateId('');
        setCategoryId('');
        router.push(pathname);
    };

    // Paginate helper
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    // Execute status transition API
    const handleStatusTransitionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transitionDeal || !transitionType) return;

        setSubmitting(true);
        try {
            const body: any = { status: transitionType };
            if (transitionType === 'LOST') {
                body.lostReason = `${lostReason} - ${lostNotes}`.trim();
            }

            const res = await fetch(`/api/crm/deals/${transitionDeal.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update deal status.');
            }

            setTransitionDeal(null);
            setTransitionType(null);
            setLostNotes('');
            router.refresh();
        } catch (error: any) {
            alert(error.message || 'Status transition failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* PAGE TITLE & REVENUE METRICS METADATA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                <div>
                    <h1 className="text-gradient" style={{ margin: 0, marginBottom: '4px' }}>Deal Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                        Track closed revenue, monitor open commercial contracts, and drive deal completions.
                    </p>
                </div>

                {/* CENTRAL STATS CARD */}
                <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 24px', flexWrap: 'wrap' }}>
                    <div style={{ paddingRight: '20px', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Won Revenue</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-won)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={16} /> {formatCurrency(metrics.wonRevenue, 'INR')}
                        </div>
                    </div>
                    <div style={{ paddingRight: '20px', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Won Deals</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{metrics.wonCount}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Open Pipeline</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {formatCurrency(metrics.openPipeline, 'INR')}
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="glass-panel" style={{ marginBottom: '24px', padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
                    
                    {/* Search */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Search deals</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                            <input 
                                type="text"
                                className="select-input"
                                placeholder="Deal or contact name..."
                                style={{ paddingLeft: '28px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Deal Status</label>
                        <select className="select-input" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="">All statuses</option>
                            <option value="OPEN">OPEN</option>
                            <option value="WON">WON</option>
                            <option value="LOST">LOST</option>
                        </select>
                    </div>

                    {/* Value filters */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Min Value (INR)</label>
                        <input 
                            type="number"
                            className="select-input"
                            placeholder="0"
                            value={minValue}
                            onChange={e => setMinValue(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Max Value (INR)</label>
                        <input 
                            type="number"
                            className="select-input"
                            placeholder="e.g. 50000"
                            value={maxValue}
                            onChange={e => setMaxValue(e.target.value)}
                        />
                    </div>

                    {/* Expected close range */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Close From</label>
                        <input 
                            type="date"
                            className="select-input"
                            value={closeFrom}
                            onChange={e => setCloseFrom(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Close To</label>
                        <input 
                            type="date"
                            className="select-input"
                            value={closeTo}
                            onChange={e => setCloseTo(e.target.value)}
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>State</label>
                        <select className="select-input" value={stateId} onChange={e => setStateId(e.target.value)}>
                            <option value="">All locations</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Category</label>
                        <select className="select-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                            <option value="">All categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Agent */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Assigned Agent</label>
                        <select className="select-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                            <option value="">All agents</option>
                            <option value="sales.agent@bizrank.com">sales.agent@bizrank.com</option>
                            <option value="sales.manager@bizrank.com">sales.manager@bizrank.com</option>
                            <option value="admin@bizrank.com">admin@bizrank.com</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={handleClearFilters} className="btn-icon" style={{ padding: '8px 12px', fontSize: '12px' }}>
                            Reset
                        </button>
                        <button onClick={handleApplyFilters} className="btn-icon primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* DEALS LISTING TABLE */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Deal Name</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Business Name</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Lead Stage</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Deal Value</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Status</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Expected Close</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Assigned Agent</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>Created</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map(deal => {
                                const primaryContact = deal.crmLead.contacts?.[0];
                                return (
                                    <tr key={deal.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                                        {/* Deal Name */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <Link href={`/crm/deals/${deal.id}`} style={{ textDecoration: 'none', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '13px' }}>
                                                {deal.name || `Deal #${deal.id}`}
                                            </Link>
                                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {deal.description || 'No description provided'}
                                            </span>
                                        </td>

                                        {/* Business */}
                                        <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: 500, color: '#fff' }}>{deal.crmLead.business.business_name}</div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                <MapPin size={10} /> {deal.crmLead.business.city?.name || 'India'}
                                            </span>
                                        </td>

                                        {/* Stage */}
                                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {deal.crmLead.pipelineStage.name}
                                        </td>

                                        {/* Value */}
                                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 'bold', color: 'var(--status-won)' }}>
                                            {formatCurrency(deal.value, deal.currency)}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span className={`badge badge-deal-${deal.status.toLowerCase()}`}>
                                                {deal.status}
                                            </span>
                                        </td>

                                        {/* Expected Close */}
                                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-main)' }}>
                                            {deal.expectedCloseDate ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                                                    {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>Not set</span>
                                            )}
                                        </td>

                                        {/* Assigned */}
                                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {deal.crmLead.assignedTo ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={12} />
                                                    {deal.crmLead.assignedTo.split('@')[0]}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                                            )}
                                        </td>

                                        {/* Created */}
                                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(deal.createdAt).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <Link href={`/crm/deals/${deal.id}`} className="card-action-btn" title="View workspace cockpit">
                                                    <ExternalLink size={12} />
                                                </Link>
                                                {deal.status === 'OPEN' && (
                                                    <>
                                                        <button 
                                                            onClick={() => { setTransitionDeal(deal); setTransitionType('WON'); }}
                                                            className="card-action-btn" 
                                                            style={{ background: 'rgba(34,197,94,0.05)', color: 'var(--status-won)' }}
                                                            title="Mark WON"
                                                        >
                                                            <Award size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setTransitionDeal(deal); setTransitionType('LOST'); }}
                                                            className="card-action-btn" 
                                                            style={{ background: 'rgba(239,68,68,0.05)', color: 'var(--status-lost)' }}
                                                            title="Mark LOST"
                                                        >
                                                            <XCircle size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {deals.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <AlertCircle size={40} style={{ display: 'block', margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
                                        <h3>No deals match the filters</h3>
                                        <p style={{ fontSize: '13px', margin: '4px 0 16px 0' }}>
                                            Adjust your search criteria or create a deal from a lead cockpit.
                                        </p>
                                        <button onClick={handleClearFilters} className="btn-icon">
                                            Reset Filters
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total deals)
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                disabled={pagination.page <= 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                                className="btn-icon" 
                                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>
                            <button 
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                                className="btn-icon" 
                                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* STATUS TRANSITION QUICK MODAL */}
            {transitionDeal && transitionType && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>
                            {transitionType === 'WON' ? 'Mark Deal as WON 🎉' : 'Mark Deal as LOST 😞'}
                        </h3>
                        
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                            <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{transitionDeal.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Business: {transitionDeal.crmLead.business.business_name}</span>
                                <strong style={{ color: 'var(--status-won)' }}>{formatCurrency(transitionDeal.value, transitionDeal.currency)}</strong>
                            </div>
                        </div>

                        <form onSubmit={handleStatusTransitionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {transitionType === 'LOST' && (
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
                                            rows={2} 
                                            placeholder="Provide detail context on why deal is lost..."
                                            value={lostNotes}
                                            onChange={e => setLostNotes(e.target.value)}
                                            style={{ resize: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            {transitionType === 'WON' && (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                                    This will mark the commercial deal value as won revenue, set won timestamp, and update the lead's pipeline stage to Closed Won.
                                </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <button type="button" onClick={() => { setTransitionDeal(null); setTransitionType(null); }} className="btn-icon" style={{ padding: '6px 12px' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className={`btn-icon ${transitionType === 'WON' ? 'primary' : ''}`} style={{ padding: '6px 16px', background: transitionType === 'WON' ? '' : 'rgba(239,68,68,0.2)', color: transitionType === 'WON' ? '' : '#f87171' }}>
                                    {submitting ? 'Updating...' : transitionType === 'WON' ? 'Mark Won' : 'Mark Lost'}
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
                .card-action-btn {
                    background: rgba(255,255,255,0.03);
                    color: var(--text-muted);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    padding: 6px;
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
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.01) !important;
                }
            `}</style>
        </div>
    );
}
