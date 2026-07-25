import { prisma, safeDbQuery } from '../../../lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  
  const biz = await safeDbQuery(() => prisma.business.findUnique({
    where: { id },
    include: {
      timeline_events: { orderBy: { timestamp: 'desc' } },
      notes: { orderBy: { timestamp: 'desc' } },
      tasks: { orderBy: { dueDate: 'asc' } },
      category: true,
      city: true,
      state: true
    }
  }));

  if (!biz) return notFound();

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <h1 style={{ margin: 0 }}>{biz.business_name}</h1>
          <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white' }}>{biz.crm_status}</span>
          {biz.priority && <span className={`badge badge-priority-${biz.priority.charAt(biz.priority.length-1).toLowerCase()}`}>{biz.priority}</span>}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {biz.category?.name} • {biz.city?.name}, {biz.state?.name} • {biz.phone_number} • <a href={biz.website || '#'} target="_blank" style={{ color: 'var(--accent-primary)' }}>{biz.website || 'No Website'}</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Timeline & Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel">
            <h2>Activity Timeline</h2>
            {biz.timeline_events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No activity yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {biz.timeline_events.map(event => (
                  <div key={event.id} style={{ paddingLeft: '16px', borderLeft: '2px solid var(--accent-primary)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {event.timestamp.toLocaleString()} • {event.user}
                    </div>
                    <div style={{ fontWeight: 600 }}>{event.action}</div>
                    {event.notes && <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{event.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="glass-panel">
            <h2>Notes</h2>
            <textarea 
              placeholder="Add a new note..." 
              style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '12px' }} 
            />
            <button style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Save Note</button>
          </div>
        </div>

        {/* Right Column: Audit Stats & Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel">
            <h2>Website Audit</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Quality Score</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: biz.ai_score && biz.ai_score > 75 ? 'var(--status-won)' : 'var(--status-lost)' }}>
                {biz.ai_score !== null ? biz.ai_score : 'N/A'}
              </span>
            </div>
            
            <div style={{ fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Mobile Responsive</span>
                <span>{biz.audit_mobile_responsive ? '✅' : '❌'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>HTTPS</span>
                <span>{biz.audit_https ? '✅' : '❌'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Contact Visible</span>
                <span>{biz.audit_contact_visible ? '✅' : '❌'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Fast Speed</span>
                <span>{biz.audit_speed_score && biz.audit_speed_score >= 50 ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Follow-up Tasks</h2>
              <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>+ Add</button>
            </div>
            {biz.tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No pending tasks.</p>
            ) : (
              biz.tasks.map(task => (
                <div key={task.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500 }}>{task.content}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Due: {task.dueDate.toLocaleDateString()} • {task.priority} Priority
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
