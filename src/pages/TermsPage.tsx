import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RoleSyncLogo } from '@/components/RoleSyncLogo';
import { ArrowLeft, Scale, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
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
              <Scale className="h-3.5 w-3.5" /> Legal Agreement
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm sm:text-base leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing, registering for, or using the RoleSync workforce management platform ("Service"), you agree to be bound by these Terms of Service. If you are registering on behalf of an enterprise or organization, you represent that you have the authority to bind that entity to these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                2. Multi-Tenant Accounts & Administrator Responsibilities
              </h2>
              <p className="text-muted-foreground">
                Company owners and designated administrators are responsible for managing employee provisioning, access tiers, feature configurations, and keeping their account credentials secure. Any activity that occurs under a tenant account is the responsibility of that organization.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                3. Acceptable Use & Geolocation Rules
              </h2>
              <p className="text-muted-foreground">
                Users agree not to attempt location spoofing, mock GPS simulation, reverse-engineering of attendance algorithms, unauthorized penetration testing, or interfering with multi-tenant security boundaries. Violations may result in immediate suspension.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                4. Subscription Plans, Billing & SLA
              </h2>
              <p className="text-muted-foreground">
                RoleSync offers tiered plans (Basic, Pro, and Enterprise). Subscription fees are billed on recurring monthly or annual intervals. Enterprise plans include guaranteed 99.9% uptime Service Level Agreements (SLA) and dedicated account management.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                5. Intellectual Property
              </h2>
              <p className="text-muted-foreground">
                RoleSync and its underlying software, design systems, APIs, and algorithms are the proprietary property of RoleSync Technologies. Your company retains full ownership of your proprietary employee data, reports, and attendance logs.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                6. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by applicable law, RoleSync Technologies shall not be liable for indirect, punitive, or consequential damages arising from service downtime, force majeure events, or third-party network outages.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                7. Contact Information
              </h2>
              <p className="text-muted-foreground">
                For questions regarding these Terms, contact legal affairs at:
              </p>
              <div className="p-4 rounded-xl border bg-muted/40 font-mono text-xs">
                Email: legal@rolesync.technoml.in | support@rolesync.technoml.in
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
