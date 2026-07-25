'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Building2, Calendar, PlayCircle, CheckCircle2, XCircle, 
  Target, Users, Globe, PhoneOff, MailX, BrainCircuit, Activity,
  Download, Plus, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function DashboardClient({ kpis, charts, recentJobs, recentBusinesses }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ paddingBottom: '40px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Dashboard Overview</h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/discovery" className="btn-primary hover-lift ripple" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--accent-primary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>
            <Plus size={18} /> New Discovery
          </Link>
          <button className="hover-lift ripple" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            <Download size={18} /> Export CSV
          </button>
          <Link href="/crm" className="hover-lift ripple" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', textDecoration: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <UserPlus size={18} /> Open CRM
          </Link>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="dashboard-grid" 
        style={{ marginBottom: '32px' }}
      >
        <KpiCard title="Total Businesses" value={kpis.totalBusinesses} icon={Building2} color="#3b82f6" />
        <KpiCard title="Collected Today" value={kpis.collectedToday} icon={Calendar} color="#10b981" />
        <KpiCard title="Running Jobs" value={kpis.runningJobs} icon={PlayCircle} color="#f59e0b" />
        <KpiCard title="Completed Jobs" value={kpis.completedJobs} icon={CheckCircle2} color="#10b981" />
        <KpiCard title="Failed Jobs" value={kpis.failedJobs} icon={XCircle} color="#ef4444" />
        <KpiCard title="Qualified Leads" value={kpis.qualifiedLeads} icon={Target} color="#8b5cf6" />
        <KpiCard title="Leads in CRM" value={kpis.leadsInCrm} icon={Users} color="#3b82f6" />
        <KpiCard title="No Website" value={kpis.noWebsite} icon={Globe} color="#ef4444" />
        <KpiCard title="No Phone" value={kpis.noPhone} icon={PhoneOff} color="#ef4444" />
        <KpiCard title="No Email" value={kpis.noEmail} icon={MailX} color="#ef4444" />
        <KpiCard title="Avg AI Score" value={kpis.avgAiScore} icon={BrainCircuit} color="#8b5cf6" />
        <KpiCard title="Avg Opp Score" value={kpis.avgOppScore} icon={Activity} color="#10b981" />
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}
      >
        <motion.div variants={itemVariants} className="glass-panel hover-lift" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '20px' }}>Businesses Collected (Last 30 Days)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.last30Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '20px' }}>Top Categories</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.topCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count">
                  {charts.topCategories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}
      >
        <motion.div variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '16px' }}>Recent Collection Jobs</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Job ID</th>
                  <th style={{ padding: '12px 8px' }}>Query</th>
                  <th style={{ padding: '12px 8px' }}>Found</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job: any) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px' }}>#{job.id}</td>
                    <td style={{ padding: '12px 8px' }}>{job.category} in {job.city}</td>
                    <td style={{ padding: '12px 8px' }}>{job._count.businesses}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${job.status === 'Completed' ? 'badge-priority-c' : job.status === 'Running' ? 'badge-priority-b' : 'badge-priority-a'}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel hover-lift">
          <h3 style={{ marginBottom: '16px' }}>Recently Discovered Businesses</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Business Name</th>
                  <th style={{ padding: '12px 8px' }}>Category</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px' }}>AI Score</th>
                </tr>
              </thead>
              <tbody>
                {recentBusinesses.map((biz: any) => (
                  <tr key={biz.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{biz.name}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{biz.category?.name || 'N/A'}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{biz.city?.name || 'N/A'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ color: biz.ai_score > 70 ? 'var(--status-won)' : 'inherit' }}>{biz.ai_score || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function KpiCard({ title, value, icon: Icon, color }: any) {
  return (
    <motion.div variants={itemVariants} className="glass-panel hover-lift" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          {title}
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700 }}>
          {value.toLocaleString()}
        </div>
      </div>
      <div style={{ background: `${color}20`, padding: '10px', borderRadius: '12px' }}>
        <Icon size={24} color={color} />
      </div>
    </motion.div>
  );
}
