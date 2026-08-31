'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Phone, Mail, Globe, DollarSign, Award, ExternalLink 
} from 'lucide-react';

export default function CustomersClient({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getPrimaryContact = (contacts: any[]) => {
    if (!contacts || contacts.length === 0) return null;
    const primary = contacts.find(c => c.isPrimary);
    return primary || contacts[0];
  };

  // Map database leads into the requested customers directory model
  const customerRows = customers.map(lead => {
    const primaryContact = getPrimaryContact(lead.contacts);
    const activeDeals = lead.deals.filter((d: any) => d.status === 'OPEN').length;
    const totalWonRevenue = lead.deals.filter((d: any) => d.status === 'WON').reduce((sum: number, d: any) => sum + d.value, 0);

    return {
      id: lead.id,
      businessName: lead.business?.business_name || 'Business Record',
      contactName: primaryContact?.name || 'No Contact Specified',
      phone: lead.business?.phone_number || primaryContact?.phone || '-',
      email: lead.business?.email || primaryContact?.email || '-',
      activeDealsCount: activeDeals,
      websiteStatus: lead.websiteStatus,
      websiteUrl: lead.websiteUrl,
      revenue: totalWonRevenue,
      status: lead.clientStatus || 'Closed Won'
    };
  });

  const filteredCustomers = customerRows.filter(c => {
    return (
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  });

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={28} className="text-gradient" />
          <h1 style={{ margin: 0 }}>Converted Customers</h1>
        </div>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          Overview of won accounts, active design builds, and lifetime values.
        </p>
      </div>

      {/* Filter panel */}
      <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Search customers by business name or contact person..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No converted customers matching criteria.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Business Account</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Primary Contact</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Active Deals</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Website Status</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Won Revenue</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, idx) => (
                <tr key={c.id} style={{ borderBottom: idx === filteredCustomers.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '13px' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <Link href={`/crm/leads/${c.id}`} style={{ fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none' }} className="hover-link">
                      {c.businessName} <ExternalLink size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                    </Link>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'white', fontWeight: 500 }}>{c.contactName}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={12} /> {c.phone}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} /> {c.email}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'white', textAlign: 'center' }}>
                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>
                      {c.activeDealsCount}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {c.websiteUrl ? (
                      <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--status-won)', textDecoration: 'none', fontWeight: 500 }}>
                        <Globe size={12} /> Completed <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {c.websiteStatus}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--status-won)', fontWeight: 600 }}>{formatCurrency(c.revenue)}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'rgba(16,185,129,0.15)',
                      color: '#10b981',
                      textTransform: 'uppercase'
                    }}>
                      {c.status}
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
