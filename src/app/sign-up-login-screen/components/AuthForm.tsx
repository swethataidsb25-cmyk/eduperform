'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type TabType = 'login' | 'signup';
type RoleType = 'admin' | 'teacher' | 'student';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData {
  fullName: string;
  email: string;
  role: RoleType;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

const demoCredentials = [
  { role: 'Admin' as const, email: 'sarah.admin@eduperform.io', password: 'Admin@2026', route: '/admin-dashboard' },
  { role: 'Teacher' as const, email: 'james.teacher@eduperform.io', password: 'Teach@2026', route: '/teacher-dashboard' },
  { role: 'Student' as const, email: 'priya.student@eduperform.io', password: 'Study@2026', route: '/student-dashboard' },
];

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin-dashboard',
  teacher: '/teacher-dashboard',
  student: '/student-dashboard',
};

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<TabType>('login');

  return (
    <div className="slide-up">
      {/* Logo mark for mobile */}
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
        <div className="w-9 h-9 rounded-xl gradient-card-indigo flex items-center justify-center">
          <span className="text-white font-800 text-base">E</span>
        </div>
        <span className="font-700 text-lg text-foreground">EduPerform</span>
      </div>

      <div className="mb-7">
        <h2 className="text-[1.6rem] font-700 text-foreground leading-tight mb-1.5">
          {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {activeTab === 'login' ? 'Sign in to your EduPerform workspace' : 'Join your school on EduPerform'}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-muted rounded-2xl p-1.5 mb-7">
        {(['login', 'signup'] as TabType[]).map((tab) => (
          <button
            key={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[13px] font-600 rounded-xl transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {activeTab === 'login' ? (
        <LoginForm />
      ) : (
        <SignupForm onSuccess={() => setActiveTab('login')} />
      )}

      <DemoCredentials activeTab={activeTab} />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        const role = profile?.role ?? 'student';
        router.push(ROLE_ROUTES[role] ?? '/student-dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-[13px] font-600 text-foreground mb-1.5">
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border text-sm bg-white text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
            error ? 'border-red-300 bg-red-50/30' : 'border-border hover:border-primary/40'
          }`}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="login-password" className="block text-[13px] font-600 text-foreground mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm bg-white text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              error ? 'border-red-300 bg-red-50/30' : 'border-border hover:border-primary/40'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <Icon name="ExclamationCircleIcon" size={13} className="text-negative flex-shrink-0" />
            <p className="text-xs text-negative">{error}</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 gradient-card-indigo text-white text-sm font-600 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm"
      >
        {loading ? (
          <>
            <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign In to EduPerform'
        )}
      </button>
    </form>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    role: 'student',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});

  const validate = () => {
    const errs: Partial<Record<keyof SignupFormData, string>> = {};
    if (!formData.fullName || formData.fullName.length < 2) errs.fullName = 'Name must be at least 2 characters';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.password || formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!/(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) errs.password = 'Must include uppercase, number, and symbol';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!formData.terms) errs.terms = 'You must accept the terms to continue';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError(null);
    try {
      await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        role: formData.role,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof SignupFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm bg-white text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
      hasError ? 'border-red-300 bg-red-50/30' : 'border-border hover:border-primary/40'
    }`;

  const fieldError = (key: keyof SignupFormData) =>
    fieldErrors[key] ? (
      <p className="text-xs text-negative mt-1.5 flex items-center gap-1">
        <Icon name="ExclamationCircleIcon" size={12} />{fieldErrors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-negative flex items-center gap-2">
          <Icon name="ExclamationCircleIcon" size={14} />
          {error}
        </div>
      )}

      <div>
        <label htmlFor="signup-name" className="block text-[13px] font-600 text-foreground mb-1.5">Full name</label>
        <input id="signup-name" type="text" placeholder="Priya Sharma" value={formData.fullName} onChange={set('fullName')} className={inputClass(!!fieldErrors.fullName)} />
        {fieldError('fullName')}
      </div>

      <div>
        <label htmlFor="signup-email" className="block text-[13px] font-600 text-foreground mb-1.5">School email</label>
        <input id="signup-email" type="email" placeholder="you@school.edu" value={formData.email} onChange={set('email')} className={inputClass(!!fieldErrors.email)} />
        {fieldError('email')}
      </div>

      <div>
        <label htmlFor="signup-role" className="block text-[13px] font-600 text-foreground mb-1.5">Role</label>
        <select id="signup-role" value={formData.role} onChange={set('role')} className="w-full px-4 py-3 rounded-xl border border-border text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:border-primary/40">
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-[13px] font-600 text-foreground mb-1">Password</label>
        <p className="text-[11px] text-muted-foreground mb-1.5">Min 8 chars with uppercase, number, and symbol</p>
        <div className="relative">
          <input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={set('password')} className={inputClass(!!fieldErrors.password) + ' pr-11'} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
          </button>
        </div>
        {fieldError('password')}
      </div>

      <div>
        <label htmlFor="signup-confirm" className="block text-[13px] font-600 text-foreground mb-1.5">Confirm password</label>
        <input id="signup-confirm" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={set('confirmPassword')} className={inputClass(!!fieldErrors.confirmPassword)} />
        {fieldError('confirmPassword')}
      </div>

      <div>
        <div className="flex items-start gap-2.5">
          <input id="terms" type="checkbox" checked={formData.terms} onChange={set('terms')} className="w-4 h-4 mt-0.5 rounded border-border accent-primary cursor-pointer" />
          <label htmlFor="terms" className="text-[13px] text-muted-foreground cursor-pointer select-none leading-snug">
            I agree to the <span className="text-primary hover:underline cursor-pointer font-500">Terms of Service</span> and <span className="text-primary hover:underline cursor-pointer font-500">Privacy Policy</span>
          </label>
        </div>
        {fieldError('terms')}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 gradient-card-indigo text-white text-sm font-600 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm"
      >
        {loading ? (
          <><Icon name="ArrowPathIcon" size={16} className="animate-spin" />Creating account…</>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}

function DemoCredentials({ activeTab }: { activeTab: TabType }) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (activeTab !== 'login') return null;

  return (
    <div className="mt-6 border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/60 border-b border-border flex items-center gap-2">
        <Icon name="KeyIcon" size={13} className="text-muted-foreground" />
        <span className="text-[11px] font-600 text-muted-foreground uppercase tracking-wider">Demo Credentials</span>
      </div>
      <div className="divide-y divide-border">
        {demoCredentials.map((cred) => (
          <DemoCredentialRow key={`cred-${cred.role}`} cred={cred} copied={copied} onCopy={handleCopy} />
        ))}
      </div>
    </div>
  );
}

function DemoCredentialRow({
  cred,
  copied,
  onCopy,
}: {
  cred: (typeof demoCredentials)[number];
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const roleColors: Record<string, string> = {
    Admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    Teacher: 'bg-violet-50 text-violet-700 border border-violet-200',
    Student: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  const handleUse = () => {
    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;
    if (emailInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(emailInput, cred.email);
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (passwordInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(passwordInput, cred.password);
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
      <span className={`text-[10px] font-600 px-2 py-0.5 rounded-full ${roleColors[cred.role]}`}>
        {cred.role}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono-data text-foreground truncate">{cred.email}</p>
        <p className="text-xs font-mono-data text-muted-foreground">{cred.password}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onCopy(cred.email, `email-${cred.role}`)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="Copy email"
        >
          <Icon
            name={copied === `email-${cred.role}` ? 'CheckIcon' : 'ClipboardIcon'}
            size={13}
            className={copied === `email-${cred.role}` ? 'text-positive' : 'text-muted-foreground'}
          />
        </button>
        <button
          type="button"
          onClick={handleUse}
          className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-600 rounded-lg hover:bg-primary/20 transition-all active:scale-95"
        >
          Use
        </button>
      </div>
    </div>
  );
}