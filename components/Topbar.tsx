'use client';

import { Search, Bell, Menu, Moon } from 'lucide-react';
import { useState } from 'react';
import { useMobileMenu } from '../context/MobileMenuContext';

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toggleMobileMenu } = useMobileMenu();

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
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Hamburger Menu for Mobile */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
        >
          <Menu size={24} />
        </button>

        <div className="topbar-search" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 16px', border: '1px solid var(--border-color)' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input 
            type="text" 
            placeholder="Global search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '14px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button className="btn-icon" style={{ border: 'none', background: 'transparent' }} title="Toggle Dark Mode">
          <Moon size={20} />
        </button>
        
        <button className="btn-icon" style={{ border: 'none', background: 'transparent', position: 'relative' }} title="Notifications">
          <Bell size={20} />
          <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--status-lost)', width: '8px', height: '8px', borderRadius: '50%' }}></span>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} className="profile-dropdown">
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
            A
          </div>
          <div className="profile-text">
            <div style={{ fontSize: '13px', fontWeight: '600' }}>Admin User</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Workspace Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
