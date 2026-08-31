'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Globe, Clock, CheckCircle2, 
  ArrowRight, Search, User, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ProjectsClient({ 
    initialProjects 
}: { 
    initialProjects: any[];
}) {
    const [projects, setProjects] = useState(initialProjects);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [developerFilter, setDeveloperFilter] = useState('');
    const searchParams = useSearchParams();

    useEffect(() => {
        const paramDev = searchParams.get('developerUsername');
        if (paramDev) {
            setDeveloperFilter(paramDev);
        } else {
            setDeveloperFilter('');
        }

        const paramStatus = searchParams.get('status');
        if (paramStatus) {
            setStatusFilter(paramStatus);
        } else {
            setStatusFilter('ALL');
        }
    }, [searchParams]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ASSIGNED':
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)', 
                        padding: '4px 10px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content'
                    }}>
                        <Clock size={12} /> Assigned
                    </span>
                );
            case 'IN_PROGRESS':
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', 
                        padding: '4px 10px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content'
                    }}>
                        <Clock size={12} /> In Progress
                    </span>
                );
            case 'DEMO_READY':
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(168,85,247,0.15)', color: '#a855f7', 
                        padding: '4px 10px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content'
                    }}>
                        <Globe size={12} /> Demo Ready
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#10b981', 
                        padding: '4px 10px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content'
                    }}>
                        <CheckCircle2 size={12} /> Completed
                    </span>
                );
            default:
                return (
                    <span style={{ 
                        fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', 
                        padding: '4px 10px', borderRadius: '12px', fontWeight: 600, width: 'fit-content'
                    }}>
                        {status}
                    </span>
                );
        }
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = 
            p.business?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.developer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.websiteUrl && p.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || p.websiteStatus === statusFilter;

        const matchesDeveloper = !developerFilter || 
            p.developer?.username === developerFilter || 
            p.developer?.name === developerFilter ||
            p.assignedTo === developerFilter;

        return matchesSearch && matchesStatus && matchesDeveloper;
    });

    // Counts
    const developerProjects = projects.filter(p => {
        return !developerFilter || 
            p.developer?.username === developerFilter || 
            p.developer?.name === developerFilter ||
            p.assignedTo === developerFilter;
    });
    const totalCount = developerProjects.length;
    const assignedCount = developerProjects.filter(p => p.websiteStatus === 'ASSIGNED').length;
    const progressCount = developerProjects.filter(p => p.websiteStatus === 'IN_PROGRESS').length;
    const demoReadyCount = developerProjects.filter(p => p.websiteStatus === 'DEMO_READY').length;
    const completedCount = developerProjects.filter(p => p.websiteStatus === 'COMPLETED').length;

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Briefcase size={28} className="text-gradient" />
                    <h1 style={{ margin: 0 }}>Website Projects</h1>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Track assigned development sprints, project stages, and website deployment URLs.
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Projects</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalCount}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{assignedCount}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{progressCount}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Demo Ready</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#a855f7' }}>{demoReadyCount}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{completedCount}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                      type="text"
                      placeholder="Search projects by business, developer, URL..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                  />
                </div>
                
                <div>
                  <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      style={{ padding: '10px 16px', background: '#111', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                  >
                      <option value="ALL">All Stages</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DEMO_READY">Demo Ready</option>
                      <option value="COMPLETED">Completed</option>
                  </select>
                </div>
            </div>

            {/* Content list */}
            {filteredProjects.length === 0 ? (
                <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Briefcase size={36} style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: '#fff' }}>No Projects Found</h3>
                    <p style={{ margin: 0, fontSize: '13px' }}>
                        No website development projects currently match your query or filter stage.
                    </p>
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Business details</th>
                                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</th>
                                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Developer Assigned</th>
                                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Website Stage</th>
                                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Deployed URL</th>
                                <th style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>Date Updates</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(proj => (
                                <tr key={proj.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                            <Link href={`/crm/leads/${proj.id}`} style={{ color: '#fff', textDecoration: 'none' }} className="hover-link">
                                                {proj.business?.business_name || 'Unnamed Business'}
                                            </Link>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {proj.business?.category?.displayName || proj.business?.category?.name || 'Uncategorized'} • {proj.business?.city?.name || 'Unknown Location'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                                        {proj.business?.phone_number || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>N/A</span>}
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>
                                                {proj.developer?.name?.split(' ').map((n: string) => n[0]).join('') || 'D'}
                                            </div>
                                            <strong style={{ color: 'var(--text-main)' }}>{proj.developer?.name || 'Unassigned'}</strong>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        {getStatusBadge(proj.websiteStatus)}
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        {proj.websiteUrl ? (
                                            <a 
                                                href={proj.websiteUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                className="hover-link"
                                            >
                                                Visit Link <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No deployment</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                                        {proj.websiteCompletedAt ? (
                                            <span>Done: {new Date(proj.websiteCompletedAt).toLocaleDateString()}</span>
                                        ) : (
                                            <span>Updated: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
