'use client';

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
  Settings 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Business Discovery', href: '/discovery', icon: Search },
  { name: 'Collection Jobs', href: '/jobs', icon: Clock },
  { name: 'Business Database', href: '/database', icon: Database },
  { name: 'Qualified Leads', href: '/leads', icon: Target },
  { name: 'CRM', href: '/crm', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Master Data', href: '/master', icon: DatabaseZap },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">BizRank.</div>
      
      <div className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div style={{ marginTop: 'auto', padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
        BizRank CRM v1.1 <br/>
        Production SaaS
      </div>
    </nav>
  );
}
