'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, Search, Users, Kanban, CalendarClock, Contact, 
  Activity, Coins, BarChart3, Sparkles, CheckSquare, UsersRound, 
  Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, Globe
} from 'lucide-react';
import { useMobileMenu } from '../../context/MobileMenuContext';

interface SubmenuItem {
  name: string;
  href: string;
}

interface SidebarItem {
  name: string;
  href?: string;
  icon: any;
  submenu?: SubmenuItem[];
  badgeKey?: string;
}

interface SidebarSection {
  group: string;
  items: SidebarItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [userRole, setUserRole] = useState('ADMIN');
  const [activeUsername, setActiveUsername] = useState('admin@bizrank.com');

  const [badges, setBadges] = useState<any>({
    overdueFollowUps: 0,
    todayFollowUps: 0,
    hotLeads: 0,
    totalLeads: 0
  });

  // Expanded submenu state
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'My Workspace': false,
    'Leads': false,
    'Deals': false,
    'Websites': false,
    'Settings': false
  });

  // Load layout configurations, active username, and roles
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const collapsed = localStorage.getItem('bizrank_sidebar_collapsed') === 'true';
      setIsCollapsed(collapsed);
      const role = localStorage.getItem('bizrank_active_role') || 'ADMIN';
      const username = localStorage.getItem('bizrank_active_username') || 'admin@bizrank.com';
      setUserRole(role);
      setActiveUsername(username);
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

  // Dynamically constructed menuTree based on active username
  const menuTree: SidebarSection[] = [
    {
      group: '',
      items: [
        { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
        { name: 'Business Discovery', href: '/discovery', icon: Search },
        {
          name: 'Leads',
          href: '/crm/leads',
          icon: Users,
          badgeKey: 'totalLeads',
          submenu: [
            { name: 'All Leads', href: '/crm/leads' },
            { name: 'My Leads', href: `/crm/leads?assignedTo=${activeUsername}` },
            { name: 'New Leads', href: '/crm/leads?filter=new' },
            { name: 'Hot Leads', href: '/crm/leads?filter=hot' },
            { name: 'Follow-ups', href: '/crm/follow-ups' }
          ]
        },
        {
          name: 'My Workspace',
          icon: Sparkles,
          submenu: [
            { name: 'Overview', href: '/crm/workspace?section=overview' },
            { name: 'Team Activity', href: '/crm/workspace?section=team-activity' },
            { name: 'Communication', href: '/crm/workspace?section=communication' },
            { name: 'Follow-ups', href: '/crm/workspace?section=follow-ups' },
            { name: 'No Response', href: '/crm/workspace?section=no-response' },
            { name: 'Contact Attempts', href: '/crm/workspace?section=contact-attempts' },
            { name: 'Recent Activity', href: '/crm/workspace?section=recent-activity' },
            { name: 'Team Performance', href: '/crm/workspace?section=team-performance' }
          ]
        },
        {
          name: 'Deals',
          href: '/crm/deals',
          icon: Kanban,
          submenu: [
            { name: 'Pipeline', href: '/crm/pipeline' },
            { name: 'Won', href: '/crm/deals?status=WON' },
            { name: 'Lost', href: '/crm/deals?status=LOST' }
          ]
        },
        { name: 'Customers', href: '/crm/customers', icon: Contact },
        {
          name: 'Websites',
          href: '/crm/projects',
          icon: Globe,
          submenu: [
            { name: 'All Websites', href: '/crm/projects' },
            { name: 'Assigned', href: '/crm/projects?status=ASSIGNED' },
            { name: 'In Progress', href: '/crm/projects?status=IN_PROGRESS' },
            { name: 'Demo Ready', href: '/crm/projects?status=DEMO_READY' },
            { name: 'Completed', href: '/crm/projects?status=COMPLETED' }
          ]
        },
        { name: 'Tasks', href: '/crm/tasks', icon: CheckSquare },
        { name: 'Activities', href: '/crm/activities', icon: Activity },
        { name: 'Payments', href: '/crm/payments', icon: Coins },
        { name: 'Reports', href: '/analytics', icon: BarChart3 },
        { name: 'Team', href: '/crm/team', icon: UsersRound },
        {
          name: 'Settings',
          href: '/settings',
          icon: Settings,
          submenu: [
            { name: 'CRM Settings', href: '/settings' },
            { name: 'Lead Scoring', href: '/settings/lead-scoring' },
            { name: 'Users & Roles', href: '/settings/users-roles' },
            { name: 'Integrations', href: '/settings/integrations' },
            { name: 'Business Settings', href: '/settings/business' }
          ]
        }
      ]
    }
  ];

  // Auto-expand active submenus on mount/navigation
  useEffect(() => {
    const newExpanded = { ...expandedMenus };
    let changed = false;

    menuTree.forEach(section => {
      section.items.forEach(item => {
        if (item.submenu) {
          const hasActiveSub = item.submenu.some(sub => {
            const currentFullUrl = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
            return currentFullUrl === sub.href || (sub.href.includes('?') ? currentFullUrl.startsWith(sub.href) : pathname === sub.href);
          });
          if (hasActiveSub && !expandedMenus[item.name]) {
            newExpanded[item.name] = true;
            changed = true;
          }
        }
      });
    });

    if (changed) {
      setExpandedMenus(newExpanded);
    }
  }, [pathname, searchParams, activeUsername]);

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

        {/* Scrollable Nav List */}
        <div className="sidebar-nav no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {menuTree.map((section) => {
            // Apply Role-Based Access Control
            const visibleItems = section.items.filter(item => {
              if (userRole === 'SALES_AGENT' || userRole === 'COMMUNICATION') {
                return ['Dashboard', 'Business Discovery', 'Leads', 'My Workspace', 'Deals', 'Customers', 'Websites', 'Tasks', 'Activities'].includes(item.name);
              }
              if (userRole === 'DEVELOPER') {
                return ['Dashboard', 'My Workspace', 'Websites', 'Tasks', 'Customers', 'Activities'].includes(item.name);
              }
              // Admin/Manager has access to all
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.group} style={{ marginBottom: '20px' }}>
                {!isCollapsed && section.group && (
                  <div className="sidebar-group-title" style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '8px', fontWeight: 700 }}>
                    {section.group}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isSubmenu = !!item.submenu;
                    const isExpanded = expandedMenus[item.name] || false;
                    const badgeVal = getBadgeValue(item.badgeKey);

                    // Determine active state
                    const isActive = item.href ? (item.href === '/crm/dashboard' ? pathname === '/crm/dashboard' : pathname.startsWith(item.href)) : false;

                    if (isSubmenu && !isCollapsed) {
                      return (
                        <div key={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
                          <button
                            onClick={() => toggleSubmenu(item.name)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                              border: 'none',
                              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                              borderRadius: '8px',
                              fontSize: '13.5px',
                              fontWeight: isActive ? 600 : 500,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                              <span>{item.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {badgeVal > 0 && (
                                <span style={{ fontSize: '9px', background: 'var(--accent-primary)', color: '#000', borderRadius: '10px', padding: '1px 5px', fontWeight: 'bold' }}>
                                  {badgeVal}
                                </span>
                              )}
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </div>
                          </button>

                          {/* Nested submenu links */}
                          {isExpanded && (
                            <div style={{ paddingLeft: '16px', borderLeft: '1px solid var(--border-color)', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                              {item.submenu!.map((sub) => {
                                const currentFullUrl = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
                                const isSubActive = currentFullUrl === sub.href || (sub.href.includes('?') ? currentFullUrl.startsWith(sub.href) : pathname === sub.href);

                                return (
                                  <Link 
                                    key={sub.name} 
                                    href={sub.href}
                                    onClick={closeMobileMenu}
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: '12.5px',
                                      color: isSubActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                                      background: isSubActive ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                                      borderRadius: '6px',
                                      textDecoration: 'none',
                                      fontWeight: isSubActive ? 600 : 400,
                                      transition: 'color 0.2s, background 0.2s'
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

                    // Standard single link
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
                          background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '13.5px',
                          textDecoration: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </div>
                        {!isCollapsed && badgeVal > 0 && (
                          <span style={{ fontSize: '9px', background: 'var(--accent-primary)', color: '#000', borderRadius: '10px', padding: '1px 5px', fontWeight: 'bold' }}>
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

        {/* Access level info at footer */}
        {!isCollapsed && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--text-muted)' }}>
            BizRank CRM Workspace <br/>
            Role: <strong style={{ color: 'var(--accent-primary)' }}>{userRole}</strong>
          </div>
        )}
      </nav>
    </>
  );
}
