import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  DollarSign, Download, Eye, FileText, Calendar, Building2, 
  CreditCard, ShieldCheck, CheckCircle2, TrendingUp, HelpCircle, 
  Percent, ArrowUpRight, ArrowDownRight, Wallet, Receipt, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ActiveTab = 'salary_structure' | 'payslips' | 'tax_declarations' | 'bonuses';

interface PayslipItem {
  id: string;
  month: string;
  year: number;
  gross: number;
  deductions: number;
  net: number;
  paidDays: number;
  disbursalDate: string;
  status: 'Disbursed' | 'Processing';
}

export default function EmployeeCompensation() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('salary_structure');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [previewPayslip, setPreviewPayslip] = useState<PayslipItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Fetch live attendance data for the user
  useEffect(() => {
    async function loadAttendance() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from('attendance')
          .select('id, date, status, check_in, check_out')
          .eq('user_id', user.id);
        setAttendanceRecords(data || []);
      } catch (err) {
        console.error('Error loading attendance for compensation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [user?.id]);

  // CTC & Earnings Configuration (Indian Standard Structure based on role/profile)
  const isSenior = user?.role === 'admin' || user?.isOwner || user?.jobTitle?.toLowerCase().includes('lead') || user?.jobTitle?.toLowerCase().includes('manager');
  const annualCtc = isSenior ? 1450000 : 850000;
  const monthlyGross = Math.round(annualCtc / 12);
  
  const basicSalary = Math.round(monthlyGross * 0.50);
  const hra = Math.round(basicSalary * 0.50);
  const specialAllowance = Math.max(0, Math.round(monthlyGross - basicSalary - hra - 1600 - 1250));
  const conveyance = 1600;
  const medicalAllowance = 1250;

  // Deductions
  const epfEmployee = 1800;
  const professionalTax = 200;
  const incomeTaxTDS = isSenior ? 5500 : 2800;
  const totalDeductions = epfEmployee + professionalTax + incomeTaxTDS;
  const netTakeHome = monthlyGross - totalDeductions;

  // Generate dynamic monthly payslips using live attendance counts
  const payslips: PayslipItem[] = useMemo(() => {
    const months = [
      { name: 'August', num: 8, days: 31 },
      { name: 'July', num: 7, days: 31 },
      { name: 'June', num: 6, days: 30 },
      { name: 'May', num: 5, days: 31 },
      { name: 'April', num: 4, days: 30 },
      { name: 'March', num: 3, days: 31 },
      { name: 'February', num: 2, days: 28 },
      { name: 'January', num: 1, days: 31 },
    ];

    const currentYear = parseInt(selectedYear) || 2026;

    return months.map(m => {
      const monthPrefix = `${currentYear}-${String(m.num).padStart(2, '0')}`;
      const monthAtt = attendanceRecords.filter(a => a.date?.startsWith(monthPrefix));
      const presentCount = monthAtt.filter(a => a.status === 'present' || a.status === 'late').length;
      
      // Paid days = attended days or baseline default if no records logged yet
      const paidDays = presentCount > 0 ? Math.min(m.days, Math.max(presentCount, 22)) : (m.days - 8); // ~standard working days

      return {
        id: `PAY-${m.name.substring(0, 3).toUpperCase()}-${currentYear}`,
        month: m.name,
        year: currentYear,
        gross: monthlyGross,
        deductions: totalDeductions,
        net: netTakeHome,
        paidDays,
        disbursalDate: `${m.days}-${m.name.substring(0, 3)}-${currentYear}`,
        status: 'Disbursed'
      };
    });
  }, [selectedYear, attendanceRecords, monthlyGross, totalDeductions, netTakeHome]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              My Compensation & Payroll
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              CTC breakdown, salary slips, statutory deductions (EPF/PT), and tax declarations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-1 px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Direct Deposit Active (HDFC)
            </Badge>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Annual CTC</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mt-2">₹{annualCtc.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Total Cost to Company (FY 2026-27)</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Gross</span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-foreground mt-2">₹{monthlyGross.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Fixed Monthly Pre-Tax Earnings</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Net Take-Home</span>
              <Wallet className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">₹{netTakeHome.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Estimated In-Hand Salary / Month</p>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/60 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('salary_structure')}
            className={`py-2.5 px-4 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'salary_structure'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Salary Structure & CTC
          </button>
          <button
            onClick={() => setActiveTab('payslips')}
            className={`py-2.5 px-4 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'payslips'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Payslips & Statements
          </button>
          <button
            onClick={() => setActiveTab('tax_declarations')}
            className={`py-2.5 px-4 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'tax_declarations'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Tax & Declarations (Form 12BB)
          </button>
          <button
            onClick={() => setActiveTab('bonuses')}
            className={`py-2.5 px-4 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'bonuses'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Variable Pay & Benefits
          </button>
        </div>

        {/* Tab 1: Salary Structure */}
        {activeTab === 'salary_structure' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Breakdown */}
            <Card className="rounded-2xl border p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-heading font-bold text-base flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Monthly Earnings
                </h3>
                <span className="text-xs font-mono font-bold text-foreground">₹{monthlyGross.toLocaleString('en-IN')}/mo</span>
              </div>

              <div className="space-y-3 text-xs divide-y divide-border/40">
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Basic Salary (50% of Gross)</span>
                  <span className="font-mono font-semibold text-foreground">₹{basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">House Rent Allowance (HRA)</span>
                  <span className="font-mono font-semibold text-foreground">₹{hra.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Special Allowance</span>
                  <span className="font-mono font-semibold text-foreground">₹{specialAllowance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Conveyance Allowance</span>
                  <span className="font-mono font-semibold text-foreground">₹{conveyance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Medical Allowance</span>
                  <span className="font-mono font-semibold text-foreground">₹{medicalAllowance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </Card>

            {/* Deductions Breakdown */}
            <Card className="rounded-2xl border p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-heading font-bold text-base flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-rose-500" /> Monthly Deductions
                </h3>
                <span className="text-xs font-mono font-bold text-rose-500">-₹{totalDeductions.toLocaleString('en-IN')}/mo</span>
              </div>

              <div className="space-y-3 text-xs divide-y divide-border/40">
                <div className="flex justify-between pt-2">
                  <div>
                    <span className="text-foreground font-medium">Provident Fund (EPF - Employee Share)</span>
                    <p className="text-[10px] text-muted-foreground">Matched by Employer EPF ₹1,800</p>
                  </div>
                  <span className="font-mono font-semibold text-foreground">₹{epfEmployee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Professional Tax (Karnataka)</span>
                  <span className="font-mono font-semibold text-foreground">₹{professionalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <div>
                    <span className="text-foreground font-medium">Income Tax (TDS Deduction)</span>
                    <p className="text-[10px] text-muted-foreground">As per New Tax Regime slabs</p>
                  </div>
                  <span className="font-mono font-semibold text-foreground">₹{incomeTaxTDS.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Payslips */}
        {activeTab === 'payslips' && (
          <Card className="rounded-2xl border p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-heading font-bold text-base">Monthly Salary Slips</h3>
                <p className="text-xs text-muted-foreground">Download digital digitally-signed salary slips</p>
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">FY 2026-27</SelectItem>
                  <SelectItem value="2025">FY 2025-26</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="divide-y divide-border/40">
              {payslips.map(ps => (
                <div key={ps.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{ps.month} {ps.year} Payslip</h4>
                      <p className="text-[11px] text-muted-foreground">Disbursed on {ps.disbursalDate} · {ps.paidDays} Paid Days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-foreground">₹{ps.net.toLocaleString('en-IN')}</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">{ps.status}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setPreviewPayslip(ps)}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => toast.success(`Downloaded Payslip_${ps.month}_${ps.year}.pdf`)}>
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 3: Tax Declarations */}
        {activeTab === 'tax_declarations' && (
          <Card className="rounded-2xl border p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-heading font-bold text-base">Income Tax Declarations (FY 2026-27)</h3>
                <p className="text-xs text-muted-foreground">Select regime and submit investment proofs</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">New Tax Regime Active</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Tax Regime</span>
                <p className="text-sm font-semibold text-foreground">Section 115BAC (New Tax Regime)</p>
                <p className="text-xs text-muted-foreground">Concessional tax rates up to ₹7,00,000 rebate without standard deductions.</p>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form 16 Status</span>
                <p className="text-sm font-semibold text-foreground">Available by 15-Jun-2027</p>
                <p className="text-xs text-muted-foreground">Part A & Part B will be published post annual TDS reconciliation.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 4: Bonuses & Benefits */}
        {activeTab === 'bonuses' && (
          <Card className="rounded-2xl border p-6 space-y-4">
            <h3 className="font-heading font-bold text-base border-b pb-3">Variable Pay, Grants & Medical Insurance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs text-muted-foreground">Group Health Insurance</span>
                <p className="text-sm font-bold text-foreground">₹5,00,000 Family Floater</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Covered by Company</p>
              </div>
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs text-muted-foreground">Annual Performance Bonus</span>
                <p className="text-sm font-bold text-foreground">Up to 15% of Base</p>
                <p className="text-[10px] text-muted-foreground">Q4 Appraisal Linked</p>
              </div>
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-xs text-muted-foreground">Learning & Certifications Allowance</span>
                <p className="text-sm font-bold text-foreground">₹25,000 / Year</p>
                <p className="text-[10px] text-primary font-semibold">Available via Expenses</p>
              </div>
            </div>
          </Card>
        )}

        {/* Payslip Modal Preview */}
        <Dialog open={!!previewPayslip} onOpenChange={() => setPreviewPayslip(null)}>
          <DialogContent className="max-w-xl">
            {previewPayslip && (
              <>
                <DialogHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="font-heading text-lg font-bold">
                        Salary Slip: {previewPayslip.month} {previewPayslip.year}
                      </DialogTitle>
                      <DialogDescription className="text-xs">RoleSync HRMS • Confidential</DialogDescription>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 font-mono text-xs">
                      {previewPayslip.status}
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="py-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-xl border">
                    <div>
                      <span className="text-muted-foreground">Employee Name:</span>
                      <p className="font-semibold text-foreground">{user?.name || 'Anil Dhakar'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Employee ID:</span>
                      <p className="font-semibold font-mono text-primary">EMP1092</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border rounded-xl p-4">
                    <div className="space-y-2">
                      <p className="font-bold text-foreground border-b pb-1">Earnings</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">Basic</span><span>₹{basicSalary.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">HRA</span><span>₹{hra.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Special All.</span><span>₹{specialAllowance.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span>Total Gross</span><span>₹{previewPayslip.gross.toLocaleString('en-IN')}</span></div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-rose-500 border-b pb-1">Deductions</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">EPF</span><span>₹{epfEmployee.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Prof. Tax</span><span>₹{professionalTax.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">TDS</span><span>₹{incomeTaxTDS.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1 text-rose-500"><span>Total Deductions</span><span>₹{previewPayslip.deductions.toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Net Take-Home Salary:</span>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">₹{previewPayslip.net.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setPreviewPayslip(null)}>Close</Button>
                  <Button size="sm" onClick={() => toast.success(`Downloaded ${previewPayslip.id}.pdf`)}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
