'use client';

import React, { useState } from 'react';
import { Tags, Plus, Trash2, Search, Hash } from 'lucide-react';

export default function TagsClient({ 
    initialTags 
}: { 
    initialTags: any[];
}) {
    const [tags, setTags] = useState(initialTags);
    const [searchQuery, setSearchQuery] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!newTagName.trim()) {
            setErrorMsg('Tag name is required');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/crm/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create tag');
            }

            const refreshRes = await fetch('/api/crm/tags');
            if (refreshRes.ok) {
                const updatedList = await refreshRes.json();
                setTags(updatedList);
            }

            setNewTagName('');
        } catch (err: any) {
            setErrorMsg(err.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this tag? This will remove it from all leads.')) return;

        try {
            const res = await fetch(`/api/crm/tags?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setTags(tags.filter(t => t.id !== id));
            } else {
                alert('Failed to delete tag');
            }
        } catch (err) {
            console.error('Delete tag error:', err);
        }
    };

    // Filter tags
    const filteredTags = tags.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ paddingBottom: '40px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            {/* Left Column: Tags List */}
            <div>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Tags size={28} className="text-gradient" />
                        <h1 style={{ margin: 0 }}>CRM Tags Directory</h1>
                    </div>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                        Create and organize tags to label leads in your sales workspace.
                    </p>
                </div>

                {/* Filter bar */}
                <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '12px 16px', marginBottom: '24px', alignItems: 'center' }}>
                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                    <input 
                        type="text"
                        placeholder="Search tags..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ flex: 1, background: 'transparent', color: 'white', border: 'none', outline: 'none', fontSize: '14px' }}
                    />
                </div>

                {/* Grid */}
                {filteredTags.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No tags found.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {filteredTags.map(t => (
                            <div 
                                key={t.id} 
                                className="glass-panel hover-lift"
                                style={{ 
                                    padding: '16px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Hash size={14} style={{ color: 'var(--accent-primary)' }} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Used on {t._count?.leads || 0} leads
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(t.id)}
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.7)', cursor: 'pointer', padding: '4px' }}
                                    title="Delete tag"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Column: Add Tag Panel */}
            <div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Create Tag
                    </h3>
                    
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                Tag Name (e.g. HOT, PROPOSAL)
                            </label>
                            <input 
                                type="text"
                                placeholder="ENTER_TAG_NAME"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', textTransform: 'uppercase' }}
                            />
                        </div>

                        {errorMsg && (
                            <div style={{ color: '#ef4444', fontSize: '13px' }}>
                                {errorMsg}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="btn-primary hover-lift ripple" 
                            style={{ padding: '10px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            {submitting ? 'Creating...' : 'Create Tag'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
