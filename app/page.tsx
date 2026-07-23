import { prisma, safeDbQuery } from '../src/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const totalLeads = await safeDbQuery(() => prisma.business.count()) || 0;
  const qualifiedLeads = await safeDbQuery(() => prisma.business.count({ where: { crm_status: 'Qualified Lead' } })) || 0;
  const contactedLeads = await safeDbQuery(() => prisma.business.count({ where: { crm_status: 'Contacted' } })) || 0;
  const wonClients = await safeDbQuery(() => prisma.business.count({ where: { crm_status: 'Client Won' } })) || 0;
  const lostClients = await safeDbQuery(() => prisma.business.count({ where: { crm_status: 'Client Lost' } })) || 0;
  
  const totalRevenueData = await safeDbQuery(() => prisma.business.aggregate({
    _sum: { revenue: true },
    where: { crm_status: 'Client Won' }
  }));
  const revenue = totalRevenueData?._sum?.revenue || 0;

  const conversionRate = totalLeads > 0 ? ((wonClients / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <h1 className="text-gradient">CRM Overview</h1>
      
      <div className="dashboard-grid">
        <div className="glass-panel metric-card">
          <h3>Total Businesses</h3>
          <div className="value">{totalLeads}</div>
        </div>
        <div className="glass-panel metric-card">
          <h3>Qualified Leads</h3>
          <div className="value">{qualifiedLeads}</div>
        </div>
        <div className="glass-panel metric-card">
          <h3>Contacted</h3>
          <div className="value">{contactedLeads}</div>
        </div>
      </div>

      <h2 style={{ marginTop: '24px' }}>Performance</h2>
      <div className="dashboard-grid">
        <div className="glass-panel metric-card">
          <h3>Clients Won</h3>
          <div className="value" style={{ color: 'var(--status-won)' }}>{wonClients}</div>
        </div>
        <div className="glass-panel metric-card">
          <h3>Clients Lost</h3>
          <div className="value" style={{ color: 'var(--status-lost)' }}>{lostClients}</div>
        </div>
        <div className="glass-panel metric-card">
          <h3>Conversion Rate</h3>
          <div className="value">{conversionRate}%</div>
        </div>
        <div className="glass-panel metric-card">
          <h3>Total Revenue</h3>
          <div className="value">${revenue.toLocaleString()}</div>
        </div>
      </div>
      
      <h2 style={{ marginTop: '24px' }}>Recent Pipeline Activity</h2>
      <div className="glass-panel">
        <p style={{ color: 'var(--text-muted)' }}>Real-time event feed coming soon...</p>
      </div>
    </div>
  );
}
