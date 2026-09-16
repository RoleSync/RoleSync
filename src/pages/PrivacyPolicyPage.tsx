import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RoleSyncLogo } from '@/components/RoleSyncLogo';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <RoleSyncLogo size={44} />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-xs font-semibold">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button size="sm" onClick={() => navigate('/login')} className="text-xs font-semibold">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="space-y-8">
          {/* Title Header */}
          <div className="space-y-3 border-b pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> Legal & Compliance
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Policy Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm sm:text-base leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                1. Introduction & Scope
              </h2>
              <p className="text-muted-foreground">
                RoleSync ("we", "our", or "us") is dedicated to safeguarding the privacy of our multi-tenant enterprise clients, administrators, and their employees ("Users"). This Privacy Policy describes how we collect, process, store, and protect your information across the RoleSync workforce management platform and associated web services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                2. Information We Collect
              </h2>
              <p className="text-muted-foreground">
                We collect information necessary to deliver reliable workforce management, attendance tracking, and governance:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Account Information:</strong> Full name, company work email, phone number, job title, department, and company affiliation.</li>
                <li><strong className="text-foreground">Attendance & Geolocation Data:</strong> GPS coordinates and timestamp verification captured solely when clocking in or clocking out through geofenced verification checkpoints.</li>
                <li><strong className="text-foreground">Facial & Selfie Verification:</strong> Profile verification selfies captured during attendance clock-ins, stored in encrypted company storage.</li>
                <li><strong className="text-foreground">Operational Records:</strong> Task completion metrics, leave applications, performance targets, kudos awards, and helpdesk inquiries.</li>
                <li><strong className="text-foreground">Technical & Audit Logs:</strong> IP address, device browser headers, login timestamps, and security audit trails.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                3. How We Use Your Data
              </h2>
              <p className="text-muted-foreground">
                RoleSync uses collected data strictly for lawful business purposes:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl border bg-card text-card-foreground">
                  <h3 className="font-semibold text-sm mb-1 flex items-center gap-1.5 text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Workforce Operations
                  </h3>
                  <p className="text-xs text-muted-foreground">Managing daily attendance logs, shift rosters, leave requests, and payroll calculations.</p>
                </div>
                <div className="p-4 rounded-xl border bg-card text-card-foreground">
                  <h3 className="font-semibold text-sm mb-1 flex items-center gap-1.5 text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Security & Anti-Fraud
                  </h3>
                  <p className="text-xs text-muted-foreground">Detecting mock GPS spoofing, preventing unauthorized company access, and maintaining audit logs.</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                4. Multi-Tenant Data Isolation & Security
              </h2>
              <p className="text-muted-foreground">
                RoleSync utilizes strict database-level Row Level Security (RLS) and cryptographic tenant isolation. Your company's records are segregated so that no other company or unauthorized tenant can access your private employee profiles, attendance records, or financial metrics.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                5. Data Retention & User Rights
              </h2>
              <p className="text-muted-foreground">
                We retain employee data for the duration of the company's active subscription and in accordance with applicable labor regulations. Employees have the right to inspect their personal data, request correction of inaccurate records, and view their attendance audit trail.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                6. Contact & Data Protection Officer
              </h2>
              <p className="text-muted-foreground">
                For questions or inquiries regarding our privacy practices, contact our security team at:
              </p>
              <div className="p-4 rounded-xl border bg-muted/40 font-mono text-xs">
                Email: privacy@rolesync.technoml.in | support@rolesync.technoml.in
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} RoleSync Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
