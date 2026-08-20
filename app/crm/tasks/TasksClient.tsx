'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, Calendar, User, Clock, AlertCircle, 
  ExternalLink, Check, Trash2, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

const TASK_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'];

export default function TasksClient({ 
    initialTasks 
}: { 
    initialTasks: any[];
}) {
    const [tasks, setTasks] = useState(initialTasks);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, id: number) => {
        setDraggedTaskId(id);
        e.dataTransfer.setData('text/plain', id.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        const originalTasks = [...tasks];
        
        // Optimistic UI update
        setTasks(tasks.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));

        try {
            const res = await fetch(`/api/crm/follow-ups/${draggedTaskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus })
            });

            if (!res.ok) throw new Error('API update failed');
        } catch (err) {
            console.error('Failed to move task:', err);
            setTasks(originalTasks);
        } finally {
            setDraggedTaskId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this task follow-up?')) return;
        
        try {
            const res = await fetch(`/api/crm/follow-ups/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== id));
            } else {
                alert('Failed to delete task');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'To Do';
            case 'COMPLETED': return 'Completed';
            case 'CANCELLED': return 'Cancelled';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'rgba(245, 158, 11, 0.15)'; // Yellow
            case 'COMPLETED': return 'rgba(16, 185, 129, 0.15)'; // Green
            case 'CANCELLED': return 'rgba(239, 68, 68, 0.15)'; // Red
            default: return 'var(--panel-bg)';
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckSquare size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>CRM Tasks Board</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Manage sales tasks (follow-up reminders). Drag and drop cards to update task ticket status.
                </p>
            </div>

            <div style={{ 
                display: 'flex', 
                gap: '16px', 
                overflowX: 'auto', 
                flex: 1,
                paddingBottom: '16px'
            }}>
                {TASK_STATUSES.map(status => {
                    const statusTasks = tasks.filter(t => t.status === status);

                    return (
                        <div 
                            key={status}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                            style={{
                                flex: '0 0 300px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Column Header */}
                            <div style={{ 
                                padding: '16px', 
                                borderBottom: '1px solid var(--border-color)',
                                background: getStatusColor(status),
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ fontWeight: 600 }}>{getStatusLabel(status)}</div>
                                <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '12px' }}>
                                    {statusTasks.length}
                                </div>
                            </div>

                            {/* Cards list */}
                            <div style={{ 
                                flex: 1, 
                                overflowY: 'auto', 
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {statusTasks.map(task => {
                                    const isOverdue = status === 'PENDING' && new Date(task.dueAt) < new Date();
                                    
                                    return (
                                        <div 
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            style={{
                                                background: 'var(--panel-bg)',
                                                border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                padding: '16px',
                                                cursor: 'grab',
                                                opacity: draggedTaskId === task.id ? 0.5 : 1,
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                transition: 'transform 0.1s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <Link 
                                                    href={`/crm/leads/${task.crmLeadId}`} 
                                                    style={{ fontWeight: 600, fontSize: '14px', textDecoration: 'none', color: 'var(--accent-primary)', flex: 1 }}
                                                >
                                                    {task.crmLead?.business?.business_name || 'View Lead'}
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(task.id)}
                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', padding: '2px' }}
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                <Calendar size={12} />
                                                <span style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                                                    {new Date(task.dueAt).toLocaleDateString()} {isOverdue && '(Overdue)'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={10} /> {task.assignedTo || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {statusTasks.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                                        No tasks in this status
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
