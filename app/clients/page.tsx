import { prisma, safeDbQuery } from '../../src/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClientDirectoryPage() {
  const businesses = await safeDbQuery(() => prisma.business.findMany({
    orderBy: { crm_status: 'asc' },
    include: { category: true, city: true, state: true }
  })) || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="text-gradient" style={{ margin: 0 }}>Client Directory</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search businesses..." 
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', color: 'white' }}
          />
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px' }}>Business Name</th>
              <th style={{ padding: '16px' }}>Category</th>
              <th style={{ padding: '16px' }}>Score</th>
              <th style={{ padding: '16px' }}>Priority</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(biz => (
              <tr key={biz.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{biz.business_name}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{biz.category?.name || 'N/A'}</td>
                <td style={{ padding: '16px' }}>{biz.ai_score !== null ? biz.ai_score : 'N/A'}</td>
                <td style={{ padding: '16px' }}>
                  {biz.priority ? <span className={`badge ${biz.priority.includes('A') ? 'badge-priority-a' : biz.priority.includes('B') ? 'badge-priority-b' : 'badge-priority-c'}`}>{biz.priority}</span> : '-'}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px' 
                  }}>{biz.crm_status}</span>
                </td>
                <td style={{ padding: '16px' }}>
                  <Link href={`/clients/${biz.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    View Profile →
                  </Link>
                </td>
              </tr>
            ))}
            {businesses.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No clients found. Run the scraper to populate data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
