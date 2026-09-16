import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, MapPin, ShieldCheck, Calendar, BarChart3, MessageSquare,
  Clock, Target, Bell, Headphones, Star, CheckCircle2, ChevronDown,
  ChevronUp, ArrowRight, Menu, X, Zap, Globe, Smartphone, Lock,
  Award, TrendingUp, FileText, UserCheck, Send, Camera, ListTodo,
  CalendarDays, Coffee, HeartHandshake, Sparkles, Building2,
  FileCheck2, Compass, ShieldAlert, BadgePercent, Cake, PartyPopper
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoleSyncLogo } from "@/components/RoleSyncLogo";

/* ─── Navbar ─── */
function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = [
    { name: "Features", href: "#features" },
    { name: "Platform Showcase", href: "#showcase" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Role Matrix", href: "#roles" },
    { name: "Pricing", href: "/pricing", isRoute: true },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="w-full sticky top-0 z-50 border-b border-white/10 dark:border-white/5 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="w-full flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <RoleSyncLogo size={56} />
        </div>
        
        <div className="hidden gap-7 md:flex items-center">
          {links.map((l) => (
            l.isRoute ? (
              <button 
                key={l.name} 
                onClick={() => navigate(l.href)}
                className="text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-primary"
              >
                {l.name}
              </button>
            ) : (
              <a 
                key={l.name} 
                href={l.href} 
                className="relative py-1 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-200"
              >
                {l.name}
              </a>
            )
          ))}
        </div>

        <div className="hidden gap-3 md:flex items-center">
          <Button variant="ghost" className="hover:bg-primary/10 transition-colors text-sm font-medium" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button 
            className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-medium text-sm" 
            onClick={() => navigate("/login")}
          >
            Start Free Trial <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        <button 
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors" 
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border/60 bg-background/95 backdrop-blur-lg p-4 md:hidden animate-in slide-in-from-top-4 duration-200 shadow-xl">
          {links.map((l) => (
            l.isRoute ? (
              <button
                key={l.name}
                onClick={() => { setOpen(false); navigate(l.href); }}
                className="text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {l.name}
              </button>
            ) : (
              <a 
                key={l.name} 
                href={l.href} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors" 
                onClick={() => setOpen(false)}
              >
                {l.name}
              </a>
            )
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t">
            <Button variant="outline" className="w-full justify-center" onClick={() => { setOpen(false); navigate("/login"); }}>
              Sign In
            </Button>
            <Button className="w-full justify-center bg-gradient-to-r from-primary to-indigo-600" onClick={() => { setOpen(false); navigate("/login"); }}>
              Start Free Trial
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 py-16 lg:py-24 border-b border-border/40">
      <div className="w-full grid items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>RoleSync 2.0 • Complete Workforce & HRMS Suite</span>
          </div>

          <h1 className="font-[Poppins] text-4xl font-bold leading-tight text-foreground lg:text-5xl xl:text-6xl">
            Smart, Unified <span className="text-primary bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Employee Management</span> Platform
          </h1>

          <p className="w-full text-base sm:text-lg text-muted-foreground leading-relaxed">
            Everything your organization needs in one fast, secure cloud: <strong>Face-verified Attendance</strong>, <strong>Live Break Tracking</strong>, <strong>6-Tier Leave Quotas</strong>, <strong>WFH & Regularization Workflows</strong>, <strong>Team Celebrations & Kudos</strong>, and <strong>Indian Payroll Compliance</strong>.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" /> Live Break & Punch Tracking
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" /> 6-Quota Leave Engine
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" /> GPS Geofence & Anti-Spoof
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <PartyPopper className="h-3.5 w-3.5 text-amber-500" /> Celebrations & Kudos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-500" /> Multi-Tenant RLS Security
            </span>
          </div>

          <div className="flex flex-wrap gap-3.5 pt-2">
            <Button size="lg" onClick={() => navigate("/login")} className="gap-2 bg-gradient-to-r from-primary to-indigo-600 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Start 14-Day Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => { const el = document.getElementById("features"); el?.scrollIntoView({ behavior: "smooth" }); }}>
              Explore All Features
            </Button>
          </div>

          {/* Quick Role Access Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground">Direct Role Portals:</span>
            <Button size="sm" variant="secondary" onClick={() => navigate("/login")} className="h-7 gap-1 text-xs rounded-full">
              <UserCheck className="h-3 w-3 text-primary" /> Admin Portal
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate("/login")} className="h-7 gap-1 text-xs rounded-full">
              <Users className="h-3 w-3 text-indigo-500" /> Employee Portal
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate("/login")} className="h-7 gap-1 text-xs rounded-full">
              <ShieldCheck className="h-3 w-3 text-amber-500" /> Super Admin
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> No credit card required</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> 1-Click Instant Setup</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> EPF / ESI / PT Compliant</span>
          </div>
        </div>

        <div className="relative w-full">
          <div className="relative rounded-2xl p-1 bg-gradient-to-br from-primary/30 via-indigo-500/20 to-border shadow-2xl">
            <img 
              src={heroDashboard} 
              alt="RoleSync Modern Employee Dashboard" 
              width={1280} 
              height={800} 
              className="w-full rounded-xl object-cover shadow-inner ring-1 ring-border" 
            />
            {/* Overlay badge preview */}
            <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-3 rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Live Work Hours Tracker</p>
                <p className="text-[11px] text-muted-foreground">8 hrs 42 mins • In Office</p>
              </div>
            </div>
            
            <div className="absolute -top-4 -right-4 hidden sm:flex items-center gap-3 rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Cake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Team Birthday Radar</p>
                <p className="text-[11px] text-muted-foreground">2 Celebrations This Week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Bar ─── */
function StatsBar() {
  const stats = [
    { label: "Active Enterprises", value: "500+", icon: Building2, desc: "Across India & Global" },
    { label: "Daily Check-Ins", value: "50,000+", icon: UserCheck, desc: "Face & Geofence Verified" },
    { label: "Platform Uptime", value: "99.99%", icon: Zap, desc: "Enterprise SLA" },
    { label: "Leave & HR Quotas", value: "6 Categories", icon: CalendarDays, desc: "Automated Balances" },
  ];

  return (
    <section className="w-full border-y border-border/60 bg-card/60 backdrop-blur-sm py-8">
      <div className="w-full grid grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 text-center group">
            <div className="p-2 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <s.icon className="h-6 w-6 text-primary" />
            </div>
            <span className="font-[Poppins] text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{s.value}</span>
            <span className="text-sm font-semibold text-foreground">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Interactive Feature Showcase Tabs ─── */
function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState("attendance");

  const showcaseData: Record<string, {
    title: string;
    subtitle: string;
    badge: string;
    points: { icon: any; title: string; desc: string }[];
    mockPreview: {
      header: string;
      metrics: { label: string; val: string; color: string }[];
      statusText: string;
    };
  }> = {
    attendance: {
      title: "Smart Time, Attendance & Break Engine",
      subtitle: "Biometric face verification with liveness anti-spoofing and microsecond precision break tracking.",
      badge: "Real-Time Tracking",
      points: [
        { icon: Camera, title: "Selfie Clock-In & Face Liveness", desc: "Dual verification using instant front camera selfie and geo-coordinate locking." },
        { icon: Coffee, title: "Live Break Session Timer", desc: "Start and resume coffee or lunch breaks with active duration counter (HH:MM:SS)." },
        { icon: MapPin, title: "Geofence Radius Enforcement", desc: "Define precise office bounds to ensure employees only punch within designated zones." },
        { icon: BarChart3, title: "Recharts Work Hours Analytics", desc: "Interactive bar charts displaying weekly logged hours, overtime, and daily targets." }
      ],
      mockPreview: {
        header: "Live Employee Punch State",
        metrics: [
          { label: "Today's Status", val: "Clocked In (09:12 AM)", color: "text-emerald-500" },
          { label: "Current Break", val: "Coffee Break (14m 20s)", color: "text-amber-500" },
          { label: "Total Logged", val: "7h 45m / 8h 00m", color: "text-primary" }
        ],
        statusText: "📍 Office Geofence Verified (98.4% On-time score)"
      }
    },
    leave: {
      title: "Comprehensive 6-Tier Leave & Holiday Quota Engine",
      subtitle: "End-to-end leave management with quota donut progress rings, holiday calendars, and instant CSV exports.",
      badge: "Automated Quotas",
      points: [
        { icon: CalendarDays, title: "6 Dedicated Quota Categories", desc: "Bereavement, Casual, Earned (Annual), LWP, Menstrual, and Sick leave tracking." },
        { icon: Target, title: "Dynamic Balance Rings", desc: "Visual donut completion rings tracking consumed vs available annual leave balances." },
        { icon: Clock, title: "SLA Escalation Countdown", desc: "Configurable SLA timers ensure leave requests are approved or flagged within hours." },
        { icon: FileText, title: "Instant CSV & Calendar Sync", desc: "Download company leave logs and view the complete 2026 holiday calendar." }
      ],
      mockPreview: {
        header: "Leave Balance & Quotas",
        metrics: [
          { label: "Casual Leave", val: "8 / 12 Days Avail", color: "text-indigo-500" },
          { label: "Sick Leave", val: "10 / 10 Days Avail", color: "text-emerald-500" },
          { label: "Earned Leave", val: "14 / 18 Days Avail", color: "text-sky-500" }
        ],
        statusText: "✨ 2026 Public Holidays Synced • 0 SLA Breaches"
      }
    },
    governance: {
      title: "Workforce Governance, Regularization & WFH",
      subtitle: "Empower employees to submit attendance corrections and remote work requests with transparent approvals.",
      badge: "Governance & Approvals",
      points: [
        { icon: FileCheck2, title: "Attendance Regularization", desc: "Allow employees to submit punch correction requests with timestamps and manager remarks." },
        { icon: Globe, title: "Work From Home (WFH) Approvals", desc: "Streamline hybrid workforce scheduling with flexible WFH requests and status rings." },
        { icon: ShieldAlert, title: "Anti-Mock Location Guard", desc: "Detects and blocks GPS faker extensions and location spoofing attempts automatically." },
        { icon: ArrowRight, title: "Multi-Tier Approval Chains", desc: "Route requests seamlessly from Team Lead → Department Manager → HR Admin." }
      ],
      mockPreview: {
        header: "Regularization & WFH Pipeline",
        metrics: [
          { label: "WFH Requests", val: "1 Pending (Lead Review)", color: "text-amber-500" },
          { label: "Punch Correction", val: "Approved Yesterday", color: "text-emerald-500" },
          { label: "Approval Speed", val: "Avg 2.4 Hours", color: "text-primary" }
        ],
        statusText: "🛡️ 100% Audit trail logged for HR compliance"
      }
    },
    culture: {
      title: "Team Culture, Recognition & Celebrations",
      subtitle: "Nurture high morale with birthday notifications, work anniversary milestones, and peer kudos badges.",
      badge: "Culture & Connection",
      points: [
        { icon: Cake, title: "Real-Time Celebrations Radar", desc: "Celebrate team member birthdays and work milestones with automated team announcements." },
        { icon: Star, title: "Kudos & Peer Recognition Wall", desc: "Award Star, Helpful, MVP, and Innovator badges with custom peer appreciation notes." },
        { icon: MessageSquare, title: "Secure Tenant-Scoped Chat", desc: "Real-time team messaging isolated per company with Office Updates broadcast channel." },
        { icon: Headphones, title: "Integrated Helpdesk Ticketing", desc: "Fast resolution of HR, IT, and administrative issues with priority tagging." }
      ],
      mockPreview: {
        header: "Team Celebrations & Kudos",
        metrics: [
          { label: "Birthdays Today", val: "🎂 Ananya Sharma", color: "text-rose-500" },
          { label: "Top Kudos MVP", val: "⭐ Rajesh Kumar (+14)", color: "text-amber-500" },
          { label: "Helpdesk SLA", val: "99.2% Resolved <4h", color: "text-emerald-500" }
        ],
        statusText: "🎉 High team engagement: 42 Kudos sent this month"
      }
    },
    payroll: {
      title: "Indian Payroll & Statutory Compliance",
      subtitle: "Automated calculations for EPF, ESI, Professional Tax, and instant PDF payslip downloads.",
      badge: "Tax & Compliance",
      points: [
        { icon: BadgePercent, title: "EPF & ESI Auto-Deductions", desc: "Pre-configured Indian labor law formulas for Employee Provident Fund and ESI." },
        { icon: Building2, title: "State-Wise Professional Tax", desc: "Automated PT slabs customized for Karnataka, Maharashtra, Delhi, and other states." },
        { icon: FileText, title: "PDF Payslips & Bank Registers", desc: "1-click salary slip generation for employees and bank-ready transfer CSVs for admins." },
        { icon: ShieldCheck, title: "GST-Compliant Billing", desc: "Automated GST tax invoices with HSN/SAC codes and company GSTIN." }
      ],
      mockPreview: {
        header: "Monthly Payroll Run",
        metrics: [
          { label: "Gross Disbursed", val: "₹18,40,000", color: "text-foreground" },
          { label: "EPF / ESI Deducted", val: "₹2,10,000", color: "text-indigo-500" },
          { label: "Net Payable", val: "₹16,30,000", color: "text-emerald-500" }
        ],
        statusText: "📄 All payslips digitally generated & signed"
      }
    }
  };

  const current = showcaseData[activeTab];

  return (
    <section id="showcase" className="w-full bg-accent/15 py-16 lg:py-24 border-b border-border/40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Interactive Feature Suite</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">
            Engineered for Modern Teams
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Click through the core functional pillars of RoleSync to explore how every module seamlessly interconnects.
          </p>
        </div>

        {/* Tab Selector buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: "attendance", label: "⏱️ Time & Attendance", icon: Clock },
            { id: "leave", label: "🏖️ Leaves & Holidays", icon: CalendarDays },
            { id: "governance", label: "📋 Regularization & WFH", icon: FileCheck2 },
            { id: "culture", label: "🎉 Culture & Celebrations", icon: PartyPopper },
            { id: "payroll", label: "🇮🇳 Payroll & Compliance", icon: BadgePercent }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                  : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="grid gap-8 lg:grid-cols-12 items-center bg-card border border-border/70 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 font-semibold px-3 py-1">
                {current.badge}
              </Badge>
            </div>
            
            <h3 className="font-[Poppins] text-2xl sm:text-3xl font-bold text-foreground">
              {current.title}
            </h3>
            
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {current.subtitle}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {current.points.map((p, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-background/60 border border-border/40 hover:border-primary/30 transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <p.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Simulator Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border/80 bg-background/95 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Simulation</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Active System
                </span>
              </div>

              <h4 className="text-base font-bold text-foreground font-[Poppins]">
                {current.mockPreview.header}
              </h4>

              <div className="space-y-3">
                {current.mockPreview.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/40">
                    <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                    <span className={`text-xs font-bold ${m.color}`}>{m.val}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/60">
                <p className="text-xs text-center font-medium text-muted-foreground bg-primary/5 py-2 rounded-lg border border-primary/10">
                  {current.mockPreview.statusText}
                </p>
              </div>

              <Button className="w-full text-xs font-semibold" onClick={() => window.location.href = "/login"}>
                Try Live in Workspace →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Feature Preview Modals ─── */
const FEATURE_PREVIEWS: Record<string, { title: string; bullets: string[] }> = {
  "Face Attendance": {
    title: "Face Attendance & Biometrics",
    bullets: [
      "📸 Fast selfie verification — anti-spoofing liveness detection prevents fraud.",
      "📍 Geo-tagging: latitude & longitude locked at moment of check-in.",
      "✅ Instant verification badge rendered directly on employee dashboard.",
      "📊 Admin logs show full selfie thumbnails, timestamps, and map coordinates."
    ],
  },
  "Live Break Tracking": {
    title: "Live Break Timer & Session Tracker",
    bullets: [
      "☕ One-click break start with session selector (Lunch, Coffee, Personal).",
      "⏱️ Live digital timer running down to the second (HH:MM:SS).",
      "⏸️ Seamless pause/resume functionality with automated daily totals.",
      "📋 Admin reports showing total break hours vs productive work hours."
    ],
  },
  "6-Tier Leave Engine": {
    title: "Multi-Category Leave Quota Engine",
    bullets: [
      "🏖️ 6 standard quota types: Bereavement, Casual, Earned, LWP, Menstrual, Sick.",
      "📊 Dynamic SVG donut rings showing quota consumption vs remaining balance.",
      "⏱️ SLA countdown timers prevent pending request bottlenecks.",
      "📅 Integrated 2026 holiday calendar with automatic optional holiday support."
    ],
  },
  "Regularization & WFH": {
    title: "Attendance Correction & WFH Requests",
    bullets: [
      "✏️ Employees submit punch corrections for missed check-ins with clear reasons.",
      "🏠 Remote Work / WFH request scheduling with multi-day selection.",
      "🔗 Flexible multi-tier approval chains (Team Lead → Manager → HR Admin).",
      "📜 Complete immutable audit log of who approved or rejected requests."
    ],
  },
  "Team Celebrations": {
    title: "Live Team Celebrations & Birthdays",
    bullets: [
      "🎂 Real-time birthday notifications for today and upcoming team members.",
      "💼 Work anniversary recognition alerts celebrating employee tenure.",
      "✨ Boosts team connection in hybrid and remote office setups.",
      "🔔 Integrated directly into the employee home dashboard."
    ],
  },
  "Kudos & Recognition": {
    title: "Peer-to-Peer Kudos & Appreciation Wall",
    bullets: [
      "🌟 Award custom recognition badges: Star, Helpful, MVP, and Innovator.",
      "💬 Public appreciation comments to celebrate team member wins.",
      "🏆 Monthly recognition leaderboard highlighting top contributors.",
      "📈 Proven to elevate employee engagement and retention."
    ],
  },
  "GPS Geofencing": {
    title: "GPS Geofencing & Anti-Spoofing",
    bullets: [
      "📍 Restrict attendance marking strictly to configured office coordinates.",
      "🏢 Multi-branch support: configure distinct coordinates and radius for each office.",
      "🚫 Mock GPS detection instantly blocks browser location faker extensions.",
      "🗺️ Live on-field location logs for logistics and sales personnel."
    ],
  },
  "Tasks & Targets": {
    title: "Task & Target Management",
    bullets: [
      "🎯 Monthly target assignment with real-time percentage completion bars.",
      "📋 Task prioritization (Low, Medium, High, Urgent) with due dates.",
      "🔗 Sub-task dependency chains to streamline complex workflows.",
      "📑 Bulk CSV upload to import quarterly targets for entire departments."
    ],
  },
  "Indian Statutory Payroll": {
    title: "Indian Payroll & Statutory Compliance",
    bullets: [
      "💰 Automated EPF (Provident Fund) and ESI calculations.",
      "🇮🇳 State-wise Professional Tax (PT) calculations matching Indian labor laws.",
      "📄 1-Click PDF payslip generation and download for all employees.",
      "🏦 Bank-ready transfer CSV registers for fast monthly salary disbursement."
    ],
  },
  "Enterprise Security": {
    title: "Enterprise Multi-Tenancy & Security",
    bullets: [
      "🏢 Strict Row Level Security (RLS) ensuring total data isolation between companies.",
      "🔑 Two-Factor Authentication (2FA) and SAML/SSO ready.",
      "🖥️ Active Session Manager: inspect and remotely terminate rogue logged-in devices.",
      "📜 Comprehensive audit trails tracking all modifications with IP addresses."
    ],
  },
  "Team Chat & Broadcasts": {
    title: "Team Messaging & Admin Broadcasts",
    bullets: [
      "💬 Real-time tenant-scoped instant messaging for internal collaboration.",
      "📢 Official 'Office Updates' broadcast channel with read receipts and attachments.",
      "🔒 Zero data leakage guarantee with strict database isolation.",
      "📎 Share images, documents, and policies directly inside chats."
    ],
  },
  "Helpdesk & Ticketing": {
    title: "Integrated Internal Helpdesk",
    bullets: [
      "🎫 Employees create tickets for HR, IT, Payroll, or Administrative queries.",
      "⏱️ Priority tags (Low/Med/High/Urgent) with response SLA timers.",
      "💬 Direct two-way messaging between employee and assigned resolution agent.",
      "📊 Admin analytics measuring average resolution time and satisfaction."
    ],
  }
};

/* ─── Complete Features Grid ─── */
const ALL_FEATURES = [
  { icon: Camera, title: "Face Attendance", category: "Time & Attendance", desc: "Anti-spoof selfie capture with GPS coordinates for fraud-proof attendance marking.", hasPreview: true },
  { icon: Coffee, title: "Live Break Tracking", category: "Time & Attendance", desc: "Track active breaks down to the second with instant pause/resume and duration logging.", hasPreview: true },
  { icon: MapPin, title: "GPS Geofencing", category: "Time & Attendance", desc: "Configurable radius per office branch. Blocks mock GPS and fake browser locations.", hasPreview: true },
  { icon: BarChart3, title: "Work Hours Recharts", category: "Analytics", desc: "Dynamic interactive weekly bar charts showing logged work hours, breaks, and trends.", hasPreview: false },
  
  { icon: CalendarDays, title: "6-Tier Leave Engine", category: "Leave & Time Off", desc: "Bereavement, Casual, Earned, LWP, Menstrual, and Sick leave quotas with auto-balances.", hasPreview: true },
  { icon: FileCheck2, title: "Regularization & WFH", category: "Governance", desc: "Empower employees to request punch corrections and WFH days with approval chains.", hasPreview: true },
  { icon: Calendar, title: "2026 Holiday Calendar", category: "Leave & Time Off", desc: "Pre-configured Indian national & regional holidays with custom company additions.", hasPreview: false },
  { icon: Clock, title: "SLA Countdown Approvals", category: "Governance", desc: "Configurable SLA timers flagging pending manager approvals before they breach.", hasPreview: false },

  { icon: Cake, title: "Team Celebrations", category: "Culture & Team", desc: "Automated real-time birthday radar and work anniversary milestone alerts.", hasPreview: true },
  { icon: Star, title: "Kudos & Recognition", category: "Culture & Team", desc: "Peer-to-peer appreciation wall with Star, Helpful, MVP, and Innovator badges.", hasPreview: true },
  { icon: MessageSquare, title: "Team Chat & Broadcasts", category: "Communication", desc: "Tenant-scoped instant messaging and official company announcement channel.", hasPreview: true },
  { icon: Headphones, title: "Helpdesk & Ticketing", category: "Operations", desc: "Built-in ticketing for HR, IT, and admin requests with resolution workflows.", hasPreview: true },

  { icon: Target, title: "Tasks & Targets", category: "Performance", desc: "Assign monthly targets, track sub-task dependencies, and bulk import via CSV.", hasPreview: true },
  { icon: BadgePercent, title: "Indian Statutory Payroll", category: "Payroll & Tax", desc: "EPF, ESI, and state-wise Professional Tax calculation with PDF payslips.", hasPreview: true },
  { icon: ShieldCheck, title: "Enterprise Security", category: "Enterprise", desc: "Row Level Security multi-tenancy, 2FA, session manager, and immutable audit logs.", hasPreview: true },
  { icon: Globe, title: "White-Labeling & Custom Subdomains", category: "Enterprise", desc: "Host on your own URL (portal.company.com) with custom logos and brand themes.", hasPreview: false },
];

function FeaturesSection() {
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);
  const preview = previewOpen ? FEATURE_PREVIEWS[previewOpen] : null;

  return (
    <section id="features" className="w-full bg-background py-16 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Comprehensive Feature Catalog</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">
            Every HR & Attendance Feature Under One Roof
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            No more switching between 5 disconnected tools. RoleSync provides an end-to-end suite designed specifically for Indian startups and enterprises.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ALL_FEATURES.map((f) => (
            <Card
              key={f.title}
              className={`group border border-border/60 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 ${f.hasPreview ? "cursor-pointer" : ""}`}
              onClick={() => f.hasPreview && setPreviewOpen(f.title)}
            >
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    {f.category}
                  </span>
                </div>

                <h3 className="font-[Poppins] text-base font-semibold text-foreground pt-1">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">{f.desc}</p>
                
                {f.hasPreview && (
                  <span className="mt-2 text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Live Details →
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature preview modal */}
      <Dialog open={!!previewOpen} onOpenChange={() => setPreviewOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[Poppins] text-xl text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {preview?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3 border-y border-border/60">
            {preview?.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="text-base">{b.split(" ")[0]}</span>
                <span className="leading-relaxed">{b.substring(b.indexOf(" ") + 1)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="w-1/2" onClick={() => setPreviewOpen(null)}>
              Close
            </Button>
            <Button className="w-1/2 bg-gradient-to-r from-primary to-indigo-600" onClick={() => { setPreviewOpen(null); window.location.href = "/login"; }}>
              Try Free Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ─── Role Comparison ─── */
function RoleComparison() {
  const rows = [
    { feature: "Time & Attendance", employee: "1-Click Selfie Punch & GPS Lock", admin: "Live Organization Attendance Radar", superAdmin: "Global Cross-Company Analytics" },
    { feature: "Break Tracking", employee: "Live Break Timer (Coffee, Lunch)", admin: "Break Durations & Overtime Log", superAdmin: "Platform-wide Health Metrics" },
    { feature: "Leaves & Holidays", employee: "6 Quota Balances & 2026 Holiday View", admin: "Custom Policy Rules & Approvals", superAdmin: "System Quota Presets" },
    { feature: "Governance & WFH", employee: "Regularization & WFH Requests", admin: "Multi-tier SLA Decision Engine", superAdmin: "System Audit Logs" },
    { feature: "Culture & Kudos", employee: "Send Kudos & View Celebrations", admin: "Channel Moderation & Broadcasts", superAdmin: "Feature Flag Controls" },
    { feature: "Payroll & Payslips", employee: "Download Monthly PDF Payslips", admin: "EPF/ESI Slabs & Salary Registers", superAdmin: "GST Invoicing Engine" },
    { feature: "Security & Sessions", employee: "2FA & Device Management", admin: "Geofences, RLS, Role Matrix", superAdmin: "Tenant Isolation & Backups" },
  ];

  return (
    <section id="roles" className="w-full bg-accent/20 py-16 lg:py-24 border-y border-border/40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Role Matrix</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Built for Every Stakeholder</h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Distinct, tailored interfaces designed specifically for Employees, HR Admins, and Enterprise Executives.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-5 py-4 text-left font-bold text-foreground">Capability</th>
                <th className="px-5 py-4 text-left font-bold text-primary">Employee Portal</th>
                <th className="px-5 py-4 text-left font-bold text-indigo-500">Company Admin & HR</th>
                <th className="px-5 py-4 text-left font-bold text-amber-500">Super Admin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.feature} className={`border-b border-border/30 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/20"}`}>
                  <td className="px-5 py-4 font-semibold text-foreground">{r.feature}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs sm:text-sm">{r.employee}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs sm:text-sm">{r.admin}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs sm:text-sm">{r.superAdmin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { num: "01", title: "Create Workspace", desc: "Enter company name and get your dedicated multi-tenant workspace with custom subdomain instantly." },
    { num: "02", title: "Invite Team Members", desc: "Add employees individually or via CSV import. Team members set up profile selfies for face-match." },
    { num: "03", title: "Set Geofence & Rules", desc: "Configure office coordinates, leave quotas (6 tiers), approval chains, and break time rules." },
    { num: "04", title: "Run on Autopilot", desc: "Employees punch in, track breaks, celebrate milestones, and request leave while admins oversee real-time analytics." },
  ];

  return (
    <section id="how-it-works" className="w-full bg-background py-16 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Onboarding Flow</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Go Live in 4 Simple Steps</h2>
          <p className="mt-2 text-muted-foreground text-sm">Zero infrastructure setup needed. Everything runs in the secure cloud.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.num} className="relative rounded-2xl border border-border/60 bg-card p-6 text-center shadow-md hover:border-primary/40 transition-colors">
              <span className="mb-3 inline-block font-[Poppins] text-4xl font-extrabold text-primary/25">{s.num}</span>
              <h3 className="mb-2 font-[Poppins] text-lg font-bold text-foreground">{s.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Preview ─── */
function PricingSection() {
  const navigate = useNavigate();
  const plans = [
    {
      name: "Starter", price: "Free", period: "", desc: "For small teams and growing startups",
      features: [
        "Up to 10 employees",
        "Face-verified attendance + GPS",
        "Live break duration tracking",
        "6-category leave quotas",
        "Attendance regularization & WFH",
        "Team celebrations & birthdays",
        "Email support"
      ],
      cta: "Start Free", popular: false,
    },
    {
      name: "Professional", price: "₹99", period: "/user/mo", desc: "For modern growing companies in India",
      features: [
        "Unlimited employees", 
        "Everything in Starter", 
        "EPF, ESI & Professional Tax compliance",
        "Downloadable PDF payslips & bank CSVs",
        "Tasks, monthly targets & Recharts analytics", 
        "Peer kudos wall & office broadcast updates", 
        "Granular 4-tier role permission matrix", 
        "GST-compliant tax invoices",
        "Priority 24/7 support"
      ],
      cta: "Start 14-Day Trial", popular: true,
    },
    {
      name: "Enterprise", price: "Custom", period: "", desc: "For scaling organizations & custom setups",
      features: [
        "Everything in Professional", 
        "Custom domain white-labeling (portal.company.com)", 
        "SSO / SAML 2.0 integration", 
        "REST API keys & real-time webhooks", 
        "Dedicated Account Manager & SLA", 
        "Custom payroll rules & Indian statutory audit", 
        "On-premise / private cloud deployment option"
      ],
      cta: "Contact Enterprise Sales", popular: false,
    },
  ];

  return (
    <section id="pricing" className="w-full bg-accent/20 py-16 lg:py-24 border-t border-border/40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Transparent Pricing</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Simple, Predictable Plans</h2>
          <p className="mt-2 text-muted-foreground text-sm">No hidden setup fees. Upgrade or cancel anytime.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((p) => (
            <Card key={p.name} className={`relative flex flex-col overflow-hidden border transition-all duration-300 hover:shadow-2xl ${p.popular ? "border-primary ring-2 ring-primary/25 shadow-xl scale-105" : "border-border/60"}`}>
              {p.popular && (
                <div className="bg-gradient-to-r from-primary to-indigo-600 px-4 py-1.5 text-center text-xs font-bold text-primary-foreground tracking-wider uppercase">
                  Most Popular for Indian Teams
                </div>
              )}
              <CardContent className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="font-[Poppins] text-xl font-bold text-foreground">{p.name}</h3>
                <p className="mb-4 text-xs sm:text-sm text-muted-foreground">{p.desc}</p>
                <div className="mb-6">
                  <span className="font-[Poppins] text-4xl font-extrabold text-foreground">{p.price}</span>
                  <span className="text-sm font-medium text-muted-foreground ml-1">{p.period}</span>
                </div>
                <ul className="mb-8 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> 
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full font-semibold ${p.popular ? "bg-gradient-to-r from-primary to-indigo-600 shadow-md shadow-primary/20" : ""}`} 
                  variant={p.popular ? "default" : "outline"} 
                  onClick={() => navigate("/pricing")}
                >
                  {p.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function TestimonialsSection() {
  const items = [
    { img: testimonial1, name: "Rajesh Kumar", role: "CTO, TechBite Solutions (Bengaluru)", text: "RoleSync transformed our attendance and leave process completely. Face verification eliminated buddy punching, and the live break tracker gives our managers real transparency without micromanagement." },
    { img: testimonial2, name: "Priya Sharma", role: "HR Head, ZenithWorks (New Delhi)", text: "The 6-quota leave engine, birthday celebrations radar, and automated EPF/ESI payroll calculations saved our HR department over 20 hours each week. It's built perfectly for Indian businesses." },
    { img: testimonial3, name: "Ananya Singh", role: "Director, CloudScale (Mumbai)", text: "The tenant isolation, audit logs, and geofenced multi-office support made security approval a breeze. Best HRMS and employee management tool we have ever used." },
  ];

  return (
    <section id="testimonials" className="w-full bg-background py-16 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Customer Reviews</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Trusted by Fast-Growing Companies</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
          {items.map((t) => (
            <Card key={t.name} className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                  <img src={t.img} alt={t.name} width={44} height={44} loading="lazy" className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: "How does face-verified attendance and anti-spoofing work?", a: "Employees take an instant selfie during check-in from their mobile or desktop camera. Our algorithm runs anti-spoofing liveness detection and matches coordinates against your office geofence to guarantee fraud-free attendance." },
    { q: "How does the live break timer work?", a: "Employees click 'Start Break' on their dashboard and select a break type (Coffee, Lunch, Personal). The live timer updates by the second. Admins can view individual and team break totals to ensure healthy work-life balance." },
    { q: "What leave categories are supported in the 6-tier engine?", a: "RoleSync comes pre-configured with Bereavement Leave, Casual Leave, Earned (Annual) Leave, Leave Without Pay (LWP), Menstrual Leave, and Sick Leave. All categories feature automated quota donut tracking, half-day toggles, and SLA escalation." },
    { q: "Can employees submit attendance corrections and WFH requests?", a: "Yes. If an employee forgets to clock in or needs remote work, they can submit a regularization or WFH request with timestamps and reasons. Configurable multi-tier approval chains route it directly to their team lead or HR." },
    { q: "Do you support Indian statutory payroll like EPF, ESI, and Professional Tax?", a: "Yes, completely! RoleSync is customized for Indian businesses. We support EPF (Provident Fund), ESI calculations, state-wise Professional Tax slabs, downloadable PDF payslips, and GST-compliant tax invoices." },
    { q: "Is our company data completely isolated from other tenants?", a: "Yes. RoleSync uses strict Row Level Security (RLS) policies and isolated cloud storage buckets. No organization can ever view, query, or leak data belonging to another tenant." },
  ];

  return (
    <section id="faq" className="w-full bg-accent/20 py-16 lg:py-24 border-y border-border/40">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3 px-3 py-1">FAQ</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <button 
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:text-primary transition-colors" 
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                {f.q}
                {openIdx === i ? <ChevronUp className="h-4 w-4 text-primary shrink-0 ml-2" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />}
              </button>
              {openIdx === i && (
                <div className="border-t border-border/40 px-5 py-4 text-xs sm:text-sm leading-relaxed text-muted-foreground bg-secondary/20 animate-in fade-in duration-200">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Company Selector / Direct Workspace Finder ─── */
function CompanySelector() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("companies").select("id, name, slug").ilike("name", `%${val}%`).limit(5);
    setResults(data || []);
    setSearching(false);
  };

  return (
    <section className="w-full bg-background py-12 lg:py-16">
      <div className="max-w-xl mx-auto px-4 text-center">
        <Badge variant="secondary" className="mb-3 px-3 py-1">Workspace Portal</Badge>
        <h2 className="mb-2 font-[Poppins] text-2xl font-bold text-foreground">Find Your Company Workspace</h2>
        <p className="mb-6 text-sm text-muted-foreground">Search for your registered organization to jump directly into your portal</p>
        
        <Input
          placeholder="Search company by name (e.g. Acme, Zenith, TechBite)…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="mb-3 h-11"
        />
        {searching && <p className="text-xs text-muted-foreground">Searching workspaces…</p>}
        {results.length > 0 && (
          <div className="space-y-2 text-left">
            {results.map((c) => (
              <Button 
                key={c.id} 
                variant="outline" 
                className="w-full justify-between gap-2 h-11 border-border/80 hover:border-primary/50" 
                onClick={() => navigate(`/login?company=${c.slug}`)}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{c.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">/{c.slug}</span>
              </Button>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && !searching && (
          <p className="text-xs text-muted-foreground">
            No companies found with that name. <button className="text-primary underline font-medium" onClick={() => navigate("/login")}>Create a new company</button>
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="w-full relative overflow-hidden bg-slate-950 py-20 lg:py-28">
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl filter"></div>
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl filter"></div>
      
      <div className="relative w-full px-4 text-center sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl lg:p-14">
          <Badge className="bg-primary/20 text-primary-foreground border-primary/30 mb-4 px-3 py-1">
            ⚡ Instant 14-Day Free Access
          </Badge>
          <h2 className="font-[Poppins] text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Ready to Upgrade Your <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-primary bg-clip-text text-transparent">Workforce Operations?</span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join 500+ modern companies saving 20+ hours every month on biometric attendance, break logs, leave quotas, and Indian statutory payroll.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="h-12 rounded-full px-8 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-indigo-600 shadow-xl hover:scale-105 transition-all gap-2"
              onClick={() => navigate("/login")}
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 rounded-full border-white/20 bg-white/5 px-8 text-sm sm:text-base font-semibold text-white backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all" 
              onClick={() => navigate("/pricing")}
            >
              View Pricing Plans
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const [footerEmail, setFooterEmail] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const handleFooterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerEmail.trim()) return;
    setSending(true);
    const domain = footerEmail.split("@")[1]?.split(".")[0] || "company";
    const slug = `${domain}-${Date.now().toString(36)}`;
    const { error } = await supabase.from("companies").insert({ name: domain.charAt(0).toUpperCase() + domain.slice(1), slug, status: "active" });
    setSending(false);
    if (error) {
      toast.error("Could not create workspace. Please try again.", { description: error.message });
    } else {
      toast.success("Workspace created! Directing to login.", { description: `Slug: ${slug}` });
      setFooterEmail("");
      navigate(`/login?company=${slug}`);
    }
  };

  const navCols = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Interactive Showcase", href: "#showcase" },
        { label: "Pricing Plans", href: "/pricing", isRoute: true },
        { label: "Employee Portal", href: "/login", isRoute: true },
        { label: "Admin Portal", href: "/login", isRoute: true }
      ]
    },
    {
      title: "Compliance & Security",
      links: [
        { label: "EPF & ESI Compliance", href: "#features" },
        { label: "State Professional Tax", href: "#features" },
        { label: "Multi-Tenant RLS", href: "#features" },
        { label: "Privacy Policy", href: "/privacy", isRoute: true },
        { label: "Terms of Service", href: "/terms", isRoute: true }
      ]
    },
    {
      title: "Quick Links",
      links: [
        { label: "How It Works", href: "#how-it-works" },
        { label: "Role Matrix", href: "#roles" },
        { label: "FAQ", href: "#faq" },
        { label: "Find Workspace", href: "/login", isRoute: true },
        { label: "Contact Support", href: "mailto:support@rolesync.in" }
      ]
    }
  ];

  return (
    <footer className="w-full border-t border-border/40 bg-slate-50 pt-16 pb-8 dark:bg-background/95">
      <div className="w-full grid gap-12 px-4 md:grid-cols-5 sm:px-6 lg:px-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <RoleSyncLogo size={80} />
          </div>
          <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">
            RoleSync is the unified employee management & HRMS platform built for modern Indian businesses. Seamless face attendance, live break tracker, 6-quota leaves, and statutory payroll compliance.
          </p>
          
          <div className="pt-2 w-full">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-foreground">
              Create Free Workspace
            </h4>
            <form onSubmit={handleFooterSignup} className="relative flex items-center shadow-sm max-w-md">
              <div className="absolute left-3 text-slate-400">
                <Send className="h-4 w-4" />
              </div>
              <Input
                type="email"
                placeholder="your@company.com"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                className="h-11 w-full rounded-full border-slate-200 bg-white pl-10 pr-28 text-xs sm:text-sm focus:border-primary focus:ring-primary dark:border-border/60 dark:bg-card transition-all"
              />
              <Button 
                type="submit" 
                disabled={sending} 
                className="absolute right-1 h-9 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-4 text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {sending ? "Creating…" : "Sign Up"}
              </Button>
            </form>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-muted-foreground ml-2">
              Free 14-day trial • No credit card required.
            </p>
          </div>
        </div>
        
        {navCols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-4 text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-foreground">{c.title}</h4>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.isRoute ? (
                    <button
                      onClick={() => navigate(l.href)}
                      className="text-xs sm:text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-muted-foreground dark:hover:text-primary text-left"
                    >
                      {l.label}
                    </button>
                  ) : (
                    <a 
                      href={l.href} 
                      className="text-xs sm:text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-muted-foreground dark:hover:text-primary"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="w-full mt-12 border-t border-slate-200/60 px-4 pt-6 dark:border-border/40 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-xs text-slate-500 dark:text-muted-foreground">
          <p>© {new Date().getFullYear()} RoleSync Technologies India Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/privacy")} className="hover:text-primary transition-colors">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => navigate("/terms")} className="hover:text-primary transition-colors">Terms of Service</button>
            <span>•</span>
            <button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors">Pricing</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Landing Page Export ─── */
export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <InteractiveShowcase />
      <FeaturesSection />
      <HowItWorks />
      <CompanySelector />
      <RoleComparison />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
