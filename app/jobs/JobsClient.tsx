'use client';

import React, { useState } from 'react';
import { Clock, Download, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function JobsClient({ jobs: initialJobs }: { jobs: any[] }) {
    const [jobs, setJobs] = useState(initialJobs);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this job and ALL its associated businesses?')) return;

        const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setJobs(jobs.filter(j => j.id !== id));
        } else {
            alert('Failed to delete job.');
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Clock size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Collection Jobs Ledger</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                A complete historical record of every data extraction run.
            </p>

            <div className="glass-panel">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '16px 12px' }}>Job ID</th>
                                <th style={{ padding: '16px 12px' }}>Search Query</th>
                                <th style={{ padding: '16px 12px' }}>Max Target</th>
                                <th style={{ padding: '16px 12px' }}>Saved</th>
                                <th style={{ padding: '16px 12px' }}>Status</th>
                                <th style={{ padding: '16px 12px' }}>Started At</th>
                                <th style={{ padding: '16px 12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 12px', fontWeight: 600 }}>#{job.id}</td>
                                    <td style={{ padding: '16px 12px' }}>{job.query}</td>
                                    <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{job.total || '-'}</td>
                                    <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{job._count?.businesses || 0}</td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span className={`badge ${job.status === 'Completed' ? 'badge-priority-c' : job.status === 'Running' ? 'badge-priority-b' : 'badge-priority-a'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>
                                        {new Date(job.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <Link href={`/jobs/${job.id}`} title="Open Results" style={{ color: 'var(--text-muted)' }}>
                                                <ExternalLink size={18} />
                                            </Link>
                                            <button 
                                                title="Delete Job" 
                                                onClick={() => handleDelete(job.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--status-lost)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No jobs found in the ledger.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
