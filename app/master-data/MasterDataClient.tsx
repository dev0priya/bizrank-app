'use client';

import React, { useState } from 'react';
import { Database, Plus, Trash2, Map, Tag, AlertCircle } from 'lucide-react';

export default function MasterDataClient({ initialCategories, initialCountries, initialStates, initialCities }: any) {
    const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');
    
    // State
    const [categories, setCategories] = useState<any[]>(initialCategories);
    const [countries, setCountries] = useState<any[]>(initialCountries);
    const [states, setStates] = useState<any[]>(initialStates);
    const [cities, setCities] = useState<any[]>(initialCities);
    
    // Forms
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCityName, setNewCityName] = useState('');
    const [selectedStateForCity, setSelectedStateForCity] = useState('');
    const [selectedStateFilter, setSelectedStateFilter] = useState('');
    
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (!selectedStateFilter) {
            setCities(initialCities);
            return;
        }
        fetch(`/api/master/location?type=city&stateId=${selectedStateFilter}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setCities(data.data);
                }
            })
            .catch(err => setError(err.message));
    }, [selectedStateFilter, initialCities]);

    const handleCreateCategory = async () => {
        if (!newCategoryName) return;
        try {
            const res = await fetch('/api/master/category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCategories([...categories, data.data].sort((a,b) => a.name.localeCompare(b.name)));
            setNewCategoryName('');
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            const res = await fetch(`/api/master/category?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCategories(categories.filter(c => c.id !== id));
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCreateCity = async () => {
        if (!newCityName || !selectedStateForCity) return;
        try {
            const res = await fetch('/api/master/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'city', name: newCityName, parentId: parseInt(selectedStateForCity) })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCities([...cities, data.data].sort((a,b) => a.name.localeCompare(b.name)));
            setNewCityName('');
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteLocation = async (id: number, type: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;
        try {
            const res = await fetch(`/api/master/location?id=${id}&type=${type}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            if (type === 'city') setCities(cities.filter(c => c.id !== id));
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Database size={28} className="text-gradient" />
                <h1 className="text-gradient" style={{ margin: 0 }}>Master Data Management</h1>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Manage the dictionaries that power the Discovery engine and global filters.
            </p>

            {error && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-lost)', borderRadius: '8px', color: 'var(--status-lost)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* TABS */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <button 
                    onClick={() => setActiveTab('categories')}
                    style={{ background: 'none', border: 'none', fontSize: '16px', fontWeight: 600, color: activeTab === 'categories' ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Tag size={18} /> Categories
                </button>
                <button 
                    onClick={() => setActiveTab('locations')}
                    style={{ background: 'none', border: 'none', fontSize: '16px', fontWeight: 600, color: activeTab === 'locations' ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Map size={18} /> Geographic Locations
                </button>
            </div>

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '20px' }}>Industry Categories</h3>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <input 
                            type="text" 
                            placeholder="New Category Name (e.g. Dentists)" 
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            style={{ flex: 1, padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        />
                        <button 
                            onClick={handleCreateCategory}
                            style={{ padding: '10px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                        >
                            <Plus size={16} /> Add Category
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {categories.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <span>{c.name}</span>
                                <button onClick={() => handleDeleteCategory(c.id)} style={{ background: 'none', border: 'none', color: 'var(--status-lost)', cursor: 'pointer', padding: '4px' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LOCATIONS TAB */}
            {activeTab === 'locations' && (
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0 }}>City Dictionary</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Filter by State:</label>
                            <select 
                                value={selectedStateFilter} 
                                onChange={e => setSelectedStateFilter(e.target.value)}
                                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                            >
                                <option value="">View Sample Cities (First 100)</option>
                                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                        <select 
                            value={selectedStateForCity} 
                            onChange={e => setSelectedStateForCity(e.target.value)}
                            style={{ flex: 1, minWidth: '200px', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        >
                            <option value="">Select State for New City</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="New City Name (e.g. San Francisco)" 
                            value={newCityName}
                            onChange={e => setNewCityName(e.target.value)}
                            style={{ flex: 2, minWidth: '200px', padding: '10px 16px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none' }}
                        />
                        <button 
                            onClick={handleCreateCity}
                            style={{ padding: '10px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                        >
                            <Plus size={16} /> Add City
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {cities.map(c => {
                            const parentState = states.find(s => s.id === c.stateId);
                            return (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{parentState?.name}</div>
                                    </div>
                                    <button onClick={() => handleDeleteLocation(c.id, 'city')} style={{ background: 'none', border: 'none', color: 'var(--status-lost)', cursor: 'pointer', padding: '4px' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
