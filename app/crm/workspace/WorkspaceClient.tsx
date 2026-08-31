'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Sparkles, Users, Calendar, Kanban, CheckSquare, Globe, 
  DollarSign, TrendingUp, AlertCircle, Clock, CheckCircle2,
  Phone, MessageSquare, Mail, ChevronRight, UserCheck, ShieldAlert,
  Search, SlidersHorizontal, AlertTriangle, Eye, RefreshCw,
  FolderMinus, FileText, Award
} from 'lucide-react';

export default function WorkspaceClient({ stages, initialSection = 'overview' }: { stages: any[], initialSection?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentSection, setCurrentSection] = useState(initialSection);
  const [activeUsername, setActiveUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  
  // Data State
  const [kpis, setKpis] = useState<any>(null);
  const [teamActivity, setTeamActivity] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any>({ calls: [], whatsapp: [], emails: [], meetings: [] });
  const [noResponseTracker, setNoResponseTracker] = useState<any[]>([]);
  const [contactAttempts, setContactAttempts] = useState<any[]>([]);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [followUpsList, setFollowUpsList] = useState<any[]>([]);

  // Follow up active visual tab
  const [followUpTab, setFollowUpTab] = useState<'overdue' | 'today' | 'upcoming' | 'completed'>('today');
  
  // Communication sub-tab filter
  const [commSubTab, setCommSubTab] = useState<'ALL' | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING'>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const username = localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com';
      const role = localStorage.getItem('bizrank_active_role') || 'ADMIN';
      setActiveUsername(username);
      setUserRole(role);
    }
  }, []);

  const loadWorkspaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeRole = localStorage.getItem('bizrank_active_role') || 'ADMIN';
      if (activeRole !== 'ADMIN' && activeRole !== 'MANAGER') {
        throw new Error('Access Denied. Only Admin/Owner role is authorized to view My Workspace.');
      }

      const headers: any = {
        'Content-Type': 'application/json',
        'x-user-role': activeRole,
        'x-user-username': localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com'
      };

      const params = new URLSearchParams({
        period,
        teamMember: selectedAgent
      });
      if (period === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const res = await fetch(`/api/crm/workspace-monitoring?${params.toString()}`, { headers });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || 'Failed to load monitoring workspace.');
      }

      const data = await res.json();
      setKpis(data.kpi);
      setTeamActivity(data.teamActivity || []);
      setFeeds(data.feeds || { calls: [], whatsapp: [], emails: [], meetings: [] });
      setNoResponseTracker(data.noResponseTracker || []);
      setContactAttempts(data.contactAttempts || []);
      setLiveFeed(data.liveFeed || []);
      setAlerts(data.alerts || []);
      setFollowUpsList(data.followUpsList || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      loadWorkspaceData();
    }
  }, [userRole, period, startDate, endDate, selectedAgent]);

  const handleSectionChange = (sectionName: string) => {
    setCurrentSection(sectionName);
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', sectionName);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Follow-up actions
  const handleCompleteFollowUp = async (fuId: number) => {
    try {
      const activeRole = localStorage.getItem('bizrank_active_role') || 'ADMIN';
      const res = await fetch(`/api/crm/follow-ups/${fuId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': activeRole,
          'x-user-username': localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com'
        },
        body: JSON.stringify({ status: 'COMPLETED', outcome: 'Completed from Workspace Dashboard' })
      });
      if (res.ok) {
        alert('Follow-up completed successfully.');
        loadWorkspaceData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRescheduleFollowUp = async (fuId: number) => {
    const nextDate = prompt('Enter next follow-up date and time (YYYY-MM-DDTHH:MM):', new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 16));
    if (!nextDate) return;
    try {
      const activeRole = localStorage.getItem('bizrank_active_role') || 'ADMIN';
      const res = await fetch(`/api/crm/follow-ups/${fuId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': activeRole,
          'x-user-username': localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com'
        },
        body: JSON.stringify({ dueAt: new Date(nextDate).toISOString() })
      });
      if (res.ok) {
        alert('Follow-up rescheduled successfully.');
        loadWorkspaceData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Client-side timezone safe date formatting to prevent hydration mismatches
  const formatDate = (dateStr: string) => {
    if (!mounted || !dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!mounted || !dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  const formatRecentActivityTime = (timeStr: string) => {
    if (!mounted || !timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '';
      return `— ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    } catch {
      return '';
    }
  };

  // Utility to safely retrieve values from nested dot-notation paths (e.g. 'crmLead.business.business_name')
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Client-side search filters across components
  const filterBySearch = (list: any[], nameField = 'businessName') => {
    if (!list) return [];
    if (!clientSearchQuery.trim()) return list;
    const query = clientSearchQuery.toLowerCase();
    return list.filter(item => {
      if (!item) return false;
      const bizVal = getNestedValue(item, nameField);
      const bizName = String(bizVal || '').toLowerCase();
      const leadId = String(item.id || item.leadId || '');
      const assigned = String(item.assignedTo || item.agent || '').toLowerCase();
      const method = String(item.lastContactMethod || '').toLowerCase();
      const status = String(item.status || '').toLowerCase();
      return bizName.includes(query) || leadId.includes(query) || assigned.includes(query) || method.includes(query) || status.includes(query);
    });
  };

  // Helper to categorize follow-ups
  const getFollowUpStatus = (dueAtStr: string) => {
    if (!dueAtStr) return 'UPCOMING';
    const due = new Date(dueAtStr);
    const now = new Date();
    
    if (due < now) return 'OVERDUE';
    
    const isToday = due.getDate() === now.getDate() &&
                    due.getMonth() === now.getMonth() &&
                    due.getFullYear() === now.getFullYear();
    if (isToday) return 'TODAY';
    
    return 'UPCOMING';
  };

  // Calculate status summaries
  const getStatusSummary = () => {
    const activeAttempts = filterBySearch(contactAttempts || []);
    return {
      replied: activeAttempts.filter(c => c && (c.responseStatus?.toLowerCase() === 'replied' || c.responseStatus?.toLowerCase() === 'connected')).length,
      interested: activeAttempts.filter(c => c && c.status === 'Interested').length,
      noResponse: activeAttempts.filter(c => c && c.status === 'No Response').length,
      followUpRequired: activeAttempts.filter(c => c && (c.status === 'Contacted' || c.status === 'Qualified')).length,
      notInterested: activeAttempts.filter(c => c && (c.status === 'Lost' || c.status === 'Closed Lost')).length
    };
  };

  const statusSummary = getStatusSummary();

  // Columns totals for overview matrices
  const getTeamTotals = () => {
    return (teamActivity || []).reduce((acc, t) => {
      acc.leadsContacted += t.leadsContacted || 0;
      acc.calls += t.calls || 0;
      acc.whatsapp += t.whatsapp || 0;
      acc.conversations += t.conversations || 0;
      acc.noResponse += t.noResponse || 0;
      acc.followUps += t.followUps || 0;
      acc.interested += t.interested || 0;
      acc.won += t.won || 0;
      acc.revenue += t.revenue || 0;
      acc.proposals += t.proposals || 0;
      return acc;
    }, {
      leadsContacted: 0,
      calls: 0,
      whatsapp: 0,
      conversations: 0,
      noResponse: 0,
      followUps: 0,
      interested: 0,
      won: 0,
      revenue: 0,
      proposals: 0
    });
  };

  const teamTotals = getTeamTotals();

  // Consolidate all communications into single chronological log array
  const getAllCommunications = () => {
    const callsLog = (feeds?.calls || []).map((c: any) => ({ ...c, type: 'CALL' }));
    const whatsappLog = (feeds?.whatsapp || []).map((w: any) => ({ ...w, type: 'WHATSAPP' }));
    const emailsLog = (feeds?.emails || []).map((e: any) => ({ ...e, type: 'EMAIL' }));
    const meetingsLog = (feeds?.meetings || []).map((m: any) => ({ ...m, type: 'MEETING' }));

    const combined = [...callsLog, ...whatsappLog, ...emailsLog, ...meetingsLog];
    return combined.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  };

  const allCommunications = getAllCommunications();

  // If user role is loaded and is not admin/owner
  if (userRole && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <ShieldAlert size={56} style={{ color: '#ef4444', marginBottom: '20px' }} />
        <h2 style={{ color: '#0f172a', marginBottom: '12px', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '24px' }}>
          This workspace is reserved exclusively for system administrators and managers to monitor team activities. Your role is registered as <strong style={{ color: '#2563eb' }}>{userRole}</strong>.
        </p>
        <Link href="/crm/dashboard" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none' }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ height: '40px', width: '300px', background: '#e2e8f0', borderRadius: '8px' }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} style={{ height: '90px', background: '#e2e8f0', borderRadius: '8px' }} className="skeleton" />
          ))}
        </div>
        <div style={{ height: '300px', background: '#e2e8f0', borderRadius: '8px' }} className="skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
        <h2 style={{ color: '#0f172a' }}>Workspace Monitoring Failed</h2>
        <p style={{ color: '#475569', marginBottom: '20px' }}>{error}</p>
        <button onClick={loadWorkspaceData} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600 }}>
          Retry Connection
        </button>
      </div>
    );
  }

  // Filtered array variables based on client side search query
  const activeNoResponse = filterBySearch(noResponseTracker || []);
  const activeFollowups = filterBySearch(followUpsList || [], 'crmLead.business.business_name');
  const activeAttempts = filterBySearch(contactAttempts || []);
  const activeLiveFeed = filterBySearch(liveFeed || []);
  const activeCommunications = filterBySearch(allCommunications || []);

  // Split pending vs completed followups for Section 4
  const overdueFollowups = activeFollowups.filter(f => f && getFollowUpStatus(f.dueAt) === 'OVERDUE');
  const todayFollowups = activeFollowups.filter(f => f && getFollowUpStatus(f.dueAt) === 'TODAY');
  const upcomingFollowups = activeFollowups.filter(f => f && getFollowUpStatus(f.dueAt) === 'UPCOMING');
  
  // Followups completed inside selected time range
  const completedFollowups = (feeds?.calls || [])
    .filter((c: any) => c && ((c.summary || '').toLowerCase().includes('followup') || (c.summary || '').toLowerCase().includes('follow-up')))
    .map((c: any) => ({
      id: c.id,
      crmLeadId: c.leadId,
      crmLead: { business: { business_name: c.businessName } },
      assignedTo: c.agent,
      dueAt: c.time,
      status: 'COMPLETED',
      priority: 'Normal'
    }));

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>My Workspace</h1>
          <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', fontWeight: 500 }}>Admin/Owner Monitoring Dashboard</p>
        </div>

        {/* CONTROLS BAR */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Date Filter */}
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            style={{ padding: '8px 12px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 500, outline: 'none' }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {period === 'custom' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                style={{ padding: '6px 10px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
              />
              <span style={{ fontSize: '12px', color: '#475569' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                style={{ padding: '6px 10px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
          )}

          {/* Team Member Filter */}
          <select 
            value={selectedAgent} 
            onChange={e => setSelectedAgent(e.target.value)} 
            style={{ padding: '8px 12px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 500, outline: 'none' }}
          >
            <option value="ALL">All Team Members</option>
            {teamActivity.map(t => (
              <option key={t.username} value={t.username}>{t.name}</option>
            ))}
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search Business, Lead ID, Phone..." 
              value={clientSearchQuery}
              onChange={e => setClientSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 30px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', width: '220px' }}
            />
          </div>

          {/* Refresh Button */}
          <button 
            onClick={loadWorkspaceData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* HORIZONTAL SECTION TABS SUB-NAVIGATION */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="no-scrollbar">
        {[
          { id: 'overview', label: '1. Overview' },
          { id: 'team-activity', label: '2. Team Activity' },
          { id: 'communication', label: '3. Communication' },
          { id: 'follow-ups', label: '4. Follow-ups' },
          { id: 'no-response', label: '5. No Response' },
          { id: 'contact-attempts', label: '6. Contact Attempts' },
          { id: 'recent-activity', label: '7. Recent Activity' },
          { id: 'team-performance', label: '8. Team Performance' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleSectionChange(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: currentSection === tab.id ? '#2563eb' : 'transparent',
              color: currentSection === tab.id ? '#fff' : '#475569',
              transition: 'background 0.15s, color 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE SECTION */}

      {/* ---------------- 1. OVERVIEW ---------------- */}
      {currentSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top KPIs Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Businesses Contacted</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{kpis?.totalLeadsContacted || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Calls Made</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{kpis?.totalCalls || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>WhatsApp Sent</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{kpis?.totalWhatsAppSent || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Replies Received</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{kpis?.totalWhatsAppReplied || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Conversations</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{kpis?.totalConversations || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>No Response</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{kpis?.noResponseCount || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Follow-ups Due</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706' }}>{kpis?.followUpsPending || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Deals Won</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{kpis?.dealsWonCount || 0}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Revenue</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{formatCurrency(kpis?.revenueGenerated || 0)}</div>
            </div>
          </div>

          {/* Attention Required section in overview */}
          {alerts.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>Attention Required</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                {alerts.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ fontSize: '12px', padding: '8px 10px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px', color: '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.message}</span>
                    <Link href={`/crm/leads/${item.leadId}`} style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>View</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Small Preview Panels Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Recent Activity Mini Feed */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', height: '300px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Recent Activity Feed</h4>
                <button onClick={() => handleSectionChange('recent-activity')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>View All</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }} className="no-scrollbar">
                {activeLiveFeed.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No activity found.</div> : activeLiveFeed.slice(0, 5).map(act => (
                  <div key={act.id} style={{ fontSize: '12px', padding: '6px', background: '#f8fafc', borderRadius: '4px' }}>
                    <strong>{act.agent || 'System'}</strong> {String(act.action || '').toLowerCase()} to {act.businessName || 'Business'}
                  </div>
                ))}
              </div>
            </div>

            {/* Followups Preview */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', height: '300px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Follow-ups Due</h4>
                <button onClick={() => handleSectionChange('follow-ups')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>View All</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }} className="no-scrollbar">
                {activeFollowups.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No followups due.</div> : activeFollowups.slice(0, 5).map(fu => (
                  <div key={fu.id} style={{ fontSize: '12px', padding: '6px', background: '#f8fafc', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{fu.crmLead?.business?.business_name || 'Business'}</span>
                    <span style={{ color: '#b45309', fontWeight: 600 }}>{getFollowUpStatus(fu.dueAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* No Response Preview */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', height: '300px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>No Response Tracker</h4>
                <button onClick={() => handleSectionChange('no-response')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>View All</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }} className="no-scrollbar">
                {activeNoResponse.length === 0 ? <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No leads tracked.</div> : activeNoResponse.slice(0, 5).map(n => (
                  <div key={n.id} style={{ fontSize: '12px', padding: '6px', background: '#fef2f2', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{n.businessName || 'Business'}</span>
                    <span style={{ color: '#991b1b', fontWeight: 700 }}>{n.attempts || 0} attempts</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- 2. TEAM ACTIVITY ---------------- */}
      {currentSection === 'team-activity' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Team Activity Statistics</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px' }}>Team Member</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Businesses Contacted</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Calls</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>WhatsApp Sent</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Replies</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>No Response</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Follow-ups Done</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Interested</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Deals Won</th>
                </tr>
              </thead>
              <tbody>
                {teamActivity.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No active team members resolved in database.</td>
                  </tr>
                ) : (
                  teamActivity.map(t => (
                    <tr key={t.username} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{t.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{t.leadsContacted || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{t.calls || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{t.whatsapp || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{t.conversations || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#dc2626' }}>{t.noResponse || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a' }}>{t.followUps || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 500 }}>{t.interested || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{t.won || 0}</td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                <tr style={{ background: '#f8fafc', fontWeight: 700, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                  <td style={{ padding: '14px 12px' }}>Total</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.leadsContacted}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.calls}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.whatsapp}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.conversations}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#dc2626' }}>{teamTotals.noResponse}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#16a34a' }}>{teamTotals.followUps}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#2563eb' }}>{teamTotals.interested}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#16a34a' }}>{teamTotals.won}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------- 3. COMMUNICATION ---------------- */}
      {currentSection === 'communication' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Communication Activity Timeline</h3>
            
            {/* Tab sub-filters for Communication */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'ALL', label: 'All Activities' },
                { id: 'CALL', label: '📞 Calls' },
                { id: 'WHATSAPP', label: '💬 WhatsApp' },
                { id: 'EMAIL', label: '✉️ Emails' },
                { id: 'MEETING', label: '🤝 Meetings' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setCommSubTab(sub.id as any)}
                  style={{
                    padding: '6px 12px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600,
                    background: commSubTab === sub.id ? '#f1f5f9' : '#fff',
                    color: '#334155'
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px' }}>Business</th>
                  <th style={{ padding: '12px' }}>Team Member</th>
                  <th style={{ padding: '12px' }}>Communication Type</th>
                  <th style={{ padding: '12px' }}>Date / Time</th>
                  <th style={{ padding: '12px' }}>Response / Outcome</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Lead Status</th>
                </tr>
              </thead>
              <tbody>
                {activeCommunications.filter(com => commSubTab === 'ALL' || com.type === commSubTab).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No communication activity logged in this view.</td>
                  </tr>
                ) : (
                  activeCommunications.filter(com => commSubTab === 'ALL' || com.type === commSubTab).map((com, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        <Link href={`/crm/leads/${com.leadId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{com.businessName}</Link>
                      </td>
                      <td style={{ padding: '12px' }}>{com.agent}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px',
                          background: com.type === 'CALL' ? '#eff6ff' : com.type === 'WHATSAPP' ? '#f0fdf4' : com.type === 'EMAIL' ? '#f1f5f9' : '#fffbeb',
                          color: com.type === 'CALL' ? '#2563eb' : com.type === 'WHATSAPP' ? '#16a34a' : com.type === 'EMAIL' ? '#475569' : '#d97706'
                        }}>
                          {com.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(com.time)}</td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{com.outcome || 'Sent'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <span className="badge badge-priority-b" style={{ fontSize: '11px' }}>Active</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------- 4. FOLLOW-UPS ---------------- */}
      {currentSection === 'follow-ups' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Follow-up Schedules</h3>
            
            {/* Visual categories switcher inside tab */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'overdue', label: `🔴 Overdue (${overdueFollowups.length})` },
                { id: 'today', label: `🟠 Today (${todayFollowups.length})` },
                { id: 'upcoming', label: `🟢 Upcoming (${upcomingFollowups.length})` },
                { id: 'completed', label: `✅ Completed (${completedFollowups.length})` }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setFollowUpTab(sub.id as any)}
                  style={{
                    padding: '6px 12px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600,
                    background: followUpTab === sub.id ? '#f1f5f9' : '#fff',
                    color: '#334155'
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px' }}>Business</th>
                  <th style={{ padding: '10px' }}>Assigned To</th>
                  <th style={{ padding: '10px' }}>Follow-up Date</th>
                  <th style={{ padding: '10px' }}>Priority</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Overdue */}
                {followUpTab === 'overdue' && (
                  overdueFollowups.length === 0 ? <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No overdue follow-ups.</td></tr> : overdueFollowups.map(fu => (
                    <tr key={fu.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{fu.crmLead?.business?.business_name || 'Business'}</Link>
                      </td>
                      <td style={{ padding: '10px' }}>{fu.assignedTo || 'Unassigned'}</td>
                      <td style={{ padding: '10px', color: '#dc2626', fontWeight: 600 }}>{formatDate(fu.dueAt)}</td>
                      <td style={{ padding: '10px' }}>{fu.crmLead?.priority || 'Normal'}</td>
                      <td style={{ padding: '10px', color: '#dc2626', fontWeight: 700 }}>🔴 OVERDUE</td>
                      <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#0f172a' }}>Open Lead</Link>
                        <button onClick={() => handleCompleteFollowUp(fu.id)} style={{ padding: '4px 8px', fontSize: '11px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#15803d', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
                        <button onClick={() => handleRescheduleFollowUp(fu.id)} style={{ padding: '4px 8px', fontSize: '11px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', color: '#b45309', cursor: 'pointer', fontWeight: 600 }}>Reschedule</button>
                      </td>
                    </tr>
                  ))
                )}

                {/* Today */}
                {followUpTab === 'today' && (
                  todayFollowups.length === 0 ? <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No follow-ups due today.</td></tr> : todayFollowups.map(fu => (
                    <tr key={fu.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{fu.crmLead?.business?.business_name || 'Business'}</Link>
                      </td>
                      <td style={{ padding: '10px' }}>{fu.assignedTo || 'Unassigned'}</td>
                      <td style={{ padding: '10px', color: '#b45309', fontWeight: 600 }}>{formatDate(fu.dueAt)}</td>
                      <td style={{ padding: '10px' }}>{fu.crmLead?.priority || 'Normal'}</td>
                      <td style={{ padding: '10px', color: '#b45309', fontWeight: 700 }}> 🟠 TODAY</td>
                      <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#0f172a' }}>Open Lead</Link>
                        <button onClick={() => handleCompleteFollowUp(fu.id)} style={{ padding: '4px 8px', fontSize: '11px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#15803d', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
                        <button onClick={() => handleRescheduleFollowUp(fu.id)} style={{ padding: '4px 8px', fontSize: '11px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', color: '#b45309', cursor: 'pointer', fontWeight: 600 }}>Reschedule</button>
                      </td>
                    </tr>
                  ))
                )}

                {/* Upcoming */}
                {followUpTab === 'upcoming' && (
                  upcomingFollowups.length === 0 ? <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No upcoming follow-ups.</td></tr> : upcomingFollowups.map(fu => (
                    <tr key={fu.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{fu.crmLead?.business?.business_name || 'Business'}</Link>
                      </td>
                      <td style={{ padding: '10px' }}>{fu.assignedTo || 'Unassigned'}</td>
                      <td style={{ padding: '10px', color: '#16a34a' }}>{formatDate(fu.dueAt)}</td>
                      <td style={{ padding: '10px' }}>{fu.crmLead?.priority || 'Normal'}</td>
                      <td style={{ padding: '10px', color: '#16a34a', fontWeight: 700 }}>🟢 UPCOMING</td>
                      <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#0f172a' }}>Open Lead</Link>
                        <button onClick={() => handleCompleteFollowUp(fu.id)} style={{ padding: '4px 8px', fontSize: '11px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#15803d', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
                        <button onClick={() => handleRescheduleFollowUp(fu.id)} style={{ padding: '4px 8px', fontSize: '11px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', color: '#b45309', cursor: 'pointer', fontWeight: 600 }}>Reschedule</button>
                      </td>
                    </tr>
                  ))
                )}

                {/* Completed */}
                {followUpTab === 'completed' && (
                  completedFollowups.length === 0 ? <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No completed follow-ups logged in range.</td></tr> : completedFollowups.map((fu: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{fu.crmLead?.business?.business_name || 'Business'}</Link>
                      </td>
                      <td style={{ padding: '10px' }}>{fu.assignedTo || 'Unassigned'}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{formatDateTime(fu.dueAt)}</td>
                      <td style={{ padding: '10px' }}>{fu.priority}</td>
                      <td style={{ padding: '10px', color: '#16a34a', fontWeight: 700 }}>✅ COMPLETED</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <Link href={`/crm/leads/${fu.crmLeadId}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#0f172a' }}>Open Lead</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------- 5. NO RESPONSE ---------------- */}
      {currentSection === 'no-response' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>No Response Tracking</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px' }}>Business</th>
                  <th style={{ padding: '12px' }}>Assigned To</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Calls</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>WhatsApp</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total Attempts</th>
                  <th style={{ padding: '12px' }}>Last Contact Date</th>
                  <th style={{ padding: '12px' }}>Last Method</th>
                  <th style={{ padding: '12px' }}>Next Follow-up</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeNoResponse.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No leads tracked in "No Response" status.</td>
                  </tr>
                ) : (
                  activeNoResponse.map(n => {
                    const attemptsDetail = activeAttempts.find(c => c && c.id === n.id);
                    return (
                      <tr key={n.id} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>
                          <Link href={`/crm/leads/${n.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{n.businessName || 'Business'}</Link>
                        </td>
                        <td style={{ padding: '12px' }}>{n.assignedTo}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{attemptsDetail?.calls || 0}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{attemptsDetail?.whatsapp || 0}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{n.attempts || 0}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{n.lastContactDate ? formatDateTime(n.lastContactDate) : 'Never'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>{n.lastContactMethod}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#d97706' }}>{n.nextFollowUp ? formatDate(n.nextFollowUp) : 'None Scheduled'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <span className="badge badge-priority-c" style={{ fontSize: '11px' }}>{n.status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------- 6. CONTACT ATTEMPTS ---------------- */}
      {currentSection === 'contact-attempts' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Contact Attempts Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px' }}>Business</th>
                  <th style={{ padding: '12px' }}>Assigned To</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Calls</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>WhatsApp</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Meetings</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total Attempts</th>
                  <th style={{ padding: '12px' }}>Last Contact</th>
                  <th style={{ padding: '12px' }}>Response</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Lead Status</th>
                </tr>
              </thead>
              <tbody>
                {activeAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No attempts found.</td>
                  </tr>
                ) : (
                  activeAttempts.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        <Link href={`/crm/leads/${c.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{c.businessName || 'Business'}</Link>
                      </td>
                      <td style={{ padding: '12px' }}>{c.assignedTo}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{c.calls || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{c.whatsapp || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{c.emails || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{c.meetings || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{c.totalAttempts || 0}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{c.lastContactDate ? formatDate(c.lastContactDate) : 'Never'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11px', color: (c.responseStatus || '').toLowerCase() === 'connected' || (c.responseStatus || '').toLowerCase() === 'replied' ? '#166534' : '#64748b', fontWeight: 600 }}>{c.responseStatus}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <span className={`badge ${c.status === 'Interested' ? 'badge-priority-a' : 'badge-priority-c'}`} style={{ fontSize: '11px' }}>{c.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------- 7. RECENT ACTIVITY ---------------- */}
      {currentSection === 'recent-activity' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Live Activity Feed</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeLiveFeed.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No activity found.
              </div>
            ) : (
              activeLiveFeed.map(act => (
                <div key={act.id} style={{
                  padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#ffffff',
                  fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b'
                }}>
                  <span>
                    <strong>{act.agent || 'System'}</strong> {String(act.action || '').toLowerCase()} to <Link href={`/crm/leads/${act.leadId}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>{act.businessName || 'Business'}</Link>
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                    {formatRecentActivityTime(act.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ---------------- 8. TEAM PERFORMANCE ---------------- */}
      {currentSection === 'team-performance' && (
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Team Performance Indicators</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                {/* Header row 1 */}
                <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '12px' }}></th>
                  <th colSpan={8} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '10px', color: '#475569', fontWeight: 800 }}>Activity metrics</th>
                  <th colSpan={5} style={{ padding: '8px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10px', color: '#475569', fontWeight: 800 }}>Sales conversions</th>
                </tr>
                {/* Header row 2 */}
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px' }}>Team Member</th>
                  
                  <th style={{ padding: '10px', textAlign: 'right' }}>Leads Assigned</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Contacted</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Calls</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>WhatsApp</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Replies</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Conversations</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Follow-ups Completed</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: '#dc2626' }}>No Response</th>

                  <th style={{ padding: '10px', textAlign: 'right', color: '#2563eb' }}>Interested</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Proposals</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#16a34a' }}>Deals Won</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Conversion Rate</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#16a34a' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {teamActivity.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No activity logged.</td>
                  </tr>
                ) : (
                  teamActivity.map(t => (
                    <tr key={t.username} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{t.name}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{t.leadsCount || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{t.leadsContacted || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{t.calls || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{t.whatsapp || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{t.conversations || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{t.conversations || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#16a34a' }}>{t.followUps || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: '#dc2626' }}>{t.noResponse || 0}</td>

                      <td style={{ padding: '10px', textAlign: 'right', color: '#2563eb', fontWeight: 500 }}>{t.interested || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{t.proposals || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{t.won || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{t.conversionRate || 0}%</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{formatCurrency(t.revenue || 0)}</td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                <tr style={{ background: '#f8fafc', fontWeight: 700, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                  <td style={{ padding: '14px 12px' }}>Total</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamActivity.reduce((sum, t) => sum + (t.leadsCount || 0), 0)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.leadsContacted}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.calls}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.whatsapp}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.conversations}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.conversations}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#16a34a' }}>{teamTotals.followUps}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', borderRight: '1px solid #e2e8f0', color: '#dc2626' }}>{teamTotals.noResponse}</td>

                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#2563eb' }}>{teamTotals.interested}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{teamTotals.proposals}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#16a34a' }}>{teamTotals.won}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    {teamTotals.leadsContacted > 0 ? Math.round((teamTotals.won / teamTotals.leadsContacted) * 100) : 0}%
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#16a34a' }}>{formatCurrency(teamTotals.revenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
