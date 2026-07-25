'use client';

import React, { useState } from 'react';
import { LayoutDashboard, DollarSign, Calendar, ExternalLink, Flag } from 'lucide-react';
import Link from 'next/link';

const STAGES = ['Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Closed Won', 'Closed Lost'];

export default function CRMClient({ initialDeals }: { initialDeals: any[] }) {
    const [deals, setDeals] = useState(initialDeals);
    const [draggedDealId, setDraggedDealId] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, id: number) => {
        setDraggedDealId(id);
        // Required for Firefox
        e.dataTransfer.setData('text/plain', id.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStage: string) => {
        e.preventDefault();
        if (!draggedDealId) return;

        // Optimistic Update
        const originalDeals = [...deals];
        setDeals(deals.map(d => d.id === draggedDealId ? { ...d, crm_status: targetStage } : d));

        try {
            const res = await fetch(`/api/businesses/${draggedDealId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crm_status: targetStage })
            });
            if (!res.ok) throw new Error('API Update Failed');
        } catch (error) {
            console.error('Failed to move deal', error);
            setDeals(originalDeals); // Revert on failure
        } finally {
            setDraggedDealId(null);
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'Lead': return 'rgba(59, 130, 246, 0.2)'; // Blue
            case 'Contacted': return 'rgba(168, 85, 247, 0.2)'; // Purple
            case 'Meeting Scheduled': return 'rgba(234, 179, 8, 0.2)'; // Yellow
            case 'Proposal Sent': return 'rgba(249, 115, 22, 0.2)'; // Orange
            case 'Closed Won': return 'rgba(34, 197, 94, 0.2)'; // Green
            case 'Closed Lost': return 'rgba(239, 68, 68, 0.2)'; // Red
            default: return 'var(--panel-bg)';
        }
    };

    const formatCurrency = (val: number | null) => {
        if (!val) return '$0';
        return '$' + val.toLocaleString();
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexShrink: 0 }}>
                <LayoutDashboard size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Sales Pipeline</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', flexShrink: 0 }}>
                Drag and drop businesses across stages. Dropping a card instantly updates the CRM database.
            </p>

            <div style={{ 
                display: 'flex', 
                gap: '16px', 
                overflowX: 'auto', 
                flex: 1,
                paddingBottom: '16px'
            }}>
                {STAGES.map(stage => {
                    const stageDeals = deals.filter(d => d.crm_status === stage);
                    const stageRevenue = stageDeals.reduce((sum, d) => sum + (d.revenue || 0), 0);

                    return (
                        <div 
                            key={stage}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
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
                                background: getStageColor(stage),
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ fontWeight: 600 }}>{stage}</div>
                                <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '12px' }}>
                                    {stageDeals.length}
                                </div>
                            </div>
                            
                            <div style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                Est. Value: {formatCurrency(stageRevenue)}
                            </div>

                            {/* Cards Container */}
                            <div style={{ 
                                flex: 1, 
                                overflowY: 'auto', 
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {stageDeals.map(deal => (
                                    <div 
                                        key={deal.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, deal.id)}
                                        style={{
                                            background: 'var(--panel-bg)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            cursor: 'grab',
                                            opacity: draggedDealId === deal.id ? 0.5 : 1,
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            transition: 'transform 0.1s'
                                        }}
                                        onDragEnd={() => setDraggedDealId(null)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.3 }}>{deal.business_name}</div>
                                            <Link href={`/business/${deal.id}`} style={{ color: 'var(--text-muted)' }}>
                                                <ExternalLink size={14} />
                                            </Link>
                                        </div>
                                        
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                            {deal.category?.name || 'No Category'}
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                                <DollarSign size={12} /> {deal.revenue ? deal.revenue.toLocaleString() : '0'}
                                            </span>
                                            
                                            {deal.priority && (
                                                <span className={`badge badge-priority-${deal.priority.toLowerCase()}`} style={{ fontSize: '10px' }}>
                                                    {deal.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {stageDeals.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                                        Drop deals here
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
