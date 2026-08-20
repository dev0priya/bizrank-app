'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Menu, Moon, Sun, Plus } from 'lucide-react';
import { useMobileMenu } from '../../context/MobileMenuContext';
import { useTheme } from '../../context/ThemeContext';
import { GlobalSearch } from '../search/GlobalSearch';

declare global {
  interface Window {
    __fetch_intercepted__?: boolean;
  }
}

export function Topbar() {
  const { toggleMobileMenu } = useMobileMenu();
  const { theme, toggleTheme } = useTheme();

  const [activeRole, setActiveRole] = useState('ADMIN');
  const [activeUsername, setActiveUsername] = useState('admin@bizrank.com');

  useEffect(() => {
    // Override window.fetch once on initial client hydration
    if (typeof window !== 'undefined' && !window.__fetch_intercepted__) {
      window.__fetch_intercepted__ = true;
      const originalFetch = window.fetch;
      window.fetch = async function (input, init) {
        const role = localStorage.getItem('bizrank_active_role') || 'ADMIN';
        const username = localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com';
        
        const newInit = init ? { ...init } : {};
        const headers = new Headers(newInit.headers || {});
        if (!headers.has('x-user-role')) {
          headers.set('x-user-role', role);
        }
        if (!headers.has('x-user-username')) {
          headers.set('x-user-username', username);
        }
        newInit.headers = headers;
        return originalFetch(input, newInit);
      };
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('bizrank_active_role') || 'ADMIN';
    const username = localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com';
    setActiveRole(role);
    setActiveUsername(username);
  }, []);

  const handleRoleChange = (role: string) => {
    let username = 'admin@bizrank.com';
    if (role === 'MANAGER') username = 'sales.manager@bizrank.com';
    else if (role === 'SALES_AGENT') username = 'sales.agent@bizrank.com';
    else if (role === 'VIEWER') username = 'viewer@bizrank.com';

    localStorage.setItem('bizrank_active_role', role);
    localStorage.setItem('bizrank_active_username', username);
    setActiveRole(role);
    setActiveUsername(username);
    
    window.location.reload();
  };

  const getProfileInitials = () => {
    switch (activeRole) {
      case 'MANAGER': return 'M';
      case 'SALES_AGENT': return 'S';
      case 'VIEWER': return 'V';
      default: return 'A';
    }
  };

  const getProfileLabel = () => {
    switch (activeRole) {
      case 'MANAGER': return 'Sales Manager';
      case 'SALES_AGENT': return 'Sales Agent';
      case 'VIEWER': return 'Viewer User';
      default: return 'Admin User';
    }
  };

  return (
    <header className="topbar glass-panel" style={{ 
      borderRadius: 0, 
      borderTop: 'none', 
      borderLeft: 'none', 
      borderRight: 'none', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 24px', 
      background: 'var(--panel-bg)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        {/* Hamburger Menu for Mobile */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
        >
          <Menu size={24} />
        </button>
 
        <GlobalSearch />
      </div>
 
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link href="/discovery" className="btn-primary" title="Quick add: start a new business discovery" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '8px 10px', fontSize: '13px' }}>
          <Plus size={16} /> <span className="quick-add-label">Quick Add</span>
        </Link>
        {/* Role Selector dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Active Role:</span>
          <select 
            value={activeRole} 
            onChange={e => handleRoleChange(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '6px', 
              padding: '4px 8px', 
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ADMIN" style={{ background: '#1e293b' }}>Admin (Full Access)</option>
            <option value="MANAGER" style={{ background: '#1e293b' }}>Sales Manager</option>
            <option value="SALES_AGENT" style={{ background: '#1e293b' }}>Sales Agent</option>
            <option value="VIEWER" style={{ background: '#1e293b' }}>Viewer (Read Only)</option>
          </select>
        </div>

        <button 
          onClick={toggleTheme}
          className="btn-icon ripple" 
          style={{ border: 'none', background: 'transparent' }} 
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        <button className="btn-icon ripple" style={{ border: 'none', background: 'transparent', position: 'relative' }} title="Notifications">
          <Bell size={20} />
          <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--status-lost)', width: '8px', height: '8px', borderRadius: '50%' }}></span>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} className="profile-dropdown">
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
            {getProfileInitials()}
          </div>
          <div className="profile-text">
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{getProfileLabel()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeUsername}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
