import { prisma, safeDbQuery } from '../../lib/prisma';
import KanbanBoard from './KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const businesses = await safeDbQuery(() => prisma.business.findMany({ include: { category: true } })) || [];

  return (
    <div>
      <h1 className="text-gradient">Client Pipeline</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Drag and drop cards to update CRM status.</p>
      
      {/* Client Component for interactive DnD */}
      <KanbanBoard initialBusinesses={businesses} />
    </div>
  );
}
