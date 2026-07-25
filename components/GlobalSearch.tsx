'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Search, Loader2, Building, Clock, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ businesses: any[], jobs: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setSelectedIndex(-1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Combine items for keyboard navigation
  const allItems: any[] = [];
  if (results) {
    results.businesses.forEach(b => allItems.push({ type: 'business', data: b }));
    results.jobs.forEach(j => allItems.push({ type: 'job', data: j }));
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || allItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(allItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item: any) => {
    setIsOpen(false);
    setQuery('');
    if (item.type === 'business') {
      router.push(`/business/${item.data.id}`);
    } else if (item.type === 'job') {
      router.push(`/jobs/${item.data.id}`);
    }
  };

  return (
    <div className="global-search-container" ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
      <div 
        className="topbar-search" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '8px', 
          padding: '8px 16px', 
          border: '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 2px var(--accent-primary)' : 'none'
        }}
      >
        <Search size={18} color="var(--text-muted)" style={{ marginRight: '8px' }} />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search businesses, jobs, cities..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '14px' }}
        />
        {loading && <Loader2 size={16} className="spin" color="var(--text-muted)" />}
      </div>

      {isOpen && (query.length >= 2) && (
        <div 
          className="search-dropdown glass-panel" 
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 8px)', 
            left: 0, 
            right: 0, 
            padding: '8px', 
            zIndex: 100, 
            maxHeight: '400px', 
            overflowY: 'auto' 
          }}
        >
          {loading && !results ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>
          ) : results && allItems.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No results found for "{query}"</div>
          ) : (
            <>
              {results?.businesses && results.businesses.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', marginBottom: '4px' }}>Businesses</div>
                  {results.businesses.map(b => {
                    const itemIndex = allItems.findIndex(i => i.type === 'business' && i.data.id === b.id);
                    const isActive = selectedIndex === itemIndex;
                    return (
                      <div 
                        key={`b-${b.id}`}
                        onClick={() => handleSelect({ type: 'business', data: b })}
                        style={{ 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        <Building size={16} color="var(--accent-primary)" />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{b.business_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                            {b.city?.name && <span><MapPin size={10} style={{display:'inline', marginRight:'2px'}}/>{b.city.name}</span>}
                            {b.category?.name && <span>• {b.category.name}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {results?.jobs && results.jobs.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', marginBottom: '4px' }}>Jobs</div>
                  {results.jobs.map(j => {
                    const itemIndex = allItems.findIndex(i => i.type === 'job' && i.data.id === j.id);
                    const isActive = selectedIndex === itemIndex;
                    return (
                      <div 
                        key={`j-${j.id}`}
                        onClick={() => handleSelect({ type: 'job', data: j })}
                        style={{ 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        <Clock size={16} color="var(--status-lead)" />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Job #{j.id}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{j.query}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .search-dropdown {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
        }
        
        /* Hide scrollbar in dropdown */
        .search-dropdown::-webkit-scrollbar {
          display: none;
        }
        .search-dropdown {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
