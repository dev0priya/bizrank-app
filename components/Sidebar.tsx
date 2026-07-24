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
  ChevronRight
} from 'lucide-react';

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

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div className="sidebar-logo" style={{ marginBottom: 0 }}>
          {isCollapsed ? 'B.' : 'BizRank.'}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
  );
}
