'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  Clock, 
  Database, 
  Target, 
  Users, 
  BarChart3, 
  DatabaseZap, 
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useMobileMenu } from '../context/MobileMenuContext';

const groups = [
  {
    title: 'Sourcing & Collection',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Business Discovery', href: '/discovery', icon: Search },
      { name: 'Collection Jobs', href: '/jobs', icon: Clock },
    ]
  },
  {
    title: 'Data & CRM',
    items: [
      { name: 'Business Database', href: '/database', icon: Database },
      { name: 'Qualified Leads', href: '/leads', icon: Target },
      { name: 'CRM Pipeline', href: '/crm', icon: Users },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Master Data', href: '/master', icon: DatabaseZap },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={closeMobileMenu}
        />
      )}

      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div className="sidebar-logo" style={{ marginBottom: 0 }}>
            {isCollapsed ? 'B.' : 'BizRank.'}
          </div>
          
          {/* Desktop/Tablet Collapse Button */}
          <button 
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            className="mobile-close-btn"
            onClick={closeMobileMenu}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {groups.map((group) => (
            <div key={group.title} style={{ marginBottom: '24px' }}>
              <div className="sidebar-group-title">{group.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href} 
                      onClick={closeMobileMenu}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer-text" style={{ marginTop: 'auto', padding: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: isCollapsed ? 'center' : 'left' }}>
          v1.2 <br/>
          Production
        </div>
      </nav>
    </>
  );
}
