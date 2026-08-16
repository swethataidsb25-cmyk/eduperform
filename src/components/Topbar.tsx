'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  pageTitle?: string;
  breadcrumb?: string;
}

export default function Topbar({ onMenuClick, onToggleSidebar, sidebarCollapsed, pageTitle, breadcrumb }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/sign-up-login-screen');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const displayName = user?.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : '';

  const roleColors: Record<string, string> = {
    admin: 'gradient-card-indigo',
    teacher: 'gradient-card-violet',
    student: 'gradient-card-emerald',
  };
  const avatarGradient = roleColors[userRole ?? ''] ?? 'gradient-card-indigo';

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    teacher: 'bg-violet-50 text-violet-700 border border-violet-200',
    student: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };
  const roleBadge = roleBadgeColors[userRole ?? ''] ?? 'bg-muted text-muted-foreground';

  return (
    <header className="h-[60px] bg-white border-b border-border flex items-center px-4 gap-3 flex-shrink-0 z-10" style={{ boxShadow: '0 1px 0 0 #E5E7EB' }}>
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Icon name="Bars3Icon" size={20} className="text-muted-foreground" />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex p-2 rounded-xl hover:bg-muted transition-colors"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name="Bars3Icon" size={18} className="text-muted-foreground" />
      </button>

      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">EduPerform</span>
        <Icon name="ChevronRightIcon" size={13} className="text-muted-foreground/50" />
        <span className="text-foreground font-600">{pageTitle ?? 'Dashboard'}</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground w-56 cursor-pointer hover:bg-border/60 transition-colors group">
        <Icon name="MagnifyingGlassIcon" size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="flex-1 text-[13px]">Search students…</span>
        <kbd className="text-[10px] bg-white border border-border rounded-md px-1.5 py-0.5 text-muted-foreground font-mono">⌘K</kbd>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
          className="relative p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Icon name="BellIcon" size={18} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-negative rounded-full border-2 border-white" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-2xl shadow-modal z-50 fade-in overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="font-600 text-sm text-foreground">Notifications</span>
                <span className="text-[10px] font-700 bg-primary text-white rounded-full px-1.5 py-0.5">4</span>
              </div>
              <button className="text-xs text-primary font-500 hover:underline" onClick={() => setNotifOpen(false)}>Mark all read</button>
            </div>
            <div className="divide-y divide-border max-h-72 overflow-y-auto scrollbar-thin">
              {[
                { icon: 'ExclamationTriangleIcon', color: 'text-negative', bg: 'bg-red-50', msg: 'Marcus Webb attendance below 70%', time: '2m ago' },
                { icon: 'SparklesIcon', color: 'text-primary', bg: 'bg-indigo-50', msg: 'AI flagged 3 new at-risk students', time: '18m ago' },
                { icon: 'DocumentTextIcon', color: 'text-warning', bg: 'bg-amber-50', msg: '14 assignments pending grading', time: '1h ago' },
                { icon: 'CheckCircleIcon', color: 'text-positive', bg: 'bg-emerald-50', msg: 'Grade 10B exam results published', time: '3h ago' },
              ].map((n, i) => (
                <div key={`notif-${i}`} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className={`w-8 h-8 rounded-xl ${n.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon name={n.icon as Parameters<typeof Icon>[0]['name']} size={14} className={n.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground leading-snug">{n.msg}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">View all notifications →</span>
            </div>
          </div>
        )}
      </div>

      {/* User avatar + dropdown */}
      <div className="relative">
        <button
          onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-muted transition-colors"
          aria-label="User menu"
        >
          <div className={`w-8 h-8 rounded-xl ${avatarGradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-xs font-700 text-white">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[13px] font-600 text-foreground leading-tight">{displayName}</p>
            {roleLabel && (
              <span className={`text-[10px] font-600 rounded-full px-1.5 py-0.5 ${roleBadge}`}>{roleLabel}</span>
            )}
          </div>
          <Icon name="ChevronDownIcon" size={13} className="text-muted-foreground hidden sm:block" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-2xl shadow-modal z-50 fade-in overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-[13px] font-600 text-foreground truncate">{user?.email ?? 'User'}</p>
              {roleLabel && <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>}
            </div>
            <div className="py-1.5">
              <Link
                href="/admin-dashboard"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Icon name="HomeIcon" size={13} className="text-primary" />
                </div>
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-negative hover:bg-red-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <Icon name="ArrowRightOnRectangleIcon" size={13} className="text-negative" />
                </div>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}