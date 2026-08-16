'use client';

import React from 'react';
import Link from 'next/link';

import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  badge?: number;
  group?: string;
}

const navItems: NavItem[] = [
  { label: 'Admin Dashboard', icon: 'ChartBarIcon', href: '/admin-dashboard', group: 'Overview' },
  { label: 'Student Performance', icon: 'AcademicCapIcon', href: '/student-performance-dashboard', group: 'Overview' },
  { label: 'Student Dashboard', icon: 'UserCircleIcon', href: '/student-dashboard', group: 'Overview' },
  { label: 'Teacher Dashboard', icon: 'BookOpenIcon', href: '/teacher-dashboard', group: 'Overview' },
  { label: 'Attendance', icon: 'ClipboardDocumentCheckIcon', href: '/admin-dashboard', group: 'Academics' },
  { label: 'Assignments', icon: 'DocumentTextIcon', href: '/admin-dashboard', group: 'Academics' },
  { label: 'Exams', icon: 'PencilSquareIcon', href: '/admin-dashboard', group: 'Academics' },
  { label: 'AI Insights', icon: 'SparklesIcon', href: '/student-performance-dashboard', group: 'Intelligence' },
  { label: 'Reports', icon: 'DocumentChartBarIcon', href: '/reports', group: 'Intelligence' },
  { label: 'User Management', icon: 'UsersIcon', href: '/admin-dashboard', group: 'Admin' },
  { label: 'Courses', icon: 'BookOpenIcon', href: '/admin-dashboard', group: 'Admin' },
  { label: 'Departments', icon: 'BuildingOfficeIcon', href: '/admin-dashboard', group: 'Admin' },
  { label: 'Analytics', icon: 'ChartBarIcon', href: '/admin-dashboard', group: 'Admin' },
  { label: 'Role Management', icon: 'ShieldCheckIcon', href: '/admin-dashboard', group: 'System' },
  { label: 'Settings', icon: 'Cog6ToothIcon', href: '/admin-dashboard', group: 'System' },
];

const groups = ['Overview', 'Academics', 'Intelligence', 'Admin', 'System'];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  activeRoute?: string;
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, activeRoute }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col bg-white border-r border-border sidebar-transition z-20 flex-shrink-0
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        `}
        style={{ boxShadow: '1px 0 0 0 #E5E7EB' }}
      >
        <SidebarContent collapsed={collapsed} activeRoute={activeRoute} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 flex flex-col bg-white border-r border-border z-40 w-[240px] lg:hidden sidebar-transition
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-card-indigo flex items-center justify-center">
              <span className="text-white font-800 text-sm">E</span>
            </div>
            <span className="font-700 text-base text-foreground tracking-tight">EduPerform</span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close sidebar"
          >
            <Icon name="XMarkIcon" size={18} className="text-muted-foreground" />
          </button>
        </div>
        <SidebarContent collapsed={false} activeRoute={activeRoute} />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed, activeRoute }: { collapsed: boolean; activeRoute?: string }) {
  const { user, userRole } = useAuth();
  const displayName = user?.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User';

  const roleColors: Record<string, string> = {
    admin: 'gradient-card-indigo',
    teacher: 'gradient-card-violet',
    student: 'gradient-card-emerald',
  };
  const avatarGradient = roleColors[userRole ?? ''] ?? 'gradient-card-indigo';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={`flex items-center border-b border-border flex-shrink-0 ${collapsed ? 'justify-center px-0 py-4' : 'gap-2.5 px-4 py-3.5'}`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl gradient-card-indigo flex items-center justify-center">
            <span className="text-white font-800 text-base">E</span>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 rounded-xl gradient-card-indigo flex items-center justify-center flex-shrink-0">
              <span className="text-white font-800 text-sm">E</span>
            </div>
            <div>
              <span className="font-700 text-sm text-foreground tracking-tight">EduPerform</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Academic Platform</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group);
          return (
            <div key={`group-${group}`} className="mb-4">
              {!collapsed && (
                <p className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground/70 px-2.5 mb-1.5">
                  {group}
                </p>
              )}
              {collapsed && <div className="w-6 h-px bg-border mx-auto mb-2" />}
              {items.map((item) => {
                const isActive = activeRoute === item.href;
                return (
                  <Link
                    key={`nav-${item.label}`}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 px-2.5 py-2 rounded-xl mb-0.5 transition-all duration-150 group relative
                      ${isActive
                        ? 'nav-item-active font-600' :'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                  >
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon
                      name={item.icon as Parameters<typeof Icon>[0]['name']}
                      size={17}
                      className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'}
                    />
                    {!collapsed && (
                      <>
                        <span className="text-[13px] flex-1 leading-none">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-700 bg-primary text-white rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className={`border-t border-border flex-shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center gap-2.5 rounded-xl p-2 hover:bg-muted transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-8 h-8 rounded-xl ${avatarGradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-xs font-700 text-white">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-600 text-foreground truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}