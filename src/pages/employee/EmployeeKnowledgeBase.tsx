import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, Search, FileText, Download, ExternalLink, ShieldCheck, 
  Clock, Calendar, HeartPulse, Laptop, Plane, UserMinus, HelpCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  updatedAt: string;
  readTime: string;
  author: string;
  icon: any;
}

const ARTICLES: Article[] = [
  {
    id: 'kb-1',
    title: '480-Minute Work Shift & Deduction Policy',
    category: 'Attendance & Leaves',
    description: 'Detailed breakdown of the 480-minute standard shift, attendance penalties, 0-240m vs 240-480m deduction tiers, and No-Show rules.',
    content: `
# 480-Minute Work Shift & Deduction Policy

## 1. General Shift Hours (Shift Code: 1120)
* **Shift Timing:** 11:00 AM – 08:00 PM (Monday to Saturday)
* **Total Required Shift Duration:** 480 Minutes (8 Hours excluding 1-hour lunch & breaks)
* **Weekly Off:** Sunday

## 2. Policy Breach & Deduction Matrix
If total tracked work hours fall below the 480-minute threshold without pre-approved leave or regularization:
* **Between 0 to 240 minutes worked:** 1 Full Day Earned Leave (EL) deducted.
* **Between 240 to 480 minutes worked:** 0.5 Half Day Earned Leave (EL) deducted.
* If Earned Leave balance is 0, deduction cascades to **Leave Without Pay (LWP)**.

## 3. No-Show Policy
* **Definition:** No clock-in + No leave application + No regularization by shift closure.
* **Notification:** Sent on Day X + 1 to the employee.
* **Resolution Deadline:** End of Day X + 2 or Payroll Lock Date.
* **Action:** Failure to regularize results in automatic 1-day LWP deduction.
    `,
    updatedAt: '15-Aug-2026',
    readTime: '3 min read',
    author: 'People Operations',
    icon: Clock
  },
  {
    id: 'kb-2',
    title: '6-Tier Leave Quota Rules & Optional Holidays',
    category: 'Attendance & Leaves',
    description: 'Comprehensive guidelines for Bereavement, Casual, Earned, LWP, Menstrual, and Sick leaves, along with mandatory vs restricted holiday opt-ins.',
    content: `
# 6-Tier Leave Quota Rules & Optional Holidays

## 1. Leave Categories
* **Casual Leave (CL):** 12 Days per year. Maximum 3 consecutive days.
* **Earned Leave (EL):** 18 Days per year. Can be carried forward up to 30 days.
* **Sick Leave (SL):** 10 Days per year. Medical certificate required for 3+ consecutive days.
* **Menstrual Leave:** 1 Day per month for eligible employees without deduction.
* **Bereavement Leave:** Up to 5 working days for immediate family members.
* **Leave Without Pay (LWP):** Applicable when quotas are exhausted or for extended approved sabbaticals.

## 2. Mandatory vs Restricted Holidays
* **Mandatory Holidays:** Fixed pan-organization paid holidays (Republic Day, Independence Day, Gandhi Jayanti, etc.).
* **Restricted / Optional Holidays:** Employees can choose up to 2 floating holidays from the company festival roster via the Leave Management portal.
    `,
    updatedAt: '01-Sep-2026',
    readTime: '4 min read',
    author: 'HR Governance',
    icon: Calendar
  },
  {
    id: 'kb-3',
    title: 'Domestic & International Travel Reimbursement Policy',
    category: 'Travel & Expenses',
    description: 'Rules for booking flight itineraries, hotel tier allowances, per-diem meals, cab allowances, and cash advances.',
    content: `
# Domestic & International Travel Policy

## 1. Pre-Travel Approval
* All business travel must be raised under **My Expenses -> Travel** at least 7 days prior to departure.
* Requires **Approved by Workflow** (Manager + Finance Desk).

## 2. Expense Submission & Receipts
* Original GST tax invoices must be attached for all claims > ₹500.
* Claims must be submitted within 15 calendar days post-travel.
* Cash advances must be reconciled against submitted bills within 10 days of return.

## 3. Daily Per-Diem Limits
* Tier 1 Cities (Bengaluru, Mumbai, Delhi-NCR): Up to ₹2,500/day for meals & local transit.
* Tier 2/3 Cities: Up to ₹1,800/day.
    `,
    updatedAt: '20-Jul-2026',
    readTime: '5 min read',
    author: 'Finance & Accounts',
    icon: Plane
  },
  {
    id: 'kb-4',
    title: 'Employee Separation & Exit Clearance Workflow',
    category: 'Exit & Separation',
    description: 'Notice period terms, resignation submission steps, IT asset handover, and final settlement timelines.',
    content: `
# Employee Separation & Exit Clearance Workflow

## 1. Initiating Resignation
* Submit exit request via **My Separation -> Initiate Your Exit**.
* System automatically calculates Last Working Day (LWD) based on contractual notice period (typically 60-90 days).

## 2. Multi-Department Clearance Process
* **IT Desk:** Hardware laptop, monitor, security dongle return.
* **Finance:** Loan/advance reconciliations, expense settlements.
* **HR Desk:** Exit interview questionnaire, Form 16 issuance, Relieving Letter.
* **Full & Final Settlement (FnF):** Disbursed within 30 days of the Last Working Day.
    `,
    updatedAt: '10-Jun-2026',
    readTime: '3 min read',
    author: 'HR Compliance',
    icon: UserMinus
  },
  {
    id: 'kb-5',
    title: 'Code of Conduct & Workplace Wellbeing',
    category: 'Company Guidelines',
    description: 'Corporate ethics, POSH compliance, anti-harassment standards, and employee assistance programs.',
    content: `
# Code of Conduct & Workplace Wellbeing

## 1. Professional Conduct
* Equal opportunity and zero-tolerance policy towards harassment, discrimination, and bullying.
* Internal Complaints Committee (ICC) available 24/7 for POSH grievances.

## 2. Employee Assistance & Mental Wellness
* Access to confidential 1-on-1 counseling sessions via company wellbeing partner.
* Peer recognition via Intranet "Give A Badge" and Kudos Wall.
    `,
    updatedAt: '05-Jan-2026',
    readTime: '4 min read',
    author: 'People & Culture',
    icon: HeartPulse
  },
  {
    id: 'kb-6',
    title: 'IT Security, Laptop Usage & VPN Setup',
    category: 'IT & Security',
    description: 'Device encryption, multi-factor authentication, remote VPN credentials, and acceptable software usage.',
    content: `
# IT Security & Laptop Usage Guidelines

## 1. Device Security
* Hard disk encryption (BitLocker / FileVault) must remain enabled at all times.
* Installation of unauthorized software or torrent clients is strictly prohibited.

## 2. Access Credentials & MFA
* Multi-factor authentication (MFA) mandatory on company email and SSO portals.
* Never share credentials or API tokens over public chat channels.
    `,
    updatedAt: '12-Aug-2026',
    readTime: '3 min read',
    author: 'IT Infrastructure',
    icon: Laptop
  }
];

const CATEGORIES = [
  'All',
  'Attendance & Leaves',
  'Travel & Expenses',
  'Exit & Separation',
  'Company Guidelines',
  'IT & Security'
];

export default function EmployeeKnowledgeBase() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const filteredArticles = ARTICLES.filter(a => {
    const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Knowledge Base & Policies
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Official company manuals, HR policies, compliance frameworks, and operational guidelines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success('Knowledge Base documents up to date')}>
              Check Updates
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search policies, attendance rules, expense guidelines, leave quotas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border/80 shadow-sm text-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full text-xs font-medium"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Article Cards Grid */}
        {filteredArticles.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="font-semibold text-base text-foreground">No Resources Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              No knowledge base articles match your search or filter criteria.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 text-xs"
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map(art => {
              const IconComp = art.icon;
              return (
                <Card 
                  key={art.id}
                  className="group hover:border-primary/50 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between"
                  onClick={() => setActiveArticle(art)}
                >
                  <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <IconComp className="h-4 w-4" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          {art.category}
                        </Badge>
                      </div>

                      <h3 className="font-heading font-semibold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {art.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{art.readTime}</span>
                      <span className="font-medium text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Read Policy →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Read Article Dialog */}
        <Dialog open={!!activeArticle} onOpenChange={() => setActiveArticle(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {activeArticle && (
              <>
                <DialogHeader className="border-b pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">{activeArticle.category}</Badge>
                    <span className="text-xs text-muted-foreground">• {activeArticle.readTime}</span>
                    <span className="text-xs text-muted-foreground">• Updated {activeArticle.updatedAt}</span>
                  </div>
                  <DialogTitle className="font-heading text-xl font-bold text-foreground">
                    {activeArticle.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4 text-sm text-foreground leading-relaxed whitespace-pre-line font-sans">
                  {activeArticle.content}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-xs text-muted-foreground">Issued by: {activeArticle.author}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs gap-1.5"
                      onClick={() => {
                        toast.success(`Downloaded "${activeArticle.title}.pdf"`);
                      }}
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </Button>
                    <Button size="sm" className="text-xs" onClick={() => setActiveArticle(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
