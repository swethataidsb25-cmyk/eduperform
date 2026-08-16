'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from './components/AuthForm';

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin-dashboard',
  teacher: '/teacher-dashboard',
  student: '/student-dashboard',
};

export default function SignUpLoginPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const route = ROLE_ROUTES[userRole ?? ''] ?? '/student-dashboard';
      router.replace(route);
    }
  }, [user, userRole, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-card-indigo flex items-center justify-center shadow-lg">
            <span className="text-white font-800 text-xl">E</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AuthBrandPanel />
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto bg-white">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}

function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[500px] xl:w-[580px] gradient-brand p-10 xl:p-14 flex-shrink-0 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-violet-500/20 blur-3xl animate-gradient" />
      <div className="absolute bottom-[-60px] left-[-60px] w-96 h-96 rounded-full bg-indigo-400/15 blur-3xl animate-gradient" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-600/10 blur-2xl" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl glass-dark flex items-center justify-center shadow-lg">
          <span className="text-white font-800 text-xl">E</span>
        </div>
        <div>
          <span className="text-white font-700 text-xl tracking-tight">EduPerform</span>
          <p className="text-white/50 text-xs">Academic Intelligence Platform</p>
        </div>
      </div>

      {/* Hero text */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 glass-dark rounded-full px-3 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/80 text-xs font-500">AI-Powered · Real-time · Predictive</span>
        </div>

        <h1 className="text-white font-800 text-3xl xl:text-[2.6rem] leading-[1.15] mb-5">
          Transform Academic<br />
          <span className="text-violet-300">Performance</span> with AI
        </h1>
        <p className="text-white/65 text-base leading-relaxed mb-8">
          Track attendance, assignments, and exams. Get AI-driven insights to identify at-risk students before it&apos;s too late.
        </p>

        {/* Feature list — bento style */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: '📊', label: 'Real-time tracking', desc: 'Attendance & grades live' },
            { icon: '🤖', label: 'AI predictions', desc: 'Risk scoring per student' },
            { icon: '⚡', label: 'Instant alerts', desc: 'At-risk student flags' },
            { icon: '📋', label: 'Smart reports', desc: 'PDF & Excel exports' },
          ].map((f) => (
            <div key={f.label} className="glass-dark rounded-xl p-3.5">
              <span className="text-xl block mb-1.5">{f.icon}</span>
              <p className="text-white text-xs font-600 leading-tight">{f.label}</p>
              <p className="text-white/50 text-[11px] mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="relative z-10 grid grid-cols-3 gap-3">
        {[
          { value: '12,400+', label: 'Students tracked' },
          { value: '94.2%', label: 'AI accuracy' },
          { value: '340+', label: 'Schools enrolled' },
        ].map((s) => (
          <div key={s.label} className="glass-dark rounded-xl p-3.5 text-center">
            <p className="text-white font-700 text-lg font-mono-data">{s.value}</p>
            <p className="text-white/55 text-[11px] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}