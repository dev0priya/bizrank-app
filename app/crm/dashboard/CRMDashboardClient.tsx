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
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function CRMDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch('/api/crm/dashboard')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard', err);
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

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ color: 'var(--text-muted)' }}>No Analytics data found. Try creating some CRM Leads first.</div>
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
          <h1 style={{ margin: 0 }}>CRM Executive Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Real-time sales revenue, pipeline distribution, and team activities overview.</p>
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
        <KpiCard title="Today's Follow-ups" value={metrics.todayFollowUps} subtitle={`${metrics.overdueFollowUps} Overdue Follow-ups`} icon={Calendar} color="#f59e0b" />
        <KpiCard title="Open Pipeline" value={`$${metrics.openPipelineValue.toLocaleString()}`} subtitle={`${metrics.openDealsCount} Active Deals`} icon={DollarSign} color="#8b5cf6" />
        <KpiCard title="Won Revenue" value={`$${metrics.wonRevenue.toLocaleString()}`} subtitle={`${metrics.wonDealsCount} Closed Won`} icon={Award} color="#10b981" />
        <KpiCard title="Conversion Rate" value={`${metrics.conversionRate.toFixed(1)}%`} subtitle={`Avg Value: $${Math.round(metrics.averageDealValue).toLocaleString()}`} icon={TrendingUp} color="#10b981" />
      </motion.div>

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
