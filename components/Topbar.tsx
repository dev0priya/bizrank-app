'use client';

import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useMobileMenu } from '../context/MobileMenuContext';
import { useTheme } from '../context/ThemeContext';
import { GlobalSearch } from './GlobalSearch';

export function Topbar() {
  const { toggleMobileMenu } = useMobileMenu();
  const { theme, toggleTheme } = useTheme();

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
            A
          </div>
          <div className="profile-text">
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Admin User</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Workspace Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
