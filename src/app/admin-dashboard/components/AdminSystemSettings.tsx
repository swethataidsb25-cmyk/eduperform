'use client';

import React, { useState } from 'react';

interface SettingSection {
  id: string;
  title: string;
  icon: string;
  description: string;
}

const sections: SettingSection[] = [
  { id: 'general', title: 'General Settings', icon: '⚙️', description: 'Institution name, academic year, term configuration' },
  { id: 'notifications', title: 'Notifications', icon: '🔔', description: 'Email alerts, push notifications, report delivery' },
  { id: 'security', title: 'Security & Access', icon: '🔒', description: 'Password policies, session timeout, 2FA settings' },
  { id: 'data', title: 'Data & Backup', icon: '💾', description: 'Export data, backup schedules, data retention' },
  { id: 'integrations', title: 'Integrations', icon: '🔗', description: 'AI services, email providers, third-party tools' },
];

export default function AdminSystemSettings() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    institutionName: 'Westfield Academy',
    academicYear: '2025–2026',
    currentTerm: 'Term 3',
    timezone: 'UTC+0',
    language: 'English',
    emailNotifications: true,
    attendanceAlerts: true,
    gradeAlerts: false,
    aiReportAlerts: true,
    sessionTimeout: '30',
    twoFactorAuth: false,
    passwordMinLength: '8',
    dataRetentionYears: '5',
    autoBackup: true,
    backupFrequency: 'weekly',
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground";
  const labelClass = "text-xs font-500 text-muted-foreground mb-1 block";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-600 text-foreground">System Settings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Configure institution-wide settings</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-500 rounded-lg transition-all active:scale-95 ${saved ? 'bg-positive text-white' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <div className="lg:col-span-1 space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                activeSection === s.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="text-base">{s.icon}</span>
              <span className="text-sm font-500">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
          {activeSection === 'general' && (
            <div className="space-y-4">
              <h4 className="text-sm font-600 text-foreground border-b border-border pb-3">General Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Institution Name</label>
                  <input type="text" value={settings.institutionName} onChange={(e) => setSettings((s) => ({ ...s, institutionName: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Academic Year</label>
                  <input type="text" value={settings.academicYear} onChange={(e) => setSettings((s) => ({ ...s, academicYear: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Current Term</label>
                  <select value={settings.currentTerm} onChange={(e) => setSettings((s) => ({ ...s, currentTerm: e.target.value }))} className={inputClass}>
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Timezone</label>
                  <select value={settings.timezone} onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))} className={inputClass}>
                    <option>UTC+0</option>
                    <option>UTC+1</option>
                    <option>UTC+5:30</option>
                    <option>UTC-5</option>
                    <option>UTC-8</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Language</label>
                  <select value={settings.language} onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value }))} className={inputClass}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Arabic</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <h4 className="text-sm font-600 text-foreground border-b border-border pb-3">Notification Settings</h4>
              <div className="space-y-3">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email alerts for important events' },
                  { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Alert when student attendance drops below threshold' },
                  { key: 'gradeAlerts', label: 'Grade Alerts', desc: 'Notify when student grades fall below passing' },
                  { key: 'aiReportAlerts', label: 'AI Report Alerts', desc: 'Notify when new AI reports are generated' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div>
                      <p className="text-sm font-500 text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-4">
              <h4 className="text-sm font-600 text-foreground border-b border-border pb-3">Security & Access</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Session Timeout (minutes)</label>
                  <input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings((s) => ({ ...s, sessionTimeout: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Minimum Password Length</label>
                  <input type="number" value={settings.passwordMinLength} onChange={(e) => setSettings((s) => ({ ...s, passwordMinLength: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div>
                  <p className="text-sm font-500 text-foreground">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <button
                  onClick={() => setSettings((s) => ({ ...s, twoFactorAuth: !s.twoFactorAuth }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settings.twoFactorAuth ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.twoFactorAuth ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-4">
              <h4 className="text-sm font-600 text-foreground border-b border-border pb-3">Data & Backup</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Data Retention (years)</label>
                  <input type="number" value={settings.dataRetentionYears} onChange={(e) => setSettings((s) => ({ ...s, dataRetentionYears: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Backup Frequency</label>
                  <select value={settings.backupFrequency} onChange={(e) => setSettings((s) => ({ ...s, backupFrequency: e.target.value }))} className={inputClass}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div>
                  <p className="text-sm font-500 text-foreground">Automatic Backups</p>
                  <p className="text-xs text-muted-foreground">Automatically backup data on schedule</p>
                </div>
                <button
                  onClick={() => setSettings((s) => ({ ...s, autoBackup: !s.autoBackup }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settings.autoBackup ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.autoBackup ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-sm font-500 rounded-lg hover:bg-muted/80 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export All Data
              </button>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="space-y-4">
              <h4 className="text-sm font-600 text-foreground border-b border-border pb-3">Integrations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>AI Provider</label>
                  <select value={settings.aiProvider} onChange={(e) => setSettings((s) => ({ ...s, aiProvider: e.target.value }))} className={inputClass}>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>AI Model</label>
                  <select value={settings.aiModel} onChange={(e) => setSettings((s) => ({ ...s, aiModel: e.target.value }))} className={inputClass}>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
              </div>
              <div className="p-3 bg-positive/10 border border-positive/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
                  <p className="text-xs font-500 text-positive">OpenAI Connected</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">API key configured and active</p>
              </div>
              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <p className="text-xs font-500 text-muted-foreground">Supabase Connected</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Database and auth configured</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
