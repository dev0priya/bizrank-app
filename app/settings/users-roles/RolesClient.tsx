'use client';

import React from 'react';
import { Shield, Users } from 'lucide-react';

const ROLES = [
    { name: 'ADMIN', description: 'Full administrative access across settings, database resets, and users permissions.', privileges: 'All Operations + Settings' },
    { name: 'MANAGER', description: 'Can qualify leads, assign sales reps, manage tags, and configure pipeline stages.', privileges: 'Operational Management + Tag Config' },
    { name: 'SALES_AGENT', description: 'Assigned leads details tracking, activity timeline creation, and follow-ups execution.', privileges: 'Leads Actioning + Activity Logging' },
    { name: 'VIEWER', description: 'Read-only access across leads lists and Kanban pipeline. Settings menus are hidden.', privileges: 'Read-only Access' }
];

export default function RolesClient() {
    return (
        <div style={{ paddingBottom: '40px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Users & Security Roles</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Inspect access levels, roles definition, and security parameters.
                </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ROLES.map(role => (
                    <div 
                        key={role.name} 
                        style={{ 
                            padding: '16px', 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}
                    >
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={16} style={{ color: 'var(--accent-primary)' }} />
                                <strong style={{ fontSize: '15px' }}>{role.name}</strong>
                            </div>
                            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {role.description}
                            </p>
                        </div>
                        
                        <div style={{ fontSize: '12px', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                            {role.privileges}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
