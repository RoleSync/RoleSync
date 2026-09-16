import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertTriangle, CheckCircle2, XCircle, Clock, Ban, AlertCircle, 
  Send, UserMinus, FileText, Laptop, ShieldCheck, DollarSign, 
  Download, HelpCircle, ArrowRight, Building2, User, Calendar as CalendarIcon,
  Check, X, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type SeparationStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'not_received_yet';

interface SeparationRequest {
  id: string;
  resignation_date: string;
  reason_category: string;
  detailed_reason: string;
  tentative_lwd: string;
  notice_period_days: number;
  buyout_requested: boolean;
  buyout_reason?: string;
  personal_email: string;
  personal_phone: string;
  status: SeparationStatus;
  
  // 5 Clearances
  manager_clearance: 'pending' | 'approved' | 'rejected';
  hr_exit_interview: 'pending' | 'completed';
  it_assets_clearance: 'pending' | 'cleared';
  finance_fnf_clearance: 'pending' | 'cleared';
  
  relieving_letter_ready: boolean;
}

export default function EmployeeSeparation() {
  const { user } = useAuth();

  // Separation Data State with local storage persistence
  const [separationData, setSeparationData] = useState<SeparationRequest | null>(() => {
    const saved = localStorage.getItem('rolesync_separation_request');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    if (separationData) {
      localStorage.setItem('rolesync_separation_request', JSON.stringify(separationData));
    } else {
      localStorage.removeItem('rolesync_separation_request');
    }
  }, [separationData]);

  // Dialog States
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [policyGuideOpen, setPolicyGuideOpen] = useState(false);
  const [exitInterviewOpen, setExitInterviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [reasonCategory, setReasonCategory] = useState('Career Growth / Better Opportunity');
  const [detailedReason, setDetailedReason] = useState('');
  const [tentativeLwd, setTentativeLwd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60); // 60-day standard notice period
    return d.toISOString().split('T')[0];
  });
  const [buyoutRequested, setBuyoutRequested] = useState(false);
  const [buyoutReason, setBuyoutReason] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');

  // Handle Submit Resignation / Initiate Exit
  const handleInitiateExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedReason.trim() || !personalEmail.trim() || !personalPhone.trim()) {
      toast.error('Please fill all required resignation details and contact information.');
      return;
    }
    setSubmitting(true);

    const newReq: SeparationRequest = {
      id: `EXIT-${Math.floor(1000 + Math.random() * 9000)}`,
      resignation_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      reason_category: reasonCategory,
      detailed_reason: detailedReason.trim(),
      tentative_lwd: new Date(tentativeLwd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notice_period_days: 60,
      buyout_requested: buyoutRequested,
      buyout_reason: buyoutReason.trim(),
      personal_email: personalEmail.trim(),
      personal_phone: personalPhone.trim(),
      status: 'pending',
      manager_clearance: 'pending',
      hr_exit_interview: 'pending',
      it_assets_clearance: 'pending',
      finance_fnf_clearance: 'pending',
      relieving_letter_ready: false
    };

    setSeparationData(newReq);
    setSubmitting(false);
    setInitiateDialogOpen(false);
    toast.success('Resignation request submitted for Manager & HR approval.');
  };

  // Cancel Resignation
  const handleCancelResignation = () => {
    if (!separationData) return;
    setSeparationData(prev => prev ? ({ ...prev, status: 'cancelled' }) : null);
    toast.info('Resignation request marked as Cancelled.');
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Initiate Your Exit</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your resignation submission, department clearances, exit interview, and Full & Final (FnF) settlement
          </p>
        </div>
      </div>

      {/* ─── Subheader / Status Legend & Action Button (Exact match to screenshot) ─── */}
      <Card className="p-4 border-border/70 shadow-sm bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="h-4 w-4" /> Approved
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-500">
              <XCircle className="h-4 w-4" /> Rejected
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
              <Clock className="h-4 w-4" /> Pending
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Ban className="h-4 w-4" /> Cancelled
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <AlertCircle className="h-4 w-4" /> Not Received Yet!
            </span>
          </div>

          {/* Action Button: Initiate */}
          <div>
            {!separationData || separationData.status === 'cancelled' ? (
              <Button 
                onClick={() => setInitiateDialogOpen(true)}
                className="h-9 px-6 bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Initiate
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelResignation}
                className="h-9 text-xs font-semibold text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
              >
                Cancel Resignation
              </Button>
            )}
          </div>

        </div>
      </Card>

      {/* ─── Main Content View (Empty State matching screenshot OR Populated Tracker) ─── */}
      {!separationData || separationData.status === 'cancelled' ? (
        
        /* Exact Empty State matching user screenshot */
        <Card className="p-16 text-center border-border/70 shadow-sm min-h-[380px] flex flex-col items-center justify-center bg-card">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
            
            {/* Warning Triangle Yellow Icon */}
            <div className="mb-4">
              <AlertTriangle className="h-16 w-16 text-amber-500 fill-amber-500/20 stroke-[1.75]" />
            </div>

            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-foreground mb-1">
              No Exit Request
            </h3>
            
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              You haven't submitted a resignation request. Use the button above to start the exit process.
            </p>

            <Button 
              onClick={() => setInitiateDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-indigo-600 font-semibold text-xs px-6 h-9 shadow-md shadow-primary/20"
            >
              Initiate Resignation Request
            </Button>
          </div>
        </Card>

      ) : (

        /* Active Separation Offboarding Tracker View */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Active Summary Card */}
          <Card className="p-6 border-border/70 shadow-sm bg-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {separationData.id}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">Submitted on {separationData.resignation_date}</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mt-1">
                  Resignation: {separationData.reason_category}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Overall Separation Status:</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mt-0.5">
                  <Clock className="h-3.5 w-3.5" /> Pending Approvals & Clearances
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-muted-foreground font-medium">Tentative Last Working Day</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{separationData.tentative_lwd}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-muted-foreground font-medium">Notice Period</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{separationData.notice_period_days} Days (Standard)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-muted-foreground font-medium">Notice Buyout / Early Release</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{separationData.buyout_requested ? 'Requested ⚡' : 'Not Requested'}</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-muted/20 border border-border/40 text-xs">
              <span className="font-semibold text-muted-foreground block mb-1">Resignation Remarks:</span>
              <p className="text-foreground leading-relaxed italic">"{separationData.detailed_reason}"</p>
            </div>
          </Card>

          {/* 5-Step Offboarding Pipeline Tracker */}
          <Card className="p-6 border-border/70 shadow-sm bg-card">
            <h4 className="font-heading font-bold text-base text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Offboarding & Clearance Checklist
            </h4>

            <div className="space-y-4">
              
              {/* Step 1: Resignation Submission */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">1. Resignation Submission</h5>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                      Completed
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Formal resignation recorded in HRMS on {separationData.resignation_date}.
                  </p>
                </div>
              </div>

              {/* Step 2: Manager Clearance */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/20">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">2. Manager & Project Handover Clearance</h5>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                      In Progress
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Knowledge transfer (KT) document review, pending PRs, and project transition with team lead.
                  </p>
                </div>
              </div>

              {/* Step 3: HR Exit Interview */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/20">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">3. HR Exit Interview & Feedback</h5>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setExitInterviewOpen(true)}
                      className="h-7 text-xs font-semibold"
                    >
                      Fill Exit Feedback
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confidential exit interview regarding company culture, growth, and organizational feedback.
                  </p>
                </div>
              </div>

              {/* Step 4: IT Assets Clearance */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/20">
                <div className="h-8 w-8 rounded-full bg-slate-500/20 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">4. IT Hardware & Access Revocation</h5>
                    <Badge variant="outline" className="text-[10px]">
                      Scheduled for LWD
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Handover of official company laptop, monitor, security ID card, and email deactivation on last working day.
                  </p>
                </div>
              </div>

              {/* Step 5: Finance FnF Settlement & Documents */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/20">
                <div className="h-8 w-8 rounded-full bg-slate-500/20 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-sm">5. Full & Final (FnF) Settlement & Relieving Letter</h5>
                    <Badge variant="outline" className="text-[10px]">
                      Within 30–45 Days
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Encashment of unavailed earned leaves, final salary disbursal, Form 16, and digitally signed Relieving & Service Certificate.
                  </p>
                </div>
              </div>

            </div>
          </Card>

        </div>

      )}

      {/* ─── Initiate Resignation Modal Dialog ─── */}
      <Dialog open={initiateDialogOpen} onOpenChange={setInitiateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-primary" />
              Initiate Separation / Resignation
            </DialogTitle>
            <DialogDescription>
              Submit your formal resignation notice for management and HR offboarding.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInitiateExit} className="space-y-4 py-2">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Primary Reason for Leaving</Label>
              <Select value={reasonCategory} onValueChange={setReasonCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Career Growth / Better Opportunity">Career Growth / Better Opportunity</SelectItem>
                  <SelectItem value="Higher Education / Studies">Higher Education / Studies</SelectItem>
                  <SelectItem value="Relocation / Family Grounds">Relocation / Family Grounds</SelectItem>
                  <SelectItem value="Personal Health / Well-being">Personal Health / Well-being</SelectItem>
                  <SelectItem value="Entrepreneurship / Own Venture">Entrepreneurship / Own Venture</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Resignation Notice Letter</Label>
              <Textarea 
                required 
                rows={3} 
                placeholder="State your formal resignation notice and handover commitment…" 
                value={detailedReason} 
                onChange={e => setDetailedReason(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tentative Last Working Day</Label>
                <Input 
                  type="date" 
                  required 
                  value={tentativeLwd} 
                  onChange={e => setTentativeLwd(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Standard Notice</Label>
                <Input disabled value="60 Calendar Days" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold cursor-pointer" htmlFor="buyout-chk">
                  Request Notice Period Buyout / Early Relieving
                </Label>
                <input 
                  id="buyout-chk"
                  type="checkbox"
                  checked={buyoutRequested}
                  onChange={(e) => setBuyoutRequested(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </div>
              {buyoutRequested && (
                <Input 
                  placeholder="Reason for early release request…"
                  value={buyoutReason}
                  onChange={(e) => setBuyoutReason(e.target.value)}
                  className="text-xs h-8"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Personal Email ID (For FnF/Relieving)</Label>
                <Input 
                  type="email" 
                  required 
                  placeholder="personal@gmail.com" 
                  value={personalEmail} 
                  onChange={e => setPersonalEmail(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Personal Phone Number</Label>
                <Input 
                  type="tel" 
                  required 
                  placeholder="+91 98765 43210" 
                  value={personalPhone} 
                  onChange={e => setPersonalPhone(e.target.value)} 
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setInitiateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-primary to-indigo-600">
                Submit Resignation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Exit Interview Feedback Dialog ─── */}
      <Dialog open={exitInterviewOpen} onOpenChange={setExitInterviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              HR Exit Interview Questionnaire
            </DialogTitle>
            <DialogDescription>
              Your constructive feedback helps us improve company culture and working environment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Overall Experience at RoleSync (1-5 ⭐)</Label>
              <Select defaultValue="5">
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Highly Fulfilling</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 - Good Experience</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 - Average</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">What did you enjoy most about your role?</Label>
              <Textarea rows={2} placeholder="Team culture, mentorship, technology stack…" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Suggestions for improvement</Label>
              <Textarea rows={2} placeholder="Process, tooling, work-life balance…" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setExitInterviewOpen(false); toast.success("Exit feedback recorded!"); }}>
              Submit Exit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
