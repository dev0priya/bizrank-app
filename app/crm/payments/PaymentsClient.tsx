'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Coins, Search, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function PaymentsClient({ initialDeals }: { initialDeals: any[] }) {
  const [deals, setDeals] = useState<any[]>(initialDeals);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // 1. Calculate aggregated KPI cards using real deal records
  const totalRevenue = deals.filter(d => d.status === 'WON').reduce((sum, d) => sum + d.value, 0);
  const receivedAmount = totalRevenue; // WON deals represent received payments
  const pendingAmount = deals.filter(d => d.status === 'OPEN').reduce((sum, d) => sum + d.value, 0);
  
  const overdueAmount = deals
    .filter(d => d.status === 'OPEN' && d.expectedCloseDate && new Date(d.expectedCloseDate) < new Date())
    .reduce((sum, d) => sum + d.value, 0);

  // 2. Map deals to payment row records
  const paymentRows = deals.map(d => {
    const isWon = d.status === 'WON';
    const isOverdue = d.status === 'OPEN' && d.expectedCloseDate && new Date(d.expectedCloseDate) < new Date();
    
    let payStatus = 'Pending';
    if (isWon) payStatus = 'Paid';
    else if (isOverdue) payStatus = 'Overdue';

    return {
      id: d.id,
      customer: d.crmLead?.business?.business_name || 'Business Link',
      leadId: d.crmLeadId,
      invoiceName: d.name || `Deal Build ID #${d.id}`,
      total: d.value,
      paid: isWon ? d.value : 0,
      pending: isWon ? 0 : d.value,
      dueDate: d.expectedCloseDate || d.wonAt || d.createdAt,
      status: payStatus
    };
  });

  // 3. Filter payment list
  const filteredPayments = paymentRows.filter(p => {
    const matchesSearch = 
      p.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || 
      p.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Coins size={28} className="text-gradient" />
          <h1 style={{ margin: 0 }}>Payment tracking</h1>
        </div>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          Track collected contract revenues, expected pipeline billing schedules, and overdue invoices.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px' }}>Total Contract Revenue</span>
            <TrendingUp size={14} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px' }}>Total Received (Paid)</span>
            <CheckCircle2 size={14} style={{ color: 'var(--status-won)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--status-won)' }}>{formatCurrency(receivedAmount)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px' }}>Total Expected (Pending)</span>
            <Clock size={14} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{formatCurrency(pendingAmount)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px' }}>Overdue Receivables</span>
            <AlertCircle size={14} style={{ color: 'var(--status-lost)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--status-lost)' }}>{formatCurrency(overdueAmount)}</div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Search payments by business or deal name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
          />
        </div>
        
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 16px', background: '#111', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Payments list table */}
      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
        {filteredPayments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No payment transaction records found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Customer Business</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Deal Name</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Contract Amount</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Paid Amount</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Pending Balance</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Date Due</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Billing Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: idx === filteredPayments.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '13px' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <Link href={`/crm/leads/${p.leadId}`} style={{ fontWeight: 600, color: 'white', textDecoration: 'none' }} className="hover-link">
                      {p.customer}
                    </Link>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{p.invoiceName}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 500 }}>{formatCurrency(p.total)}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--status-won)' }}>{p.paid > 0 ? formatCurrency(p.paid) : '-'}</td>
                  <td style={{ padding: '14px 18px', color: p.pending > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{p.pending > 0 ? formatCurrency(p.pending) : '-'}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{new Date(p.dueDate).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: p.status === 'Paid' ? 'rgba(16,185,129,0.15)' : p.status === 'Overdue' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: p.status === 'Paid' ? '#10b981' : p.status === 'Overdue' ? '#ef4444' : '#f59e0b'
                    }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
