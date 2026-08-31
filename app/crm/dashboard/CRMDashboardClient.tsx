'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, Target, Award, Users, RefreshCw, Phone, 
  MessageSquare, Mail, Calendar, TrendingUp, Sparkles, Activity,
  ShieldAlert, Clock, Plus, Eye, ArrowRight, RotateCcw,
  AlertCircle, ChevronUp, ChevronDown, CheckCircle2, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f43f5e', '#64748b'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
} as const;

export default function CRMDashboardClient() {
  // Global Filters State
  const [range, setRange] = useState('30days');
  const [teamMember, setTeamMember] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [leadStatus, setLeadStatus] = useState('');

  // Dashboard Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting State for Team Performance
  const [sortField, setSortField] = useState('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch Dashboard Data from API
  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams({
      range,
      teamMember,
      leadSource,
      leadStatus
    });

    fetch(`/api/crm/dashboard?${params.toString()}`)
      .then(async res => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Unable to load dashboard data.');
        return payload;
      })
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Unable to load dashboard data.');
        setLoading(false);
      });
  };

  // Trigger Fetching on filter changes
  useEffect(() => {
    fetchDashboardData();
  }, [range, teamMember, leadSource, leadStatus]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setRange('30days');
    setTeamMember('');
    setLeadSource('');
    setLeadStatus('');
  };

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Handle Team Table Sorting
  const sortedTeamPerformance = useMemo(() => {
    if (!data?.teamPerformance) return [];
    const list = [...data.teamPerformance];
    list.sort((a: any, b: any) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return list;
  }, [data?.teamPerformance, sortField, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '24px', minHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Skeleton Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ width: '250px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '200px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </div>
        {/* Skeleton Grid */}
        <div className="skeleton-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{ height: '90px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
        {/* Skeleton Body Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', minHeight: '300px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '70vh', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px' }} className="glass-panel">
        <ShieldAlert size={48} color="var(--status-lost)" />
        <h3 style={{ margin: 0 }}>Error Loading Analytics</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary hover-lift ripple" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          <RefreshCw size={16} /> Retry loading
        </button>
      </div>
    );
  }

  const { metrics, charts, dropdowns } = data || { metrics: {}, charts: {}, dropdowns: { stages: [], users: [] } };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ padding: '0 4px 40px 4px' }}
    >
      {/* Styles Block to ensure full desktop-tablet-mobile responsiveness */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .dashboard-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .filters-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          align-items: flex-end;
          padding: 16px;
          margin-bottom: 24px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.4);
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
        }
        .filter-select {
          width: 100%;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          transition: border 0.2s ease;
        }
        .filter-select:focus {
          border-color: var(--accent-primary);
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .kpi-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 12px;
          height: 100px;
          position: relative;
          overflow: hidden;
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .kpi-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .kpi-value {
          font-size: 20px;
          font-weight: 750;
          color: var(--text-main);
          margin-top: 4px;
        }
        .kpi-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }
        .trend-badge {
          font-size: 10px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .trend-up {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }
        .trend-down {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .trend-neutral {
          background: rgba(148, 163, 184, 0.12);
          color: #94a3b8;
        }
        .charts-double-row {
          display: grid;
          grid-template-columns: 2fr 1.15fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .charts-equal-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .team-perf-card {
          margin-bottom: 24px;
          overflow: hidden;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .perf-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .perf-table th {
          padding: 12px 16px;
          color: var(--text-muted);
          font-weight: 600;
          border-bottom: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.1);
          cursor: pointer;
          user-select: none;
        }
        .perf-table th:hover {
          color: var(--text-main);
        }
        .perf-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-main);
        }
        .perf-table tr:hover td {
          background: rgba(255,255,255,0.01);
        }
        .attention-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .followup-card-item {
          padding: 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid var(--border-color);
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s, background 0.2s;
        }
        .followup-card-item:hover {
          transform: translateX(4px);
          background: rgba(255, 255, 255, 0.03);
        }
        .followup-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 12px;
          text-transform: uppercase;
        }
        .followup-overdue {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .followup-duetoday {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .followup-upcoming {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .activity-timeline-item {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
        }
        .activity-timeline-item::before {
          content: '';
          position: absolute;
          left: 17px;
          top: 36px;
          bottom: -16px;
          width: 2px;
          background: var(--border-color);
        }
        .activity-timeline-item:last-child::before {
          display: none;
        }
        .activity-icon-container {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          z-index: 5;
        }
        .activity-content {
          flex-grow: 1;
          padding-top: 4px;
        }
        .activity-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .activity-title {
          font-weight: 600;
          color: var(--text-main);
        }
        .activity-time {
          color: var(--text-muted);
        }
        .activity-lead-link {
          font-size: 11px;
          color: var(--accent-primary);
          text-decoration: none;
          font-weight: 500;
          margin-top: 2px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .activity-lead-link:hover {
          text-decoration: underline;
        }
        .activity-performer {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .quick-actions-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s ease;
          border: 1px solid var(--border-color);
          background: var(--panel-bg);
          color: var(--text-main);
        }
        .quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }
        .empty-state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 180px;
          padding: 20px;
          color: var(--text-muted);
          text-align: center;
        }
        .empty-state-text {
          font-size: 13px;
          margin-top: 8px;
        }
        
        /* Media Queries for Screen Breakpoints */
        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 992px) {
          .charts-double-row {
            grid-template-columns: 1fr;
          }
          .charts-equal-row {
            grid-template-columns: 1fr;
          }
          .attention-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-header-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .quick-actions-bar {
            width: 100%;
          }
          .quick-action-btn {
            flex-grow: 1;
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          .filters-panel {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* 1. Header Section */}
      <div className="dashboard-header-container">
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800 }}>CRM Sales Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Real-time analytics covering leads pipeline, active follow-ups, payment revenues, and sales team metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchDashboardData} 
            disabled={loading}
            className="hover-lift ripple" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 16px', 
              background: 'var(--panel-bg)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
            {loading ? 'Refreshing...' : 'Reload Data'}
          </button>
        </div>
      </div>

      {/* 2. Interactive Global Filters Panel */}
      <div className="glass-panel" style={{ padding: 0, marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCcw size={14} /> Filter Executive Dashboard
          </span>
          {(teamMember || leadSource || leadStatus || range !== '30days') && (
            <button 
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
        <div className="filters-panel">
          <div className="filter-group">
            <span className="filter-label">Date Range</span>
            <select className="filter-select" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="lastmonth">Last Month</option>
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Sales Team Member</span>
            <select className="filter-select" value={teamMember} onChange={(e) => setTeamMember(e.target.value)}>
              <option value="">All Team Members</option>
              {dropdowns?.users?.map((u: any) => (
                <option key={u.username} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Lead Source</span>
            <select className="filter-select" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
              <option value="">All Sources</option>
              <option value="Google Maps">Google Maps</option>
              <option value="Website">Website</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Cold Calling">Cold Calling</option>
              <option value="Manual">Manual</option>
              <option value="Referral">Referral</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Pipeline Stage</span>
            <select className="filter-select" value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)}>
              <option value="">All Stages</option>
              {dropdowns?.stages?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Top KPI Card Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="kpi-grid"
      >
        <KpiCard 
          title="Total Leads" 
          value={metrics.totalLeads} 
          icon={Users} 
          color="#3b82f6" 
          trend={metrics.totalLeadsTrend} 
          trendSuffix=" vs last period" 
        />
        <KpiCard 
          title="New Leads Today" 
          value={metrics.newLeadsToday} 
          icon={Sparkles} 
          color="#a855f7" 
          trend={null}
          trendSuffix="" 
          subtitle="Awaiting actions"
        />
        <KpiCard 
          title="Contacted" 
          value={metrics.contactedLeads} 
          icon={Phone} 
          color="#eab308" 
          trend={null}
          trendSuffix=""
          subtitle="Currently engaged"
        />
        <KpiCard 
          title="Interested" 
          value={metrics.interestedLeads} 
          icon={Target} 
          color="#f43f5e" 
          trend={null}
          trendSuffix=""
          subtitle="Active pipeline"
        />
        <KpiCard 
          title="Follow-ups Due" 
          value={metrics.followUpsDueCount} 
          icon={Calendar} 
          color="#f59e0b" 
          trend={null}
          trendSuffix=""
          subtitle={`${metrics.overdueFollowUpsCount} Overdue`}
          subtitleColor={metrics.overdueFollowUpsCount > 0 ? '#ef4444' : undefined}
        />
        <KpiCard 
          title="Proposals Sent" 
          value={metrics.proposalSentLeads} 
          icon={Mail} 
          color="#06b6d4" 
          trend={null}
          trendSuffix=""
          subtitle="Awaiting decision"
        />
        <KpiCard 
          title="Won Deals" 
          value={metrics.wonDealsCount} 
          icon={Award} 
          color="#10b981" 
          trend={metrics.wonDealsCountTrend}
          trendSuffix=" vs last period" 
        />
        <KpiCard 
          title="Lost Deals" 
          value={metrics.lostDealsCount} 
          icon={ShieldAlert} 
          color="#ef4444" 
          trend={metrics.lostDealsCountTrend}
          trendSuffix=" vs last period" 
        />
        <KpiCard 
          title="Total Revenue" 
          value={formatCurrency(metrics.wonRevenue)} 
          icon={TrendingUp} 
          color="#10b981" 
          trend={metrics.wonRevenueTrend}
          trendSuffix=" vs last period" 
        />
        <KpiCard 
          title="Pending Revenue" 
          value={formatCurrency(metrics.pendingRevenue)} 
          icon={DollarSign} 
          color="#6366f1" 
          trend={metrics.pendingRevenueTrend}
          trendSuffix=" vs last period" 
        />
      </motion.div>

      {/* 4. Chart Row 1: Leads Over Time & Lead Sources */}
      <div className="charts-double-row">
        <motion.section variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '18px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--accent-primary)" /> Leads Generated Over Time
          </h3>
          <div style={{ height: '280px' }}>
            {charts.leadsOverTime?.length === 0 ? (
              <EmptyState text="No lead registrations logged in this time range." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.leadsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#leadsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '18px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="var(--accent-secondary)" /> Lead Source Analytics
          </h3>
          <div style={{ height: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {charts.leadSourcesDistribution?.length === 0 ? (
              <EmptyState text="No source tracking tags loaded." />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '12px' }}>
                <div style={{ width: '45%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={charts.leadSourcesDistribution} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={50} 
                        outerRadius={75} 
                        paddingAngle={3} 
                        dataKey="count" 
                        nameKey="name"
                      >
                        {charts.leadSourcesDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '55%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '240px', paddingRight: '4px' }}>
                  {charts.leadSourcesDistribution.map((src: any, idx: number) => (
                    <div key={src.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{src.name}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <strong>{src.count}</strong> ({src.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {/* 5. Chart Row 2: Sales Funnel & Open Pipeline Value */}
      <div className="charts-equal-row">
        <motion.section variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '18px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#10b981" /> CRM Sales Funnel
          </h3>
          <div style={{ height: '280px' }}>
            {charts.salesFunnel?.length === 0 ? (
              <EmptyState text="Funnel analysis unavailable." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={charts.salesFunnel} margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="stageName" stroke="var(--text-main)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="var(--accent-secondary)" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'var(--text-main)', fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '18px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color="#8b5cf6" /> Open Pipeline Value by Stage
          </h3>
          <div style={{ height: '280px' }}>
            {charts.pipelineValueByStage?.length === 0 ? (
              <EmptyState text="No open pipeline deals tracked in this range." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.pipelineValueByStage} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="stageName" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', borderColor: 'var(--border-color)', borderRadius: '8px' }} formatter={(val: any) => [formatCurrency(Number(val || 0)), 'Value']} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.section>
      </div>

      {/* 6. Team Performance Section */}
      <motion.section variants={itemVariants} className="glass-panel team-perf-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--accent-primary)" /> Sales Team Member Performance
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click headers to sort table records</span>
        </div>
        
        <div className="table-responsive">
          {sortedTeamPerformance.length === 0 ? (
            <EmptyState text="No team member records found." />
          ) : (
            <table className="perf-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('name')}>
                    Name {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                  <th onClick={() => toggleSort('leads')} style={{ textAlign: 'center' }}>
                    Leads Assigned {sortField === 'leads' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                  <th onClick={() => toggleSort('contacted')} style={{ textAlign: 'center' }}>
                    Contacted {sortField === 'contacted' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                  <th onClick={() => toggleSort('interested')} style={{ textAlign: 'center' }}>
                    Interested {sortField === 'interested' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                  <th onClick={() => toggleSort('followUps')} style={{ textAlign: 'center' }}>
                    Follow-ups Due {sortField === 'followUps' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                  <th onClick={() => toggleSort('won')} style={{ textAlign: 'center' }}>
                    Won Deals {sortField === 'won' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                  <th onClick={() => toggleSort('conversion')} style={{ textAlign: 'center' }}>
                    Conversion Rate {sortField === 'conversion' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                  <th onClick={() => toggleSort('revenue')} style={{ textAlign: 'right' }}>
                    Revenue Generated {sortField === 'revenue' && (sortOrder === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTeamPerformance.map((member: any) => (
                  <tr key={member.name}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold' }}>{member.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.role}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{member.leads}</td>
                    <td style={{ textAlign: 'center' }}>{member.contacted}</td>
                    <td style={{ textAlign: 'center' }}>{member.interested}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: member.followUps > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                        {member.followUps}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', color: member.won > 0 ? '#10b981' : 'var(--text-muted)' }}>{member.won}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {member.conversion}%
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 650, color: member.revenue > 0 ? '#10b981' : 'var(--text-muted)' }}>
                      {formatCurrency(member.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.section>

      {/* 7. Today's Follow-ups & Recent Activities */}
      <div className="attention-grid">
        <motion.section variants={itemVariants} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '18px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#f59e0b" /> Today's CRM Follow-ups
          </h3>
          
          <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            {(!data?.todayFollowUps || data.todayFollowUps.length === 0) ? (
              <EmptyState text="Clear! No follow-up calls or meetings due today." />
            ) : (
              data.todayFollowUps.map((item: any) => {
                const isOverdue = item.status === 'OVERDUE';
                const badgeClass = isOverdue ? 'followup-overdue' : 'followup-duetoday';
                
                return (
                  <div key={item.id} className="followup-card-item">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`followup-badge ${badgeClass}`}>
                          {isOverdue ? '🔴 Overdue' : '🟠 Due Today'}
                        </span>
                        <strong style={{ fontSize: '13px' }}>{item.businessName}</strong>
                      </div>
                      
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>Contact: <strong>{item.contactName}</strong> ({item.contactPhone})</span>
                        <span>Assigned to: <strong>{item.owner}</strong></span>
                        <span>Lead Priority: <strong>{item.priority}</strong></span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: isOverdue ? '#ef4444' : 'var(--text-main)' }}>
                        {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(item.dueAt))}
                      </span>
                      <Link 
                        href={`/crm/leads/${item.leadId}`}
                        className="hover-lift"
                        style={{ 
                          fontSize: '11px', 
                          color: '#fff', 
                          background: 'rgba(59,130,246,0.2)', 
                          border: '1px solid rgba(59,130,246,0.3)', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          textDecoration: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontWeight: 500
                        }}
                      >
                        Action <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '18px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--accent-primary)" /> Recent Activity Log
          </h3>
          
          <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            {(!data?.recentActivities || data.recentActivities.length === 0) ? (
              <EmptyState text="No activity logs found." />
            ) : (
              <div style={{ paddingLeft: '6px' }}>
                {data.recentActivities.map((act: any) => {
                  let icon = <Activity size={14} color="#94a3b8" />;
                  if (act.type === 'CALL') icon = <Phone size={14} color="#3b82f6" />;
                  else if (act.type === 'WHATSAPP') icon = <MessageSquare size={14} color="#10b981" />;
                  else if (act.type === 'EMAIL') icon = <Mail size={14} color="#ec4899" />;
                  else if (act.type === 'MEETING' || act.type === 'DEMO') icon = <Calendar size={14} color="#eab308" />;
                  else if (act.type === 'PROPOSAL') icon = <Award size={14} color="#06b6d4" />;

                  return (
                    <div key={act.id} className="activity-timeline-item">
                      <div className="activity-icon-container">
                        {icon}
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-title">{act.summary}</span>
                          <span className="activity-time">
                            {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(act.occurredAt))}
                          </span>
                        </div>
                        {act.details && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {act.details}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span className="activity-performer">Logged by: {act.owner}</span>
                          <Link href={`/crm/leads/${act.leadId}`} className="activity-lead-link">
                            {act.businessName} <ArrowRight size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {/* 8. Quick Actions bar */}
      <motion.section variants={itemVariants} className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '14px', fontSize: '14px', fontWeight: 700 }}>Quick CRM Actions</h3>
        <div className="quick-actions-bar">
          <Link href="/crm/leads" className="quick-action-btn hover-lift">
            <Plus size={14} color="var(--accent-primary)" /> Create / Add Lead
          </Link>
          <Link href="/crm/leads" className="quick-action-btn hover-lift">
            <Eye size={14} color="var(--accent-primary)" /> View All CRM Leads
          </Link>
          <Link href="/crm/pipeline" className="quick-action-btn hover-lift">
            <TrendingUp size={14} color="var(--accent-secondary)" /> View Sales Pipeline Kanban
          </Link>
          <Link href="/crm/contacts" className="quick-action-btn hover-lift">
            <Users size={14} color="#10b981" /> View Customers & Contacts
          </Link>
        </div>
      </motion.section>
    </motion.div>
  );
}

// KPI Card Child Component
function KpiCard({ title, value, icon: Icon, color, trend, trendSuffix, subtitle, subtitleColor }: any) {
  const isTrend = trend !== null && trend !== undefined;
  
  return (
    <motion.div 
      variants={itemVariants} 
      className="glass-panel hover-lift kpi-card"
    >
      <div className="kpi-header">
        <div>
          <span className="kpi-title">{title}</span>
          <div className="kpi-value">{value}</div>
        </div>
        <div style={{ background: `${color}15`, padding: '8px', borderRadius: '10px', color }}>
          <Icon size={18} />
        </div>
      </div>
      
      {isTrend ? (
        <div className="kpi-footer">
          <span className={`trend-badge ${trend > 0 ? 'trend-up' : (trend < 0 ? 'trend-down' : 'trend-neutral')}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{trendSuffix}</span>
        </div>
      ) : (
        subtitle && (
          <div style={{ fontSize: '11px', color: subtitleColor || 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            {subtitle}
          </div>
        )
      )}
    </motion.div>
  );
}

// Helper component for Empty States
function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state-container">
      <AlertCircle size={24} color="var(--text-muted)" style={{ opacity: 0.6 }} />
      <span className="empty-state-text">{text}</span>
    </div>
  );
}
