'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Contact as ContactIcon, Search, Plus, Phone, Mail, 
  MessageSquare, User, Edit2, Trash2, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactsClient({ 
    initialContacts, 
    leads 
}: { 
    initialContacts: any[]; 
    leads: any[];
}) {
    const [contacts, setContacts] = useState(initialContacts);
    const [searchQuery, setSearchQuery] = useState('');
    const [primaryFilter, setPrimaryFilter] = useState<'all' | 'primary' | 'secondary'>('all');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    
    // Form fields
    const [formData, setFormData] = useState({
        crmLeadId: '',
        name: '',
        role: '',
        phone: '',
        email: '',
        whatsapp: '',
        preferredContactMethod: 'EMAIL',
        isPrimary: false
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const openCreateModal = () => {
        setEditingContact(null);
        setFormData({
            crmLeadId: leads[0]?.id?.toString() || '',
            name: '',
            role: '',
            phone: '',
            email: '',
            whatsapp: '',
            preferredContactMethod: 'EMAIL',
            isPrimary: false
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (contact: any) => {
        setEditingContact(contact);
        setFormData({
            crmLeadId: contact.crmLeadId.toString(),
            name: contact.name,
            role: contact.role || '',
            phone: contact.phone || '',
            email: contact.email || '',
            whatsapp: contact.whatsapp || '',
            preferredContactMethod: contact.preferredContactMethod || 'EMAIL',
            isPrimary: contact.isPrimary
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!formData.name.trim()) {
            setErrorMsg('Contact name is required');
            return;
        }

        setSubmitting(true);
        try {
            const url = editingContact 
                ? `/api/crm/contacts/${editingContact.id}`
                : `/api/crm/contacts`;
            const method = editingContact ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save contact');
            }

            // Refresh list
            const refreshRes = await fetch('/api/crm/contacts');
            if (refreshRes.ok) {
                const updatedList = await refreshRes.json();
                setContacts(updatedList);
            }

            setIsModalOpen(false);
        } catch (err: any) {
            setErrorMsg(err.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        
        try {
            const res = await fetch(`/api/crm/contacts/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setContacts(contacts.filter(c => c.id !== id));
            } else {
                alert('Failed to delete contact');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // Filtering contacts
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = 
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (contact.role && contact.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (contact.phone && contact.phone.includes(searchQuery)) ||
            (contact.crmLead?.business?.business_name && contact.crmLead.business.business_name.toLowerCase().includes(searchQuery.toLowerCase()));
            
        const matchesPrimary = 
            primaryFilter === 'all' ||
            (primaryFilter === 'primary' && contact.isPrimary) ||
            (primaryFilter === 'secondary' && !contact.isPrimary);

        return matchesSearch && matchesPrimary;
    });

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ContactIcon size={28} className="text-gradient" />
                        <h1 style={{ margin: 0 }}>Contacts Directory</h1>
                    </div>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                        Manage primary owners and managers associated with your sales pipeline leads.
                    </p>
                </div>
                
                <button 
                    onClick={openCreateModal}
                    className="btn-primary hover-lift ripple"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                    <Plus size={16} /> New Contact
                </button>
            </div>

            {/* Filter Cockpit */}
            <div className="glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text"
                        placeholder="Search contacts by name, role, business..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setPrimaryFilter('all')} 
                        className={`btn-secondary ${primaryFilter === 'all' ? 'active' : ''}`}
                        style={{ padding: '8px 16px', background: primaryFilter === 'all' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', border: '1px solid var(--border-color)', color: primaryFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setPrimaryFilter('primary')} 
                        className={`btn-secondary ${primaryFilter === 'primary' ? 'active' : ''}`}
                        style={{ padding: '8px 16px', background: primaryFilter === 'primary' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', border: '1px solid var(--border-color)', color: primaryFilter === 'primary' ? 'var(--accent-primary)' : 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Primary Contacts
                    </button>
                </div>
            </div>

            {/* Contacts Table / Grid */}
            {filteredContacts.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No contacts found. Create a contact or refine filters.
                </div>
            ) : (
                <div className="dashboard-grid">
                    {filteredContacts.map(c => (
                        <div 
                            key={c.id} 
                            className="glass-panel hover-lift" 
                            style={{ 
                                padding: '20px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between',
                                borderLeft: c.isPrimary ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ margin: 0, fontSize: '16px' }}>{c.name}</h3>
                                            {c.isPrimary && (
                                                <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>PRIMARY</span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                                            {c.role || 'No specific role'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => openEditModal(c)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(c.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.7)', cursor: 'pointer', padding: '4px' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linked Lead / Business</span>
                                    <Link 
                                        href={`/crm/leads/${c.crmLeadId}`} 
                                        style={{ fontSize: '13px', display: 'block', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, marginTop: '2px' }}
                                    >
                                        {c.crmLead?.business?.business_name || 'View Lead Workspace'}
                                    </Link>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                    {c.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                            <Phone size={14} /> {c.phone}
                                        </div>
                                    )}
                                    {c.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                            <Mail size={14} /> {c.email}
                                        </div>
                                    )}
                                    {c.whatsapp && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                            <MessageSquare size={14} /> WhatsApp: {c.whatsapp}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                {c.phone && (
                                    <a href={`tel:${c.phone}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', padding: '6px 0', fontWeight: 500 }}>
                                        <Phone size={12} /> Call
                                    </a>
                                )}
                                {c.whatsapp && (
                                    <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'white', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '12px', padding: '6px 0', fontWeight: 500 }}>
                                        <MessageSquare size={12} /> WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal Drawer overlay */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel" 
                        style={{ width: '100%', maxWidth: '500px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                        <h2 style={{ margin: 0 }}>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {!editingContact && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>CRM Lead Reference</label>
                                    <select
                                        value={formData.crmLeadId}
                                        onChange={e => setFormData({ ...formData, crmLeadId: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#111', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }}
                                    >
                                        {leads.map(l => (
                                            <option key={l.id} value={l.id}>{l.business?.business_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Contact Name</label>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Role / Designation</label>
                                    <input 
                                        type="text"
                                        placeholder="Owner, Manager..."
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Preferred Contact</label>
                                    <select
                                        value={formData.preferredContactMethod}
                                        onChange={e => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#111', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }}
                                    >
                                        <option value="EMAIL">Email</option>
                                        <option value="PHONE">Phone</option>
                                        <option value="WHATSAPP">WhatsApp</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address</label>
                                <input 
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</label>
                                    <input 
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>WhatsApp Number</label>
                                    <input 
                                        type="text"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: '8px 0' }}>
                                <input 
                                    type="checkbox"
                                    checked={formData.isPrimary}
                                    onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span style={{ fontSize: '13px' }}>Mark as Primary Contact for this Lead</span>
                            </label>

                            {errorMsg && (
                                <div style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px' }}>
                                    <ShieldAlert size={16} /> {errorMsg}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary"
                                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                    style={{ padding: '8px 16px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {submitting ? 'Saving...' : 'Save Contact'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
