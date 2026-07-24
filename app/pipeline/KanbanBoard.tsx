'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, closestCorners, useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = [
  "New", "Collected", "Website Audited", "Qualified Lead", 
  "Redesign Pending", "Proposal Pending", "Contacted", 
  "Meeting Scheduled", "Negotiation", "Client Won", "Client Lost", "Archived"
];

function DraggableCard({ biz }: { biz: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: biz.id.toString(),
    data: biz
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="kanban-card">
      <div className="kanban-card-title">{biz.business_name}</div>
      <div className="kanban-card-meta">
        <span>{biz.category?.name || 'N/A'}</span>
        {biz.ai_score !== null && <span>Score: {biz.ai_score}</span>}
      </div>
    </div>
  );
}

function DroppableColumn({ id, title, businesses }: { id: string, title: string, businesses: any[] }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="kanban-column">
      <div className="kanban-header">
        <span>{title}</span>
        <span className="kanban-count">{businesses.length}</span>
      </div>
      <div style={{ minHeight: '100px' }}>
        {businesses.map(biz => (
          <DraggableCard key={biz.id} biz={biz} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ initialBusinesses }: { initialBusinesses: any[] }) {
  const [businesses, setBusinesses] = useState(initialBusinesses);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const businessId = parseInt(active.id.toString(), 10);
    const newStatus = over.id.toString();

    // Optimistic UI Update
    setBusinesses(prev => prev.map(biz => 
      biz.id === businessId ? { ...biz, crm_status: newStatus } : biz
    ));

    // Persist to DB
    await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: businessId, status: newStatus })
    });
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <DroppableColumn 
            key={col} 
            id={col} 
            title={col} 
            businesses={businesses.filter(b => b.crm_status === col)} 
          />
        ))}
      </div>
    </DndContext>
  );
}
