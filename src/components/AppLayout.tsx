'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
  pageTitle?: string;
}

export default function AppLayout({ children, activeRoute, pageTitle }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeRoute={activeRoute}
      />

      {/* Main content */}
      <div
        className="flex flex-col flex-1 min-w-0 content-transition"
        style={{ marginLeft: 0 }}
      >
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-background">
          <div className="max-w-screen-2xl mx-auto px-5 lg:px-7 xl:px-9 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}