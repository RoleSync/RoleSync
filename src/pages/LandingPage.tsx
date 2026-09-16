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
  FileCheck2, Compass, ShieldAlert, BadgePercent, Cake, PartyPopper,
  Briefcase, Plane, Receipt, UserX, Network, CheckSquare, Layers,
  HelpCircle, Eye, RefreshCw, IndianRupee, BookOpen, FolderLock,
  Scale, ShieldQuestion, Download, FileSpreadsheet
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
    { name: "Interactive Showcase", href: "#showcase" },
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
            <span>RoleSync • Unified HRMS & Workforce Operations</span>
          </div>

          <h1 className="font-[Poppins] text-4xl font-bold leading-tight text-foreground lg:text-5xl xl:text-6xl">
            Automate Attendance, Leaves, Payroll & <span className="text-primary bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Team Operations</span>
          </h1>

          <p className="w-full text-base sm:text-lg text-muted-foreground leading-relaxed">
            Biometric shift tracking, 7-tab profile vault, CTC breakdown with Indian payroll, 6-tier leave quotas, one-click expense claims, peer recognition badges, and corporate policy manuals — all in a single unified dashboard.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" /> Live Punch & Break Timer
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-500" /> CTC Breakdown & Payslips
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <FolderLock className="h-3.5 w-3.5 text-indigo-500" /> 7-Tab Profile & Vault
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-amber-500" /> Policy Library & SOPs
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" /> 6-Category Leave Quotas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <FileCheck2 className="h-3.5 w-3.5 text-teal-500" /> Bulk Regularize & WFH
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <Award className="h-3.5 w-3.5 text-purple-500" /> "Give A Badge" Awards
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <Network className="h-3.5 w-3.5 text-sky-500" /> Interactive Org Chart Tree
            </span>
          </div>

          <div className="flex flex-wrap gap-3.5 pt-2">
            <Button size="lg" onClick={() => navigate("/login")} className="gap-2 bg-gradient-to-r from-primary to-indigo-600 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Start 14-Day Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => { const el = document.getElementById("features"); el?.scrollIntoView({ behavior: "smooth" }); }}>
              Explore All 16 Modules
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
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Multi-Tenant Subdomains</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Email & Emp-Code Login</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Google Calendar 2-Way Sync</span>
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
            {/* Overlay badge preview 1 */}
            <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-3 rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Live Timer & Punch Tracker</p>
                <p className="text-[11px] text-muted-foreground">01:11:01 • In Office • Avg 09:35 hrs</p>
              </div>
            </div>
            
            {/* Overlay badge preview 2 */}
            <div className="absolute -top-4 -right-4 hidden sm:flex items-center gap-3 rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Kudos & Badge Awards</p>
                <p className="text-[11px] text-muted-foreground">"Applause" Awarded to Vamshika</p>
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
    { label: "Companies", value: "500+", icon: Building2, desc: "India & Global" },
    { label: "Daily Punches", value: "100K+", icon: UserCheck, desc: "Biometric & Web" },
    { label: "HRMS Modules", value: "16+", icon: Layers, desc: "Single Cloud Suite" },
    { label: "Uptime SLA", value: "99.99%", icon: BadgePercent, desc: "EPF, ESI, PT Compliant" },
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
      title: "Time & Shift Tracking",
      subtitle: "Real-time punch timer, daily work-hour charts, and batch regularization in one view.",
      badge: "Live Real-Time Tracking",
      points: [
        { icon: Clock, title: "Live Punch & Break Digital Timer", desc: "Running counter (HH:MM:SS) with 1-click Clock Out, Start Break, and Lunch tracking." },
        { icon: BarChart3, title: "3-Series Daily Work Analytics", desc: "Interactive charts tracking Work Hours, Break Durations, and Auto Clockouts across all shifts." },
        { icon: CheckSquare, title: "Batch Regularization Shortcuts", desc: "1-click 'Check/Un-Check All' and 'Check excluding weekends' with bulk Regularize (N) submission." },
        { icon: HelpCircle, title: "480-Min Policy & Biometric FAQ", desc: "Transparent deduction matrices (0-240m = 1 Day EL, 240-480m = 0.5 Day EL) and No-Show rules." }
      ],
      mockPreview: {
        header: "Live Attendance Session State",
        metrics: [
          { label: "Live Punch Timer", val: "01:11:01 (Clocked In)", color: "text-emerald-500" },
          { label: "Averages (In / Out)", val: "10:45 AM • 08:21 PM", color: "text-primary" },
          { label: "Avg Work Hours", val: "09:35 hrs • 16 Paid Days", color: "text-indigo-500" }
        ],
        statusText: "General Shift 1120 • Biometric Sync Active"
      }
    },
    compensation: {
      title: "Compensation & Indian Payroll",
      subtitle: "Transparent CTC breakdown, basic/allowances, statutory deductions, Form 12BB declarations, and monthly PDF payslips.",
      badge: "Statutory Payroll & Tax",
      points: [
        { icon: IndianRupee, title: "Detailed CTC & Monthly Structure", desc: "Granular breakdown of Basic Salary, HRA, Special Allowances, and employer contributions." },
        { icon: BadgePercent, title: "EPF, ESI & State Professional Tax", desc: "Automated calculations conforming to statutory ceilings and state tax slabs across India." },
        { icon: Download, title: "Instant PDF Payslip Archive", desc: "View, download, and verify digital payslips with month-by-month attendance summaries." },
        { icon: FileSpreadsheet, title: "Form 12BB & Tax Declarations", desc: "Self-service declarations for 80C, 80D, HRA rent receipts, and home loan interest." }
      ],
      mockPreview: {
        header: "Monthly Compensation & Tax Snapshot",
        metrics: [
          { label: "Annual Gross CTC", val: "₹14,50,000 / annum", color: "text-foreground" },
          { label: "Monthly In-Hand Net", val: "₹1,02,450 / month", color: "text-emerald-500" },
          { label: "EPF + PT Deductions", val: "₹4,200 (Compliant)", color: "text-indigo-500" }
        ],
        statusText: "Latest Payslip Ready for Download (PDF)"
      }
    },
    profile: {
      title: "7-Tab Profile & Document Vault",
      subtitle: "Centralized employee repository covering personal records, professional background, family nominees, and verifiable documents.",
      badge: "Employee Vault & Compliance",
      points: [
        { icon: FolderLock, title: "7 Dedicated Profile Tabs", desc: "Personal, Professional, Contact Details, Emergency Nominees, Financial Bank Data, Work Profile, and Forms/Letters." },
        { icon: ShieldCheck, title: "Secure Document & Letter Vault", desc: "Upload and archive offer letters, PAN, Aadhaar, degree certificates, and contracts with 2MB size enforcement." },
        { icon: RefreshCw, title: "Granular Audit Trail History", desc: "Every profile edit, document replacement, or status change is timestamped with actor logging." },
        { icon: UserCheck, title: "Emergency & Nominee Protection", desc: "Store critical allergies, primary emergency contacts, and registered nominees for insurance." }
      ],
      mockPreview: {
        header: "Employee Record & Verification",
        metrics: [
          { label: "Profile Status", val: "100% Complete (Verified)", color: "text-emerald-500" },
          { label: "Vault Documents", val: "8 Files Stored (2MB max)", color: "text-primary" },
          { label: "Audit Log History", val: "12 Timestamped Edits", color: "text-indigo-500" }
        ],
        statusText: "Bank details & KYC documents encrypted"
      }
    },
    leave: {
      title: "Leave Management",
      subtitle: "Six leave types, dual table and card views, holiday opt-ins, and CSV export.",
      badge: "Automated Quotas",
      points: [
        { icon: CalendarDays, title: "6 Dedicated Quota Buckets", desc: "Bereavement, Casual, Earned, Leave Without Pay (LWP), Menstrual, and Sick leave tracking." },
        { icon: Layers, title: "Dual Table & Card Visual Views", desc: "Switch instantly between detailed numerical quota tables and visual progress cards." },
        { icon: Star, title: "Mandatory vs Restricted Holidays", desc: "Color-coded holiday roster with employee opt-in selection for restricted/optional festival holidays." },
        { icon: FileText, title: "7-State Request Lifecycle & CSV", desc: "Track Approved, Pending, Cancelled, and Post-Approval modifications with instant CSV export." }
      ],
      mockPreview: {
        header: "Leave Balance & Quota Roster",
        metrics: [
          { label: "Casual Leave", val: "8.0 / 12.0 Days Balance", color: "text-indigo-500" },
          { label: "Earned Leave", val: "14.5 / 18.0 Days Balance", color: "text-sky-500" },
          { label: "Upcoming Holidays", val: "3 in Next 90 Days", color: "text-emerald-500" }
        ],
        statusText: "Optional Holidays: 1 Selected / 2 Allocated"
      }
    },
    expenses: {
      title: "Expense & Travel Claims",
      subtitle: "Submit travel requests, expense claims, and cash advances with multi-tier approvals.",
      badge: "Expense Governance",
      points: [
        { icon: Plane, title: "Travel Itinerary Requests", desc: "Pre-trip approval workflow covering flights, hotels, daily per-diem allowances, and cab bills." },
        { icon: Receipt, title: "Expense Claims & Receipts", desc: "Upload multi-currency bills with auto-categorization (Meals, Fuel, Client Entertainment, Logistics)." },
        { icon: Briefcase, title: "Cash Advance Requests", desc: "Request upfront corporate advances with automatic reconciliation against final submitted bills." },
        { icon: UserCheck, title: "'Viewing As' Delegate Switcher", desc: "Allows authorized executive assistants and managers to file or review claims on behalf of team members." }
      ],
      mockPreview: {
        header: "Travel & Expense Pipeline",
        metrics: [
          { label: "Pending Claims", val: "₹14,500 (Admin Review)", color: "text-amber-500" },
          { label: "Approved Advances", val: "₹25,000 (Disbursed)", color: "text-emerald-500" },
          { label: "Approval Status", val: "Approved by Workflow", color: "text-primary" }
        ],
        statusText: "Travel Desk & Finance Sync Complete"
      }
    },
    knowledge: {
      title: "Knowledge Base & Corporate Policies",
      subtitle: "Searchable central repository for SOPs, attendance deduction matrices, code of conduct, and downloadable PDFs.",
      badge: "Policy Hub & Transparency",
      points: [
        { icon: BookOpen, title: "Searchable Policy Directory", desc: "Categorized library for Leave SOPs, Code of Conduct, Travel Guidelines, and Benefits manuals." },
        { icon: Scale, title: "Radical Shift Transparency", desc: "Clear 480-minute shift rule matrix: 0-240m = 1 Day EL deduction, 240-480m = 0.5 Day EL deduction." },
        { icon: ShieldQuestion, title: "No-Show & Comp-Off Governance", desc: "Automated X+1 warning, X+2 deduction SLA, and 11-day compensatory off expiry rules." },
        { icon: Download, title: "1-Click PDF Downloads", desc: "Direct offline access for employees to official signed handbook and policy documents." }
      ],
      mockPreview: {
        header: "Company Knowledge & SOP Portal",
        metrics: [
          { label: "Active Policies", val: "14 Corporate Handbooks", color: "text-foreground" },
          { label: "Attendance Policy", val: "480-min Shift SLA Active", color: "text-amber-500" },
          { label: "Comp-Off Validity", val: "11-Day Expiry Tracked", color: "text-emerald-500" }
        ],
        statusText: "Employee Handbook v4.2 Available (PDF)"
      }
    },
    social: {
      title: "Social Intranet & Kudos",
      subtitle: "Peer badge awards, birthday spotlights, anonymous posting, and threaded discussions.",
      badge: "Culture & Connection",
      points: [
        { icon: Award, title: "'Give A Badge' Peer Awards", desc: "Award highlighted badges like 'Applause', 'Star Performer', and 'Team Player' with personal citations." },
        { icon: Cake, title: "Birthday & Work Anniversary Spotlight", desc: "Hero birthday card with 1-click 'Wish Happy Birthday' action and upcoming celebrations carousel." },
        { icon: MessageSquare, title: "Named & Anonymous Posting", desc: "Share announcements, walk-in drives, referral bonuses (₹3k/₹4k/₹5k), and media attachments." },
        { icon: HeartHandshake, title: "Reactions & Threaded Comments", desc: "Live likes, celebratory emoji reactions, and threaded discussions on all corporate posts." }
      ],
      mockPreview: {
        header: "Company Social & Kudos Wall",
        metrics: [
          { label: "Today's Birthday", val: "Somnath Tiwary (Growth)", color: "text-rose-500" },
          { label: "Latest Badge", val: "Peer 'Applause' to Vamshika", color: "text-amber-500" },
          { label: "Referral Drive", val: "₹5,000 Bonus Active", color: "text-emerald-500" }
        ],
        statusText: "15 Likes & 4 Comments on recent Kudos"
      }
    },
    people: {
      title: "People & Org Chart",
      subtitle: "Visual hierarchy tree, searchable directory, and two-way Google Calendar sync.",
      badge: "Org Intelligence",
      points: [
        { icon: Network, title: "Dynamic Organization Chart Tree", desc: "Interactive node cards with subordinate count badges (e.g. 6), sibling arrows, and reporting lines." },
        { icon: Users, title: "Searchable Employee Directory", desc: "Filter by department, search by name, and jump directly into 'View Profile' or 'Org Chart'." },
        { icon: Calendar, title: "2-Way Google Calendar Sync", desc: "1-click OAuth sync displaying personal leaves, team leaves, holidays, and week-offs on Google Calendar." },
        { icon: Compass, title: "Universal Scope Search", desc: "Header search with quick toggle between People and Department auto-complete lookups." }
      ],
      mockPreview: {
        header: "People & Org Intelligence",
        metrics: [
          { label: "Manager Focus", val: "Sachin Shetty (Tech Lead)", color: "text-foreground" },
          { label: "Direct Reports", val: "6 Engineers (Bengaluru)", color: "text-indigo-500" },
          { label: "Calendar Sync", val: "Synced with Google", color: "text-emerald-500" }
        ],
        statusText: "Multi-level hierarchy visualizer active"
      }
    },
    separation: {
      title: "Exit & Clearance Workflows",
      subtitle: "Self-service resignation, parallel department clearances, and structured alert center.",
      badge: "Lifecycle & Governance",
      points: [
        { icon: UserX, title: "Initiate Exit Self-Service", desc: "Employees submit resignation with requested LWD, notice period calculations, and reasons." },
        { icon: FileCheck2, title: "6-Stage Lifecycle Tracking", desc: "Clear visual badges: Approved, Rejected, Pending, Cancelled, Not Received Yet, and Cancellation." },
        { icon: CheckSquare, title: "Multi-Department Clearances", desc: "Parallel clearance tasks across IT Assets, Finance Final Settlement, and HR Exit Interviews." },
        { icon: Bell, title: "Segregated Alerts Center", desc: "Distinct tabs for General 'Notifications' vs required 'Actions' with Pending and Archived sub-tabs." }
      ],
      mockPreview: {
        header: "Exit Clearance & Action Alerts",
        metrics: [
          { label: "Exit Status", val: "Pending HR Clearance", color: "text-amber-500" },
          { label: "Pending Actions", val: "2 Approval Tasks Waiting", color: "text-rose-500" },
          { label: "Archived Alerts", val: "14 Completed Items", color: "text-muted-foreground" }
        ],
        statusText: "Complete exit compliance audit trail"
      }
    }
  };

  const current = showcaseData[activeTab];

  return (
    <section id="showcase" className="w-full bg-accent/15 py-16 lg:py-24 border-b border-border/40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Interactive HRMS Suite</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">
            Explore Core HRMS Modules
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Click any tab to see how each module works, end to end.
          </p>
        </div>

        {/* Tab Selector buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: "attendance", label: "Time & Shifts", icon: Clock },
            { id: "compensation", label: "Compensation & CTC", icon: IndianRupee },
            { id: "profile", label: "7-Tab Profile Vault", icon: FolderLock },
            { id: "leave", label: "Leave & Holidays", icon: CalendarDays },
            { id: "expenses", label: "Expenses & Travel", icon: Plane },
            { id: "knowledge", label: "Policies & SOPs", icon: BookOpen },
            { id: "social", label: "Social & Kudos", icon: PartyPopper },
            { id: "people", label: "People & Org", icon: Network },
            { id: "separation", label: "Exit & Clearance", icon: UserX },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
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
                  Active HRMS Node
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
  "Time & Attendance": {
    title: "Time, Shifts & Biometric Attendance",
    bullets: [
      "Real-time running timer clock (HH:MM:SS) with 1-click Clock Out & Start Break.",
      "Highcharts 3-series daily bar charts: Work Hours, Break Duration, and Auto Clockouts.",
      "7-Column monthly timetable roster for General Shift 1120 with week-off tracking.",
      "480-minute shift deduction matrix (0-240m = 1 Day EL, 240-480m = 0.5 Day EL) and No-Show auto rules."
    ],
  },
  "My Compensation & CTC": {
    title: "Compensation, CTC Breakdown & Form 12BB",
    bullets: [
      "Comprehensive CTC structure: Basic Pay, HRA, Special Allowance, PF, and Medical Insurance.",
      "Monthly digital payslip viewer with instant PDF download and historical archives.",
      "Form 12BB tax investment declaration workflow for 80C, 80D, HRA rent, and home loans.",
      "Automated Indian statutory compliance: EPF, ESI, and state-wise Professional Tax."
    ],
  },
  "7-Tab Profile & Vault": {
    title: "7-Tab Employee Profile & Secure Document Vault",
    bullets: [
      "7 Comprehensive Tabs: Personal, Professional, Contact, Emergency, Financial, Work Profile, Forms/Letters.",
      "Secure Document Vault: Upload PAN, Aadhaar, resumes, signed offer letters with 2MB validation.",
      "Timestamped Audit History modal tracking every field update with user and time attribution.",
      "Nominee registration and medical allergy emergency contact safeguarding."
    ],
  },
  "Knowledge Base & SOPs": {
    title: "Knowledge Base, Corporate Policies & SOPs",
    bullets: [
      "Searchable categorized library: Leave Policies, Code of Conduct, Travel Guidelines, Benefits.",
      "1-Click offline PDF downloads of signed corporate handbooks and company procedures.",
      "480-minute shift deduction policy breakdown and biometric punch FAQ guide.",
      "Centralized announcement hub for corporate compliance updates and employee rights."
    ],
  },
  "Bulk Regularization & WFH": {
    title: "Attendance Regularization & WFH Pipeline",
    bullets: [
      "Bulk selection shortcuts: 'Check/Un-Check All' and 'Check all excluding weekends'.",
      "3 Summary KPI Cards: WFH Count (11), Missed Punch (1), and On Duty (4) tracking.",
      "Flexible multi-tier approval chains routing requests to Reporting Managers & HR.",
      "Full CSV export of personal attendance logs and regularization histories."
    ],
  },
  "6-Tier Leave Engine": {
    title: "Multi-Category Leave Quota Engine",
    bullets: [
      "6 Dedicated Quota Buckets: Bereavement, Casual, Earned, LWP, Menstrual, and Sick Leave.",
      "Dual Table View vs Card View showing Accrued, Used, Requested, and Balance metrics.",
      "Holiday Roster with Mandatory (Orange) vs Restricted/Optional (Blue) opt-in selection.",
      "Integrated 7-state request lifecycle with cancellation support and CSV export."
    ],
  },
  "Travel & Expense Claims": {
    title: "Travel Itinerary, Expenses & Cash Advances",
    bullets: [
      "3 Sub-Modules: Travel Booking Requests, Expense Claims, and Cash Advances.",
      "'Viewing As' Employee Switcher for executive assistants and department heads.",
      "7-State Filter Pipeline: Pending, Auto Approved, Admin Approved, Workflow Approved, etc.",
      "Multi-currency receipt attachment uploads with automated mileage calculations."
    ],
  },
  "Peer Badges & Intranet": {
    title: "Social Intranet & 'Give A Badge' Recognition",
    bullets: [
      "'Give A Badge' Peer Award system: Award 'Applause', 'Star Performer', or 'Team Player'.",
      "Celebrations Spotlight: Today's Birthday hero card with 1-click 'Wish Happy Birthday' action.",
      "Rich Composer with 'Posting as Myself' vs 'Anonymous' mode and photo/video attachments.",
      "Official referral drives (₹3k/₹4k/₹5k tiers) and walk-in drive announcements with reactions."
    ],
  },
  "Org Chart & Directory": {
    title: "Interactive Org Chart Tree & Directory",
    bullets: [
      "Dynamic hierarchical tree: Manager node with subordinate count badge (e.g., 6) and sibling navigation arrows.",
      "Organization Directory: Search by name, filter by department with reset, and sort criteria.",
      "Quick Action Jump Links: 'View Profile' and 'Org Chart' directly on table rows.",
      "Universal Search Scope: Toggle search between People and Department across the platform."
    ],
  },
  "Separation & Exit Clearance": {
    title: "Separation & Multi-Department Exit Clearance",
    bullets: [
      "'Initiate Your Exit' self-service resignation workflow with notice period calculations.",
      "6-State Lifecycle Indicators: Approved, Rejected, Pending, Cancelled, Not Received Yet.",
      "Multi-Department Clearance: Parallel checklists for IT Assets, Finance Settlements, and HR Interviews.",
      "Secure access revocation and automated Form 16 / relieving letter generation."
    ],
  },
  "Policy Rules & No-Show SLA": {
    title: "Attendance Deduction Transparency & SLAs",
    bullets: [
      "480-Minute Shift Matrix: 0 to 240 mins worked = 1 Day EL deducted; 240 to 480 mins = 0.5 Day EL.",
      "No-Show Escalation SLA: Auto-warning generated at X+1 days; automated LWP deduction applied at X+2 days.",
      "Comp-off 11-Day Expiry: Automated countdown enforcing timely redemption of compensatory leaves.",
      "Transparent, dispute-free audit trail accessible to both employees and management."
    ],
  },
  "Alerts & Action Items": {
    title: "Segregated Alerts & Notification Center",
    bullets: [
      "Split Category Views: General 'Notifications' vs Required 'Actions'.",
      "Actions Sub-Tabs: 'Pending Actions' requiring immediate review vs 'Archived Actions'.",
      "1-Click inline approval and rejection triggers directly from notifications.",
      "Real-time badge counter on global header."
    ],
  },
  "Google Calendar Sync": {
    title: "My Calendar & 2-Way Google Sync",
    bullets: [
      "Month, Week, and Day calendar views with interactive date grids and event dots.",
      "1-Click 'Sync With Google Calendar' OAuth 2.0 integration.",
      "6-Item Color-Coded Event Filter: My Leave, Leave Request, Notify, Team Leave, Holiday, Week Off.",
      "Departmental overlay to avoid project scheduling conflicts."
    ],
  },
  "Indian Statutory Payroll": {
    title: "Indian Payroll & Statutory Compliance",
    bullets: [
      "Automated EPF (Provident Fund) and ESI calculations matching statutory ceilings.",
      "State-wise Professional Tax (PT) calculations for Karnataka, Maharashtra, Delhi, etc.",
      "1-Click PDF payslip generation and download for all employees.",
      "Bank-ready transfer CSV registers for fast monthly salary disbursement."
    ],
  },
  "Multi-Tenant Subdomains": {
    title: "Multi-Tenancy & Dual Mode Login",
    bullets: [
      "Dedicated tenant subdomains ([company].rolesync.com) with custom branding.",
      "Dual Login Mode: Switch seamlessly between Work Email and Employee Code.",
      "Password visibility toggle and instant email password recovery.",
      "Strict Row Level Security (RLS) ensuring 100% tenant data isolation."
    ],
  },
  "Performance & 1:1 Reviews": {
    title: "Performance Management & 1:1 Check-ins",
    bullets: [
      "4 Sub-Tabs: My 1:1 Meetings, OKR Updates, Regular Peer Feedback, and Review Cycles.",
      "Scope-based search filter: Search by People vs Search by Department.",
      "360-degree review cycles, self-appraisals, and manager scorecards.",
      "Alignment of personal monthly targets to corporate strategic goals."
    ],
  }
};

/* ─── Complete Features Grid (All 16 Modules) ─── */
const ALL_FEATURES = [
  { icon: Clock, title: "Time & Attendance", category: "Attendance & Shifts", desc: "Live punch timer (HH:MM:SS), 3-series daily charts, and 480-min shift deduction rules.", hasPreview: true },
  { icon: IndianRupee, title: "My Compensation & CTC", category: "Payroll & Tax", desc: "CTC breakdown, basic/allowances, EPF/PT deductions, PDF payslips, and Form 12BB.", hasPreview: true },
  { icon: FolderLock, title: "7-Tab Profile & Vault", category: "Employee Records", desc: "Personal, Professional, Contact, Emergency, Financial, Work, and 2MB Document Vault.", hasPreview: true },
  { icon: BookOpen, title: "Knowledge Base & SOPs", category: "Policies & Hub", desc: "Searchable company policies, 480-min shift deduction matrix, and 1-click PDF downloads.", hasPreview: true },

  { icon: FileCheck2, title: "Bulk Regularization & WFH", category: "Attendance & Shifts", desc: "1-click bulk select, WFH/Missed Punch/On Duty KPI counter cards, and manager approvals.", hasPreview: true },
  { icon: CalendarDays, title: "6-Tier Leave Engine", category: "Leave Management", desc: "Bereavement, Casual, Earned, LWP, Menstrual, Sick quotas with Table/Card views and holiday opt-ins.", hasPreview: true },
  { icon: Plane, title: "Travel & Expense Claims", category: "Expense Management", desc: "Multi-tab Travel, Expenses, and Cash Advances with 'Viewing As' delegate switcher.", hasPreview: true },
  { icon: Award, title: "Peer Badges & Intranet", category: "Culture & Social", desc: "'Give A Badge' awards (Applause), Birthday spotlight hero, and named/anonymous social feed.", hasPreview: true },

  { icon: Network, title: "Org Chart & Directory", category: "People & Org", desc: "Dynamic tree with subordinate count badges (6), sibling arrows, and searchable employee directory.", hasPreview: true },
  { icon: Scale, title: "Policy Rules & No-Show SLA", category: "Governance", desc: "0-240m = 1d EL, 240-480m = 0.5d EL, X+1 notice, X+2 deduction, and 11-day comp-off expiry.", hasPreview: true },
  { icon: UserX, title: "Separation & Exit Clearance", category: "Separation", desc: "'Initiate Exit' workflow, 6-state lifecycle tracking, and IT/HR/Finance clearance checklists.", hasPreview: true },
  { icon: Bell, title: "Alerts & Action Items", category: "Governance", desc: "Segregated Notifications vs Actions with Pending and Archived sub-tabs for fast approvals.", hasPreview: true },

  { icon: Calendar, title: "Google Calendar Sync", category: "Integrations", desc: "2-way Google Calendar OAuth sync with 6-color event legend filters and Month/Week views.", hasPreview: true },
  { icon: BadgePercent, title: "Indian Statutory Payroll", category: "Payroll & Tax", desc: "EPF, ESI, state-wise Professional Tax, 1-click PDF payslips, and bank transfer CSVs.", hasPreview: true },
  { icon: Globe, title: "Multi-Tenant Subdomains", category: "Enterprise & Security", desc: "Company subdomain resolution, dual login (Email vs Emp Code), and strict RLS data isolation.", hasPreview: true },
  { icon: Target, title: "Performance & 1:1 Reviews", category: "Performance", desc: "1:1 meeting notes, OKR goal check-ins, continuous peer feedback, and formal review cycles.", hasPreview: true },
];

function FeaturesSection() {
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);
  const preview = previewOpen ? FEATURE_PREVIEWS[previewOpen] : null;

  return (
    <section id="features" className="w-full bg-background py-16 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Feature Catalog</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">
            All Modules, One Platform
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Stop juggling five disconnected tools. Everything your HR team needs ships in a single cloud workspace.
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
    { feature: "Time & Attendance", employee: "Live Punch (HH:MM:SS) & 3-Series Work Charts", admin: "Real-Time Org Attendance Radar & Shift Config", superAdmin: "Cross-Tenant Shift Analytics & Policies" },
    { feature: "Break & Shift Rules", employee: "Live Break Timer & General Shift 1120 Roster", admin: "480-Min Deduction Matrix & No-Show Rules", superAdmin: "Global Rule Configuration Presets" },
    { feature: "My Compensation & CTC", employee: "Detailed CTC Breakdown, Form 12BB & PDF Payslips", admin: "Salary Slabs, Pay Components & Revision Logs", superAdmin: "Bank Payout Gateways & Statutory Rule Builder" },
    { feature: "7-Tab Profile Vault", employee: "Personal, Professional, Contact, Emergency & Documents", admin: "Verification Approvals & 2MB Document Compliance", superAdmin: "Field Schema & Encryption Audits" },
    { feature: "Knowledge Base & SOPs", employee: "Searchable Policy Library & 1-Click PDF Downloads", admin: "Policy Publisher, Categories & Version Management", superAdmin: "Statutory Compliance Policy Blueprints" },
    { feature: "Leaves & Holidays", employee: "6 Quota Buckets & Optional Holiday Opt-in", admin: "Approval SLAs, Policy Builder & CSV Export", superAdmin: "Statutory Leave Templates" },
    { feature: "Regularize & WFH", employee: "Bulk Date Selection & WFH/On-Duty Requests", admin: "Approval Chains (Lead → Manager → HR)", superAdmin: "Immutable Audit Trail" },
    { feature: "Travel & Expenses", employee: "Submit Travel, Expense Claims & Advances", admin: "Multi-tier Expense Audits & 'Viewing As' Proxy", superAdmin: "Multi-Currency Financial Rules" },
    { feature: "Culture & Intranet", employee: "'Give A Badge' (Applause) & Birthday Wishes", admin: "Broadcast Channels & Moderation Tools", superAdmin: "Platform-wide Social Controls" },
    { feature: "People & Org Tree", employee: "Interactive Hierarchy Tree & Directory Lookup", admin: "Department Re-org & Role Matrix", superAdmin: "Tenant Domain & Multi-Branch Mapping" },
    { feature: "Separation & Exit", employee: "Initiate Exit Self-Service & Track Clearances", admin: "IT, HR, Finance Parallel Clearance Engine", superAdmin: "Legal Compliance & Relieving Slips" },
    { feature: "Indian Payroll", employee: "Download Monthly PDF Payslips & Tax Declarations", admin: "EPF/ESI Auto-Deductions & Bank CSV Transfer", superAdmin: "GST Invoices & Statutory Audit" },
    { feature: "Alerts & Security", employee: "Separate Notifications vs Actions + Google Sync", admin: "Session Manager, 2FA Enforcement & RLS", superAdmin: "Tenant Isolation, Backups & SLA" },
  ];

  return (
    <section id="roles" className="w-full bg-accent/20 py-16 lg:py-24 border-y border-border/40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Role Matrix</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Built for Every Stakeholder</h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">Distinct, tailored interfaces designed specifically for Employees, People Managers, HR Admins, and Enterprise Executives.</p>
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
    { num: "01", title: "Claim Workspace Subdomain", desc: "Enter your organization name and get your dedicated workspace (e.g. acme.rolesync.com) instantly." },
    { num: "02", title: "Configure Shifts & Policies", desc: "Set up 480-minute shift rules, 6 leave quota categories, deduction matrices, and office geofences." },
    { num: "03", title: "Invite Your Workforce", desc: "Add team members with Work Email or Employee Code. Employees jump straight into self-service portals." },
    { num: "04", title: "Run Entire HR on Autopilot", desc: "Employees punch in, regularize shifts, file travel claims, give badges, and download payslips with zero friction." },
  ];

  return (
    <section id="how-it-works" className="w-full bg-background py-16 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Onboarding Flow</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Go Live in 4 Simple Steps</h2>
          <p className="mt-2 text-muted-foreground text-sm">Zero infrastructure setup needed. Everything runs securely in the cloud.</p>
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
      name: "Starter", price: "Free", period: "", desc: "Free for teams up to 10. Core shift tracking, leave quotas, and org directory.",
      features: [
        "Up to 10 employees",
        "Real-time punch & break timer",
        "7-Tab profile & document vault",
        "6-category leave quotas",
        "Attendance bulk regularization",
        "Social intranet & 'Give A Badge'",
        "Interactive Org Chart tree",
        "Email support"
      ],
      cta: "Start Free", popular: false,
    },
    {
      name: "Professional", price: "₹99", period: "/user/mo", desc: "Complete HRMS with travel claims, exit clearances, knowledge base, and Indian statutory payroll.",
      features: [
        "Unlimited employees", 
        "Everything in Starter", 
        "Detailed CTC breakdown & PDF payslips",
        "Form 12BB tax investment declarations",
        "Searchable knowledge base & SOP library",
        "Travel, Expense Claims & Cash Advances",
        "Separation & multi-department exit clearance",
        "Performance reviews & 1:1 check-in notes",
        "EPF, ESI & Professional Tax compliance",
        "2-Way Google Calendar sync",
        "Segregated Actions vs Notifications alert center",
        "Priority 24/7 support"
      ],
      cta: "Start 14-Day Trial", popular: true,
    },
    {
      name: "Enterprise", price: "Custom", period: "", desc: "Custom pricing for 100+ employees. SSO, white-label domain, and hardware API sync.",
      features: [
        "Everything in Professional", 
        "Custom domain white-labeling (portal.company.com)", 
        "SSO / SAML 2.0 integration", 
        "Biometric device hardware integration APIs",
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
    { img: testimonial1, name: "Rajesh Kumar", role: "CTO, TechBite Solutions (Bengaluru)", text: "We cut attendance discrepancies by 90% in the first month. The live punch timer and batch regularization replaced two spreadsheets and a WhatsApp group." },
    { img: testimonial2, name: "Priya Sharma", role: "HR Head, ZenithWorks (New Delhi)", text: "Managing EPF, ESI, and Professional Tax used to take 3 days every month. With RoleSync payroll, it takes 15 minutes. The leave quotas and kudos wall are a bonus our team actually uses." },
    { img: testimonial3, name: "Ananya Singh", role: "Director, CloudScale (Mumbai)", text: "Travel claims, exit clearances, and the org chart replaced four separate subscriptions. Our finance team finally has one source of truth." },
  ];

  return (
    <section id="testimonials" className="w-full bg-background py-16 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3 px-3 py-1">Customer Reviews</Badge>
          <h2 className="font-[Poppins] text-3xl font-bold text-foreground lg:text-4xl">Trusted by Fast-Growing Teams</h2>
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
    { q: "Can employees log in using either Work Email or Employee Code?", a: "Yes. RoleSync provides a dual-mode login interface allowing team members to sign in with their corporate email or assigned Employee Code (e.g. INT1415) under their company subdomain." },
    { q: "How do employees view their CTC breakdown, submit Form 12BB, and download payslips?", a: "Employees navigate to the 'My Compensation' portal where they see their full annual CTC breakdown (Basic, HRA, Special Allowance, PF, etc.), net in-hand take home, monthly tax deductions, self-service Form 12BB declaration builder (80C/80D/HRA), and 1-click PDF payslip downloads." },
    { q: "What information is supported in the 7-Tab Profile & Document Vault?", a: "RoleSync covers 7 structured tabs: Personal Details (marital status, DOB, anniversaries), Professional Profile (degrees, past experience, employee ID), Contact Details, Emergency Nominees, Financial (Bank AC & IFSC), Work Profile (designation, department, reporting manager), and Forms/Documents/Letters with 2MB limits and timestamped audit trails." },
    { q: "How does batch attendance regularization and the 480-minute shift policy work?", a: "Employees can select individual dates or use batch shortcuts like 'Check all excluding weekends'. The system enforces transparent deduction tiers: 0-240 minutes worked results in a 1-day EL deduction, while 240-480 minutes results in a 0.5-day EL deduction. Missed punches trigger an X+1 warning and X+2 automatic LWP deduction SLA." },
    { q: "What leave categories are included in the 6-tier engine?", a: "RoleSync comes standard with Bereavement Leave, Casual Leave, Earned (Annual) Leave, Leave Without Pay (LWP), Menstrual Leave, and Sick Leave. Both Table View and Card View are supported with automated balance deductions and SLA escalations." },
    { q: "How does the 'Give A Badge' peer recognition system work?", a: "Employees can open the Intranet wall, click 'Give A Badge', choose a badge (such as 'Applause' or 'Star Performer'), tag a teammate, and write a citation. The post renders with an illuminated recognition banner on the company social feed." },
    { q: "How does the Travel & Expense management module operate?", a: "RoleSync divides expenses into Travel Itineraries, Expense Claims, and Cash Advances. Authorized delegates can file on behalf of executives using the 'Viewing As' switcher, and claims follow multi-tier workflow approvals." },
    { q: "Do you support Indian statutory payroll like EPF, ESI, and Professional Tax?", a: "Yes, 100%. RoleSync supports EPF (Provident Fund), ESI calculations, state-wise Professional Tax slabs, downloadable PDF payslips, bank transfer CSVs, and GST-compliant tax invoices." },
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
        <p className="mb-6 text-sm text-muted-foreground">Enter your company name to open your workspace.</p>
        
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
            Run Your Entire HR on <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-primary bg-clip-text text-transparent">Autopilot</span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            500+ companies save 25+ hours a week on attendance, leaves, expenses, and payroll. Start your 14-day free trial today.
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
    const companyName = domain.charAt(0).toUpperCase() + domain.slice(1);
    const slug = `${domain}-${Date.now().toString(36).slice(-5)}`;
    const { error } = await supabase.from("companies").insert({ name: companyName, slug, status: "active" });
    setSending(false);
    if (error) {
      toast.error("Could not create workspace. Please try again.", { description: error.message });
    } else {
      toast.success(`Workspace "${companyName}" created!`, { description: "Redirecting to login…" });
      setFooterEmail("");
      navigate(`/login?company=${slug}`);
    }
  };


  const navCols = [
    {
      title: "Core Modules",
      links: [
        { label: "Time & Attendance", href: "#features" },
        { label: "Compensation & CTC", href: "#features" },
        { label: "7-Tab Profile Vault", href: "#features" },
        { label: "Knowledge Base & SOPs", href: "#features" },
        { label: "6-Quota Leaves & Holidays", href: "#features" },
        { label: "Travel & Expense Claims", href: "#features" },
        { label: "Peer Badges & Intranet", href: "#features" },
        { label: "Interactive Org Chart", href: "#features" },
        { label: "Separation & Clearance", href: "#features" }
      ]
    },
    {
      title: "Compliance & Security",
      links: [
        { label: "EPF & ESI Compliance", href: "#features" },
        { label: "State Professional Tax", href: "#features" },
        { label: "Multi-Tenant RLS Security", href: "#features" },
        { label: "Privacy Policy", href: "/privacy", isRoute: true },
        { label: "Terms of Service", href: "/terms", isRoute: true }
      ]
    },
    {
      title: "Quick Links",
      links: [
        { label: "Interactive Showcase", href: "#showcase" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Role Matrix", href: "#roles" },
        { label: "Pricing Plans", href: "/pricing", isRoute: true },
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
            RoleSync is an enterprise HRMS for fast-growing teams. Attendance, leaves, travel claims, peer recognition, and payroll compliance in one platform.
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
