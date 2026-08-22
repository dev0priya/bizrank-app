'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Search, Users, Kanban, CalendarClock, Contact, 
  Activity, Coins, BarChart3, Sparkles, CheckSquare, UsersRound, 
  Tags, Zap, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useMobileMenu } from '../../context/MobileMenuContext';

interface SidebarItem {
  name: string;
  href?: string;
  icon: any;
  submenu?: Array<{ name: string; href: string }>;
  badgeKey?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState('ADMIN');
  const [badges, setBadges] = useState<any>({
    overdueFollowUps: 0,
    todayFollowUps: 0,
    hotLeads: 0,
    totalLeads: 0
  });

  // Expanded submenu state
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Business Discovery': false,
    'Leads': false,
    'Follow-ups': false,
    'Settings': false
  });

  // Load layout configurations and roles
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const collapsed = localStorage.getItem('bizrank_sidebar_collapsed') === 'true';
      setIsCollapsed(collapsed);
      const role = localStorage.getItem('bizrank_active_role') || 'ADMIN';
      setUserRole(role);
    }
  }, []);

  // Fetch badges count periodically
  useEffect(() => {
    const loadBadges = async () => {
      try {
        const res = await fetch('/api/crm/sidebar-badges');
        if (res.ok) {
          const data = await res.json();
          setBadges(data);
        }
      } catch (err) {
        console.error("Failed to load badges", err);
      }
    };
    loadBadges();
    const interval = setInterval(loadBadges, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('bizrank_sidebar_collapsed', String(nextVal));
  };

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const menuTree = {
    MAIN: [
      { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
      { 
        name: 'Business Discovery', 
        href: '/discovery',
        icon: Search,
        submenu: [
          { name: 'New Search', href: '/discovery' },
          { name: 'Search History', href: '/jobs' },
          { name: 'Saved Searches', href: '/discovery' },
          { name: 'Discovery Jobs', href: '/jobs' },
          { name: 'All Results', href: '/database' }
        ]
      },
      { 
        name: 'Leads', 
        href: '/crm/leads',
        icon: Users,
        badgeKey: 'totalLeads',
        submenu: [
          { name: 'All Leads', href: '/crm/leads' },
          { name: 'My Leads', href: '/crm/leads?filter=mine' },
          { name: 'Hot Leads', href: '/crm/leads?filter=hot' },
          { name: 'Unassigned', href: '/crm/leads?filter=unassigned' },
          { name: 'Recently Added', href: '/crm/leads?filter=recent' }
        ]
      },
      { name: 'Pipeline', href: '/crm/pipeline', icon: Kanban },
      { 
        name: 'Follow-ups', 
        href: '/crm/follow-ups',
        icon: CalendarClock,
        badgeKey: 'todayFollowUps',
        submenu: [
          { name: 'Today', href: '/crm/follow-ups?filter=today' },
          { name: 'Upcoming', href: '/crm/follow-ups?filter=upcoming' },
          { name: 'Overdue', href: '/crm/follow-ups?filter=overdue' },
          { name: 'Completed', href: '/crm/follow-ups?filter=completed' }
        ]
      },
      { name: 'Contacts', href: '/crm/contacts', icon: Contact },
      { name: 'Activities', href: '/crm/activities', icon: Activity },
      { name: 'Deals', href: '/crm/deals', icon: Coins },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'AI Sales Assistant', href: '/crm/ai', icon: Sparkles }
    ] as SidebarItem[],
    MANAGEMENT: [
      { name: 'Tasks', href: '/crm/tasks', icon: CheckSquare },
      { name: 'Team', href: '/crm/team', icon: UsersRound },
      { name: 'Tags', href: '/crm/tags', icon: Tags },
      { name: 'Automations', href: '/crm/automations', icon: Zap }
    ] as SidebarItem[],
    SETTINGS: [
      { name: 'CRM Settings', href: '/settings', icon: Settings },
      { name: 'Lead Scoring', href: '/settings/lead-scoring', icon: Settings, sensitive: true },
      { name: 'Pipeline Settings', href: '/settings/pipeline', icon: Settings, sensitive: true },
      { name: 'Users & Roles', href: '/settings/users-roles', icon: Settings, sensitive: true },
      { name: 'Integrations', href: '/settings/integrations', icon: Settings, sensitive: true },
      { name: 'Business Settings', href: '/settings/business', icon: Settings, sensitive: true }
    ] as any[]
  };

  const getBadgeValue = (key?: string) => {
    if (!key) return 0;
    if (key === 'todayFollowUps') return badges.todayFollowUps + badges.overdueFollowUps;
    return badges[key] || 0;
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={closeMobileMenu}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{
        width: isCollapsed ? '78px' : '260px',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
        background: 'var(--panel-bg)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Sidebar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="sidebar-logo" style={{ margin: 0, fontWeight: 800, fontSize: isCollapsed ? '16px' : '20px' }}>
            {isCollapsed ? 'B.' : 'BizRank.'}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Collapse toggle */}
            <button 
              className="collapse-btn"
              onClick={toggleCollapse}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            {/* Mobile close */}
            <button 
              className="mobile-close-btn"
              onClick={closeMobileMenu}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="sidebar-nav no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {Object.entries(menuTree).map(([sectionTitle, items]) => {
            // Filter sensitive items from viewer role
            const visibleItems = items.filter(item => {
              if (item.sensitive && userRole === 'VIEWER') return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={sectionTitle} style={{ marginBottom: '24px' }}>
                {!isCollapsed && (
                  <div className="sidebar-group-title" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
                    {sectionTitle}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isSubmenu = !!item.submenu;
                    const isExpanded = expandedMenus[item.name] || false;
                    const badgeVal = getBadgeValue(item.badgeKey);

                    // Check if path active
                    const isActive = item.href ? pathname.startsWith(item.href) : false;

                    if (isSubmenu && !isCollapsed) {
                      return (
                        <div key={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
                          <div
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                              border: 'none',
                              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: 500
                            }}
                          >
                            <Link
                              href={item.href!}
                              onClick={closeMobileMenu}
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', textDecoration: 'none', flex: 1, textAlign: 'left' }}
                            >
                              <Icon size={18} />
                              <span>{item.name}</span>
                            </Link>
                            <button
                              onClick={() => toggleSubmenu(item.name)}
                              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.name}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                              {badgeVal > 0 && (
                                <span style={{ fontSize: '10px', background: 'var(--accent-primary)', color: '#000', borderRadius: '10px', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {badgeVal}
                                </span>
                              )}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>

                          {/* Nested links */}
                          {isExpanded && (
                            <div style={{ paddingLeft: '28px', borderLeft: '1px dashed var(--border-color)', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                              {item.submenu!.map((sub: { name: string; href: string }) => {
                                const isSubActive = pathname === sub.href;
                                return (
                                  <Link 
                                    key={sub.name} 
                                    href={sub.href}
                                    onClick={closeMobileMenu}
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      color: isSubActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                                      textDecoration: 'none',
                                      fontWeight: isSubActive ? 600 : 400
                                    }}
                                  >
                                    {sub.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Standard link
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href || '#'}
                        onClick={closeMobileMenu}
                        className={`nav-link ${isActive ? 'active' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: '8px',
                          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                          background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '14px',
                          textDecoration: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Icon size={18} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </div>
                        {!isCollapsed && badgeVal > 0 && (
                          <span style={{ fontSize: '10px', background: 'var(--accent-primary)', color: '#000', borderRadius: '10px', padding: '1px 6px', fontWeight: 'bold' }}>
                            {badgeVal}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        {!isCollapsed && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
            BizRank Intelligence Workspace <br/>
            Access Level: <strong style={{ color: 'var(--accent-primary)' }}>{userRole}</strong>
          </div>
        )}
      </nav>
    </>
  );
}
