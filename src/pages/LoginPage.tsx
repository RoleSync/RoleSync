import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  User as UserIcon, 
  Phone, 
  Eye, 
  EyeOff, 
  Shield, 
  Sparkles,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'company' | 'auth';
type Mode = 'login' | 'signup';
type CredentialType = 'email' | 'employee_code';

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  login_preference?: 'email' | 'id' | 'both';
}

export default function LoginPage() {
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('company');
  const [mode, setMode] = useState<Mode>('login');
  const [credentialType, setCredentialType] = useState<CredentialType>('email');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Company search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CompanyOption | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Auth fields
  const [emailOrCode, setEmailOrCode] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const target = user.role === 'super_admin' ? '/super-admin'
        : user.role === 'admin' ? '/admin'
        : (user.status === 'approved' ? '/employee' : '/pending');
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Debounced company search
  useEffect(() => {
    if (selected) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase.from('companies')
        .select('id, name, slug, login_preference')
        .eq('status', 'active')
        .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
        .order('name')
        .limit(8);
      
      const fetchedResults = (data as CompanyOption[]) ?? [];
      
      if (q.toLowerCase() === 'rolesync' || 'rolesync'.includes(q.toLowerCase()) || q.toLowerCase() === 'role' || q.toLowerCase() === 'sync') {
        if (!fetchedResults.some(r => r.slug === 'rolesync')) {
          fetchedResults.push({
            id: 'a4dce0e6-f11e-4054-9b55-4b94f7f5143b',
            name: 'RoleSync',
            slug: 'rolesync',
            login_preference: 'both'
          });
        }
      }

      setResults(fetchedResults);
      setSearching(false);
    }, 200);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, selected]);

  function pickCompany(c: CompanyOption) {
    setSelected(c);
    setQuery(c.name);
    setResults([]);
    setError(null);
    if (c.login_preference === 'id') {
      setCredentialType('employee_code');
    } else {
      setCredentialType('email');
    }
    setStep('auth');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true); setError(null);

    let loginEmail = emailOrCode.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail);

    if (!isEmail || credentialType === 'employee_code') {
      const { data, error: rpcErr } = await (supabase as any).rpc('resolve_email_by_employee_id', {
        p_employee_id: loginEmail.toUpperCase(),
        p_company_slug: selected.slug
      });

      if (rpcErr || !data) {
        setSubmitting(false);
        setError('Invalid login details. Please check your Employee Code / Email and try again.');
        return;
      }
      loginEmail = data;
    }

    const { error: err } = await login(selected.slug, loginEmail, password);
    setSubmitting(false);
    if (err) { setError(err); return; }
    toast.success(`Welcome back to ${selected.name}!`);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSubmitting(true); setError(null);
    const { error: err } = await supabase.auth.signUp({
      email: emailOrCode.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          department: department.trim() || 'General',
          job_title: 'Employee',
          company_id: selected.id,
        },
      },
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    toast.success('Account created — awaiting admin approval.');
    setMode('login'); setPassword(''); setFullName(''); setPhone(''); setDepartment('');
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F9FD] font-sans antialiased">
      {/* Left Column: Brand, Art & Mission */}
      <div className="relative w-full lg:w-[48%] min-h-[460px] lg:min-h-screen bg-gradient-to-b from-[#0B76EC] via-[#096DE0] to-[#0459C2] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden text-white select-none">
        {/* Background decorative circles & sparkles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-[360px] h-[360px] rounded-full border border-white/5 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 text-center pt-2 sm:pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-cyan-300 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-semibold text-cyan-100">Enterprise HRMS</span>
            <Sparkles className="h-4 w-4 text-cyan-300 animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Welcome to RoleSync
          </h1>
          <p className="mt-2 text-base sm:text-lg text-blue-100 font-medium">
            Smart HR for the Modern Workplace
          </p>
        </div>

        {/* Center Artwork / Office Collaboration Illustration */}
        <div className="relative z-10 my-auto py-6 sm:py-10 flex items-center justify-center">
          <div className="relative w-full max-w-[440px] aspect-[4/3]">
            {/* SVG Illustration of Team & Analytics */}
            <svg viewBox="0 0 500 380" className="w-full h-full drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Analytics Whiteboard Backing */}
              <rect x="120" y="30" width="260" height="150" rx="8" fill="#FFFFFF" fillOpacity="0.95" />
              <rect x="135" y="45" width="70" height="8" rx="4" fill="#E2E8F0" />
              <rect x="135" y="60" width="100" height="5" rx="2" fill="#CBD5E1" />
              {/* Chart Bars */}
              <rect x="250" y="85" width="16" height="55" rx="3" fill="#0284C7" />
              <rect x="274" y="65" width="16" height="75" rx="3" fill="#0EA5E9" />
              <rect x="298" y="50" width="16" height="90" rx="3" fill="#38BDF8" />
              <rect x="322" y="70" width="16" height="70" rx="3" fill="#7DD3FC" />
              {/* Trend Line */}
              <path d="M140 120 L180 100 L210 110 L260 70 L340 45" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="340" cy="45" r="5" fill="#F59E0B" />
              
              {/* Meeting Desk (Perspective) */}
              <polygon points="60,240 440,240 490,320 10,320" fill="#FFFFFF" fillOpacity="0.95" />
              <polygon points="10,320 490,320 490,332 10,332" fill="#E2E8F0" />

              {/* Laptops on Desk */}
              <rect x="160" y="250" width="45" height="28" rx="2" fill="#38BDF8" />
              <polygon points="152,278 213,278 208,284 157,284" fill="#94A3B8" />

              <rect x="300" y="252" width="45" height="28" rx="2" fill="#0284C7" />
              <polygon points="292,280 353,280 348,286 297,286" fill="#94A3B8" />

              {/* Team Member 1 (Left - Orange/Blue) */}
              <circle cx="95" cy="190" r="20" fill="#FDBA74" />
              <path d="M75 190 Q95 160 115 190 Z" fill="#1E293B" />
              <path d="M60 270 Q60 220 95 220 Q130 220 130 270 Z" fill="#F97316" />
              <path d="M80 270 L80 310" stroke="#0284C7" strokeWidth="12" strokeLinecap="round" />

              {/* Team Member 2 (Right - Yellow/Teal) */}
              <circle cx="410" cy="185" r="20" fill="#FDBA74" />
              <path d="M390 185 Q410 155 430 185 Z" fill="#854D0E" />
              <path d="M375 265 Q375 215 410 215 Q445 215 445 265 Z" fill="#EAB308" />
              <path d="M400 265 L420 310" stroke="#0D9488" strokeWidth="12" strokeLinecap="round" />

              {/* Team Member 3 (Center Bottom - Blue) */}
              <circle cx="230" cy="275" r="22" fill="#FDBA74" />
              <path d="M210 270 Q230 240 250 270 Z" fill="#0F172A" />
              <path d="M190 355 Q190 305 230 305 Q270 305 270 355 Z" fill="#2563EB" />

              {/* Modern Decorative UI Floating Tags */}
              <g transform="translate(40, 110)">
                <rect width="65" height="24" rx="12" fill="#0284C7" fillOpacity="0.8" />
                <text x="32" y="16" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">★ Active</text>
              </g>

              <g transform="translate(390, 80)">
                <rect width="70" height="24" rx="12" fill="#10B981" fillOpacity="0.9" />
                <text x="35" y="16" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">99.9% Live</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Bottom Mission Card Overlay */}
        <div className="relative z-20 w-full max-w-md mx-auto -mb-4 sm:-mb-6">
          <div className="relative bg-white rounded-full sm:rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 border border-white/40">
            {/* Top Cyan Quote */}
            <span className="absolute top-2 left-6 text-5xl sm:text-6xl font-serif text-[#00A3FF] leading-none select-none">
              “
            </span>

            <div className="text-center pt-2 sm:pt-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                Our Mission
              </h2>
              <p className="text-sm sm:text-base font-semibold text-slate-700 leading-snug px-2">
                To Build Connected, Empowered and Engaged Workplaces.
              </p>
            </div>

            {/* Bottom Cyan Quote */}
            <span className="absolute bottom-0 right-6 text-5xl sm:text-6xl font-serif text-[#00A3FF] leading-none select-none">
              ”
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form Card */}
      <div className="relative flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 min-h-screen">
        {/* Subtle Ambient Decorative Graphics on right background */}
        <div className="absolute top-12 right-12 w-64 h-64 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 right-20 w-80 h-80 rounded-full bg-slate-200/40 blur-2xl pointer-events-none" />
        
        <div className="w-full max-w-[460px] relative z-10">
          {/* Main White Floating Card */}
          <div className="bg-white rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.06)] border border-slate-100/80 p-8 sm:p-10 transition-all">
            {step === 'company' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Sign in to your account
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Enter your company name or company code to proceed
                  </p>
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="company-search" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Company Name or Code *
                  </Label>
                  <div className="relative">
                    <Input
                      id="company-search"
                      autoFocus
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                      placeholder="e.g. Bankoraa, TechnoML, RoleSync"
                      autoComplete="off"
                      className="h-12 bg-[#EEF4FE] border-transparent focus:border-[#0078FF] focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl transition-all"
                    />
                    <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Search Results Dropdown */}
                  {(results.length > 0 || searching) && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {searching && (
                        <div className="px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#0078FF]" /> Searching companies…
                        </div>
                      )}
                      {results.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickCompany(c)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50/80 flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                            <p className="text-xs text-slate-500 font-mono truncate">{c.slug}</p>
                          </div>
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-[#0078FF]">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searching && query.trim() && results.length === 0 && !selected && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> No company found. Check spelling or ask your administrator.
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
                  <button
                    type="button"
                    onClick={() => { setSelected({ id: 'platform', name: 'RoleSync Admin', slug: 'platform' }); setStep('auth'); }}
                    className="text-xs font-semibold text-[#0078FF] hover:underline flex items-center gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5" /> Are you a Platform Super Admin?
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
                {/* Back to company selector */}
                <button
                  type="button"
                  onClick={() => { setStep('company'); setError(null); setSelected(null); setQuery(''); }}
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#0078FF] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Change Company ({selected?.name})
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {mode === 'login' ? `Sign in to your ${selected?.name} account` : `Create your ${selected?.name} account`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {mode === 'login' ? 'Enter your credentials below to access your workspace' : 'Submit your details for administrator approval'}
                  </p>
                </div>

                {/* Radio Selector: Work Email vs Employee Code (Matches Image) */}
                {mode === 'login' && (
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="credentialType"
                        value="email"
                        checked={credentialType === 'email'}
                        onChange={() => setCredentialType('email')}
                        className="w-4 h-4 text-[#0078FF] focus:ring-[#0078FF] border-slate-300"
                      />
                      Work Email
                    </label>

                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="credentialType"
                        value="employee_code"
                        checked={credentialType === 'employee_code'}
                        onChange={() => setCredentialType('employee_code')}
                        className="w-4 h-4 text-[#0078FF] focus:ring-[#0078FF] border-slate-300"
                      />
                      Employee Code
                    </label>
                  </div>
                )}

                {/* Signup additional inputs */}
                {mode === 'signup' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full-name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Full Name *
                      </Label>
                      <Input
                        id="full-name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="h-11 bg-[#EEF4FE] border-transparent focus:border-[#0078FF] focus:bg-white text-slate-900 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="h-11 bg-[#EEF4FE] border-transparent focus:border-[#0078FF] focus:bg-white text-slate-900 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dept" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Department
                        </Label>
                        <Input
                          id="dept"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="Engineering"
                          className="h-11 bg-[#EEF4FE] border-transparent focus:border-[#0078FF] focus:bg-white text-slate-900 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email / Employee Code input with distinctive light blue background */}
                <div className="space-y-1.5">
                  <Label htmlFor="login-identity" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {mode === 'signup' ? 'Work Email *' : credentialType === 'email' ? 'Email *' : 'Employee Code *'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-identity"
                      required
                      type={credentialType === 'email' || mode === 'signup' ? 'email' : 'text'}
                      value={emailOrCode}
                      onChange={(e) => setEmailOrCode(e.target.value)}
                      placeholder={
                        mode === 'signup' ? 'name@company.com'
                        : credentialType === 'email' ? 'name@company.com'
                        : 'e.g. EMP-101'
                      }
                      className="h-12 bg-[#EEF4FE] border-transparent focus:border-[#0078FF] focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl font-medium transition-all"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      {credentialType === 'email' || mode === 'signup' ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Password input with Eye toggle */}
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="h-12 bg-[#EEF4FE] border-transparent focus:border-[#0078FF] focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl pr-11 font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                {mode === 'login' && (
                  <div className="text-left">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-[#0078FF] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="rounded-xl bg-red-50 border-red-200 text-red-700">
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Bright Blue SIGN IN Button (Matches Qandle image) */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-[#0078FF] hover:bg-[#0066DB] text-white font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2 text-sm"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                      <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                    </>
                  )}
                </Button>

                {/* Mode toggle */}
                <div className="text-center text-xs text-slate-500 pt-2">
                  {mode === 'login' ? (
                    <>
                      New team member at {selected?.name}?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('signup'); setError(null); }}
                        className="text-[#0078FF] font-bold hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(null); }}
                        className="text-[#0078FF] font-bold hover:underline"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Clean Footer (Matches Qandle image) */}
          <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-medium">
              © {new Date().getFullYear()} RoleSync (RoleSync Technologies Pvt. Ltd.)
            </p>
            <div className="flex items-center justify-center gap-3 text-slate-500 font-semibold">
              <a href="#" className="hover:text-[#0078FF] transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-[#0078FF] transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
