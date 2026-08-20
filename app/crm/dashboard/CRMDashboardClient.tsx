'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  DollarSign, Target, Award, Users, RefreshCw, Phone, 
  MessageSquare, Mail, Calendar, TrendingUp, Sparkles, Activity
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
} as const;

export default function CRMDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/crm/dashboard')
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
        console.error('Failed to load dashboard', err);
        setError(err.message || 'Unable to load dashboard data.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="spinner"></div>
        <div style={{ color: 'var(--text-muted)' }}>Loading Executive Analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ color: 'var(--text-muted)' }}>{error || 'No dashboard data found. Try creating some CRM Leads first.'}</div>
        <button onClick={fetchDashboardData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
    );
  }

  const { metrics, charts } = data;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ paddingBottom: '40px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0 }}>CRM Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>A connected view of business discovery, sales activity, pipeline, and revenue.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchDashboardData} className="hover-lift ripple" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            <RefreshCw size={16} /> Reload Metrics
          </button>
          <Link href="/crm/leads" className="btn-primary hover-lift ripple" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--accent-primary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>
            <Users size={16} /> Manage Leads
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="dashboard-grid" 
        style={{ marginBottom: '32px' }}
      >
        <KpiCard title="Total Leads" value={metrics.totalLeads} subtitle={`${metrics.newLeads} New Leads`} icon={Users} color="#3b82f6" />
        <KpiCard title="Hot Leads" value={metrics.hotLeads} subtitle="Priority A / Hot Tags" icon={Target} color="#ef4444" />
        <KpiCard title="Follow-ups Due" value={metrics.todayFollowUps} subtitle="Due today" icon={Calendar} color="#f59e0b" />
        <KpiCard title="Overdue Follow-ups" value={metrics.overdueFollowUps} subtitle="Requires attention" icon={Calendar} color="#ef4444" />
        <KpiCard title="Open Pipeline" value={`$${metrics.openPipelineValue.toLocaleString()}`} subtitle={`${metrics.openDealsCount} Active Deals`} icon={DollarSign} color="#8b5cf6" />
        <KpiCard title="Won Revenue" value={`$${metrics.wonRevenue.toLocaleString()}`} subtitle={`${metrics.wonDealsCount} Closed Won`} icon={Award} color="#10b981" />
        <KpiCard title="Conversion Rate" value={`${metrics.conversionRate.toFixed(1)}%`} subtitle="Won closed deals" icon={TrendingUp} color="#10b981" />
        <KpiCard title="Average Deal Value" value={`$${Math.round(metrics.averageDealValue).toLocaleString()}`} subtitle="Closed-won deals" icon={DollarSign} color="#3b82f6" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)', gap: '24px', marginBottom: '32px' }} className="dashboard-detail-grid">
        <section className="glass-panel">
          <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} color="#3b82f6" /> Sales Funnel</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {data.salesFunnel.map((step: any, index: number) => (
              <div key={step.label} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>{index + 1}</span>
                <div style={{ height: '10px', borderRadius: '999px', background: 'var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, metrics.businessesDiscovered ? (step.count / metrics.businessesDiscovered) * 100 : 0)}%`, minWidth: step.count ? '8px' : 0, background: 'var(--accent-gradient)', borderRadius: 'inherit' }} />
                </div>
                <span style={{ minWidth: '180px', fontSize: '13px' }}>{step.label} <strong style={{ marginLeft: '8px' }}>{step.count}</strong></span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel">
          <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={20} color="#10b981" /> Discovery Performance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <MiniMetric label="Businesses discovered" value={metrics.businessesDiscovered} />
            <MiniMetric label="Qualified" value={metrics.qualifiedBusinesses} />
            <MiniMetric label="Website opportunities" value={metrics.websiteOpportunities} />
            <MiniMetric label="Added to CRM" value={metrics.crmAdded} />
            <MiniMetric label="Conversion" value={`${metrics.discoveryConversionRate.toFixed(1)}%`} />
          </div>
        </section>
      </div>

      <section className="glass-panel" style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 20px' }}>Pipeline Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {data.pipelineSummary.map((stage: any) => <MiniMetric key={stage.stageId} label={stage.stageName} value={`${stage.leadCount} leads`} detail={`$${stage.pipelineValue.toLocaleString()} pipeline`} />)}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <DataList title="Today's Follow-ups" empty="No follow-ups are due today." rows={data.todayFollowUps} render={(item: any) => <Link href={`/crm/leads/${item.leadId}`} style={rowLinkStyle}><strong>{formatDateTime(item.dueAt)}</strong><span>{item.businessName}</span><span>{item.contactName || 'No contact'}</span><span>{item.owner || 'Unassigned'}</span><em style={{ color: item.status === 'OVERDUE' ? '#ef4444' : '#f59e0b' }}>{item.status === 'OVERDUE' ? 'Overdue' : 'Due today'}</em></Link>} />
        <DataList title="Hot Leads" empty="No hot leads yet." rows={data.hotLeads} render={(lead: any) => <Link href={`/crm/leads/${lead.id}`} style={rowLinkStyle}><strong>{lead.businessName}</strong><span>{lead.location || 'Location unavailable'}</span><span>Score {lead.leadScore} · {lead.websiteStatus}</span><span>{lead.nextFollowUp ? `Next: ${formatDateTime(lead.nextFollowUp)}` : 'No follow-up scheduled'}</span></Link>} />
        <DataList title="Recent Activities" empty="No recent activities." rows={data.recentActivities} render={(activity: any) => <Link href={`/crm/leads/${activity.leadId}`} style={rowLinkStyle}><strong>{activity.type}</strong><span>{activity.summary}</span><span>{activity.businessName}</span><span>{formatDateTime(activity.occurredAt)} · {activity.owner}</span></Link>} />
      </div>

      {/* Graphs */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' }}
      >
        {/* Deal Pipeline Value by Stage */}
        <motion.div variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="#8b5cf6" /> Open Pipeline Value by Stage
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.pipelineValueByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="stageName" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead stage distribution */}
        <motion.div variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#3b82f6" /> Lead Stages Distribution
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.leadsByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="stageName" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity counts by Type */}
        <motion.div variants={itemVariants} className="glass-panel hover-lift" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#10b981" /> Sales Touchpoints & Activities
          </h3>
          {charts.activitiesByType.length === 0 ? (
            <div style={{ display: 'flex', height: '250px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No sales activity logs found.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.activitiesByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="type">
                      {charts.activitiesByType.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {charts.activitiesByType.map((act: any, idx: number) => {
                  let IconComponent = Sparkles;
                  if (act.type === 'CALL') IconComponent = Phone;
                  else if (act.type === 'WHATSAPP') IconComponent = MessageSquare;
                  else if (act.type === 'EMAIL') IconComponent = Mail;

                  return (
                    <div key={act.type} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', background: `${COLORS[idx % COLORS.length]}20`, borderRadius: '8px', color: COLORS[idx % COLORS.length] }}>
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{act.type.toLowerCase()}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{act.count} logs</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <motion.div variants={itemVariants} className="glass-panel hover-lift" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          {title}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      </div>
      <div style={{ background: `${color}20`, padding: '10px', borderRadius: '12px' }}>
        <Icon size={24} color={color} />
      </div>
    </motion.div>
  );
}

const rowLinkStyle = { display: 'grid', gap: '4px', padding: '12px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', textDecoration: 'none', fontSize: '13px' } as const;

function DataList({ title, empty, rows, render }: any) {
  return <section className="glass-panel"><h3 style={{ margin: '0 0 8px' }}>{title}</h3>{rows.length ? rows.map(render) : <p style={{ margin: '20px 0', color: 'var(--text-muted)', fontSize: '14px' }}>{empty}</p>}</section>;
}

function MiniMetric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <div style={{ padding: '14px', border: '1px solid var(--border-color)', borderRadius: '10px' }}><div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{label}</div><strong style={{ display: 'block', fontSize: '20px', marginTop: '5px' }}>{value}</strong>{detail && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{detail}</span>}</div>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' }).format(new Date(value));
}
