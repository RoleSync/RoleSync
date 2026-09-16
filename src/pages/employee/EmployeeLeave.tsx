import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { daysBetween } from '@/lib/helpers';
import { leaveDeadlineMs, formatRemaining, deadlineSeverity } from '@/lib/sla';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Download, 
  HelpCircle, 
  Plus, 
  Search, 
  Table as TableIcon, 
  BarChart2, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  X,
  Palmtree,
  Stethoscope,
  Briefcase,
  Heart,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

type Leave = { 
  id: string; 
  leave_type: 'casual' | 'sick' | 'annual' | 'unpaid' | 'bereavement' | 'menstrual' | 'optional'; 
  start_date: string;
  end_date: string; 
  days: number; 
  reason: string; 
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'; 
  admin_notes: string | null; 
  created_at: string; 
};

type ActiveTab = 'status' | 'requests' | 'holidays';
type ViewMode = 'table' | 'graph';

export default function EmployeeLeave() {
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Data State
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Form State
  const [type, setType] = useState<Leave['leave_type']>('casual');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);

  // Filter State
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('custom');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Fetch Leaves
  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setLeaves((data as Leave[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Submit Leave Request
  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !user.companyId || !start || !end || !reason.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (end < start) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }
    setSubmitting(true);

    const calculatedDays = isHalfDay ? 0.5 : daysBetween(start, end);

    const { error } = await supabase.from('leave_requests').insert({
      user_id: user.id,
      company_id: user.companyId,
      leave_type: type,
      start_date: start,
      end_date: end,
      days: calculatedDays,
      reason: reason.trim(),
      status: 'pending',
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Leave request submitted successfully!');
    setStart('');
    setEnd('');
    setReason('');
    setType('casual');
    setIsHalfDay(false);
    setApplyDialogOpen(false);
    load();
  }

  // Cancel Leave Request
  async function cancelLeave(leaveId: string) {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', leaveId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Leave request cancelled.');
      load();
    }
  }

  // Calculate dynamic quota breakdown for the 6 cards in "Status" tab
  const leaveCategories = useMemo(() => {
    const casualQuota = settings?.casual_leave_quota ?? 10;
    const sickQuota = settings?.sick_leave_quota ?? 8;
    const earnedQuota = settings?.annual_leave_quota ?? 12;
    const bereavementQuota = 3;
    const menstrualQuota = 12;
    const unpaidQuota = 999;

    function getUsed(t: string) {
      return leaves
        .filter((l) => l.leave_type === t && l.status === 'approved')
        .reduce((sum, l) => sum + (l.days ?? 0), 0);
    }

    function getRequested(t: string) {
      return leaves
        .filter((l) => l.leave_type === t && l.status === 'pending')
        .reduce((sum, l) => sum + (l.days ?? 0), 0);
    }

    return [
      {
        id: 'bereavement',
        title: 'Bereavement Leave',
        icon: Heart,
        accrued: bereavementQuota,
        usedTillDate: getUsed('bereavement'),
        balance: Math.max(0, bereavementQuota - getUsed('bereavement')),
        used: getUsed('bereavement'),
        requested: getRequested('bereavement'),
        color: 'text-rose-500 bg-rose-500/10'
      },
      {
        id: 'casual',
        title: 'Casual Leave',
        icon: Palmtree,
        accrued: casualQuota,
        usedTillDate: getUsed('casual'),
        balance: Math.max(0, casualQuota - getUsed('casual')),
        used: getUsed('casual'),
        requested: getRequested('casual'),
        color: 'text-emerald-500 bg-emerald-500/10'
      },
      {
        id: 'annual',
        title: 'Earned Leave',
        icon: Briefcase,
        accrued: earnedQuota,
        usedTillDate: getUsed('annual'),
        balance: Math.max(0, earnedQuota - getUsed('annual')),
        used: getUsed('annual'),
        requested: getRequested('annual'),
        color: 'text-blue-500 bg-blue-500/10'
      },
      {
        id: 'unpaid',
        title: 'Leave Without Pay',
        icon: Clock,
        accrued: 0,
        usedTillDate: getUsed('unpaid'),
        balance: 0,
        used: getUsed('unpaid'),
        requested: getRequested('unpaid'),
        color: 'text-slate-500 bg-slate-500/10'
      },
      {
        id: 'menstrual',
        title: 'Menstrual Leave',
        icon: Droplet,
        accrued: menstrualQuota,
        usedTillDate: getUsed('menstrual'),
        balance: Math.max(0, menstrualQuota - getUsed('menstrual')),
        used: getUsed('menstrual'),
        requested: getRequested('menstrual'),
        color: 'text-purple-500 bg-purple-500/10'
      },
      {
        id: 'sick',
        title: 'Sick Leave',
        icon: Stethoscope,
        accrued: sickQuota,
        usedTillDate: getUsed('sick'),
        balance: Math.max(0, sickQuota - getUsed('sick')),
        used: getUsed('sick'),
        requested: getRequested('sick'),
        color: 'text-amber-500 bg-amber-500/10'
      }
    ];
  }, [settings, leaves]);

  // Filtered Requests List
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (filterType !== 'all' && l.leave_type !== filterType) return false;
      if (startDateFilter && l.start_date < startDateFilter) return false;
      if (endDateFilter && l.end_date > endDateFilter) return false;
      return true;
    });
  }, [leaves, filterType, startDateFilter, endDateFilter]);

  // Export to CSV Function
  function exportToCSV() {
    if (filteredLeaves.length === 0) {
      toast.error('No leave data to export.');
      return;
    }

    const headers = ['Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Applied On'];
    const rows = filteredLeaves.map(l => [
      l.leave_type.toUpperCase(),
      l.start_date,
      l.end_date,
      l.days,
      l.status.toUpperCase(),
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      new Date(l.created_at).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RoleSync_Leaves_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leave report exported to CSV!');
  }

  // Holiday List Data
  const holidays = [
    { name: 'Republic Day', date: '26 Jan 2026', day: 'Monday', type: 'National Holiday' },
    { name: 'Holi (Festival of Colours)', date: '04 Mar 2026', day: 'Wednesday', type: 'Gazetted Holiday' },
    { name: 'Good Friday', date: '03 Apr 2026', day: 'Friday', type: 'Public Holiday' },
    { name: 'Eid-ul-Fitr', date: '20 Mar 2026', day: 'Friday', type: 'Gazetted Holiday' },
    { name: 'Independence Day', date: '15 Aug 2026', day: 'Saturday', type: 'National Holiday' },
    { name: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', type: 'National Holiday' },
    { name: 'Dussehra (Vijayadashami)', date: '20 Oct 2026', day: 'Tuesday', type: 'Gazetted Holiday' },
    { name: 'Diwali (Deepavali)', date: '08 Nov 2026', day: 'Sunday', type: 'Festive Holiday' },
    { name: 'Guru Nanak Jayanti', date: '24 Nov 2026', day: 'Tuesday', type: 'Gazetted Holiday' },
    { name: 'Christmas Day', date: '25 Dec 2026', day: 'Friday', type: 'Public Holiday' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Leave
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your time off, track balances, and inspect official company holidays
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setHelpDialogOpen(true)}
              className="text-xs font-semibold text-[#0078FF] hover:underline flex items-center gap-1.5"
            >
              How to use this section? <Info className="h-3.5 w-3.5" />
            </button>

            {/* Apply Leave Modal Trigger */}
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 bg-[#0078FF] hover:bg-[#0066DB] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-xs gap-2">
                  <Plus className="h-4 w-4" /> Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Apply for Leave</DialogTitle>
                  <DialogDescription className="text-xs">
                    Submit your leave request for administrator approval.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={submitLeave} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Leave Type *</Label>
                    <Select value={type} onValueChange={(v) => setType(v as Leave['leave_type'])}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/30">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="annual">Earned / Annual Leave</SelectItem>
                        <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                        <SelectItem value="menstrual">Menstrual Leave</SelectItem>
                        <SelectItem value="unpaid">Leave Without Pay (LWP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Start Date *</Label>
                      <Input
                        type="date"
                        required
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        className="h-11 rounded-xl bg-muted/30 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">End Date *</Label>
                      <Input
                        type="date"
                        required
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        className="h-11 rounded-xl bg-muted/30 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="half-day"
                      checked={isHalfDay}
                      onChange={(e) => setIsHalfDay(e.target.checked)}
                      className="rounded border-slate-300 text-[#0078FF] focus:ring-[#0078FF]"
                    />
                    <label htmlFor="half-day" className="text-xs font-medium text-muted-foreground cursor-pointer">
                      Half Day (0.5 Day)
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Reason *</Label>
                    <Textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="State reason for your leave..."
                      className="rounded-xl bg-muted/30 text-xs resize-none min-h-[90px]"
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="ghost" onClick={() => setApplyDialogOpen(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-[#0078FF] hover:bg-[#0066DB] text-white text-xs font-bold rounded-xl">
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN NAVIGATION TABS: Status | Requests | Holiday List         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="border-b flex items-center gap-8">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'status'
                ? 'text-[#0078FF] border-b-2 border-[#0078FF]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'requests'
                ? 'text-[#0078FF] border-b-2 border-[#0078FF]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'holidays'
                ? 'text-[#0078FF] border-b-2 border-[#0078FF]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Holiday List
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: STATUS (Matches Image 2)                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="w-full max-w-xs">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-xs">
                    <SelectValue placeholder="Select Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leave Types</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="annual">Earned Leave</SelectItem>
                    <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                    <SelectItem value="menstrual">Menstrual Leave</SelectItem>
                    <SelectItem value="unpaid">Leave Without Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setFaqDialogOpen(true)}
                  className="text-xs font-semibold text-[#0078FF] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3.5 w-3.5" /> FAQ's
                </button>

                <div className="flex items-center bg-muted/40 p-1 rounded-xl border">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    <TableIcon className="h-3.5 w-3.5" /> Table
                  </button>
                  <button
                    onClick={() => setViewMode('graph')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'graph' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5" /> Graph
                  </button>
                </div>
              </div>
            </div>

            {/* 6 Category Cards Grid (Exact Match to Image 2) */}
            {viewMode === 'table' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {leaveCategories
                  .filter(c => filterType === 'all' || c.id === filterType)
                  .map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Card key={cat.id} className="p-6 rounded-3xl shadow-sm border bg-card space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-foreground">{cat.title}</h3>
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${cat.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground text-[11px]">Accrued</p>
                            <p className="font-mono font-bold text-foreground text-sm mt-0.5">
                              {cat.id === 'unpaid' ? '—' : cat.accrued.toString().padStart(2, '0')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[11px]">Used Till date</p>
                            <p className="font-mono font-bold text-foreground text-sm mt-0.5">
                              {cat.usedTillDate.toString().padStart(2, '0')}
                            </p>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-muted-foreground text-[11px]">Balance</p>
                            <p className="font-mono font-bold text-[#0078FF] text-base mt-0.5">
                              {cat.id === 'unpaid' ? '—' : cat.balance.toString().padStart(2, '0')}
                            </p>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-muted-foreground text-[11px]">Requested</p>
                            <p className="font-mono font-bold text-amber-600 text-base mt-0.5">
                              {cat.requested.toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              /* Graph View Mode */
              <Card className="p-6 rounded-3xl shadow-sm border bg-card">
                <h3 className="font-bold text-sm mb-4">Leave Quotas vs. Utilized Analysis</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveCategories.filter(c => c.id !== 'unpaid')}>
                      <XAxis dataKey="title" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="accrued" fill="#0078FF" name="Accrued Quota" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="used" fill="#EF4444" name="Used Days" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="balance" fill="#10B981" name="Remaining Balance" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: REQUESTS (Matches Image 1)                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Filter & Export Bar */}
            <div className="p-4 rounded-2xl bg-card border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Leave Type Select */}
                <div className="w-48">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-xs">
                      <SelectValue placeholder="Select Leave Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="annual">Earned Leave</SelectItem>
                      <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                      <SelectItem value="menstrual">Menstrual Leave</SelectItem>
                      <SelectItem value="unpaid">Leave Without Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Select */}
                <div className="w-36">
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-xs">
                      <SelectValue placeholder="Custom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Picker */}
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border text-xs">
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="bg-transparent text-xs focus:outline-none"
                    placeholder="Start date"
                  />
                  <span className="text-muted-foreground">→</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="bg-transparent text-xs focus:outline-none"
                    placeholder="End date"
                  />
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </div>
              </div>

              {/* Export to CSV Button */}
              <Button
                onClick={exportToCSV}
                className="h-10 bg-[#0078FF] hover:bg-[#0066DB] text-white text-xs font-bold rounded-xl shadow-sm gap-2"
              >
                <Download className="h-4 w-4" /> Export to CSV
              </Button>
            </div>

            {/* Status Legend Matching Image 1 */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Rejected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Cancelled
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> Cancelled Request Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Leave Cancelled Post Approval
              </span>
            </div>

            {/* Requests Table / Empty State */}
            {filteredLeaves.length === 0 ? (
              <Card className="p-16 rounded-3xl shadow-sm border bg-card flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-16 w-16 rounded-3xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">No Data Found</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    There are no leave requests matching your selected filters. Click 'Apply Leave' above to raise a request.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl shadow-sm border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="px-5 py-3.5">Leave Type</th>
                        <th className="px-5 py-3.5">Duration</th>
                        <th className="px-5 py-3.5">Days</th>
                        <th className="px-5 py-3.5">Reason</th>
                        <th className="px-5 py-3.5">Applied Date</th>
                        <th className="px-5 py-3.5">SLA Countdown</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredLeaves.map((l) => {
                        const slaHours = settings?.leave_approval_sla_hours ?? 48;
                        const deadline = leaveDeadlineMs(l.created_at, slaHours);
                        const isPending = l.status === 'pending';

                        return (
                          <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4 font-semibold text-foreground capitalize">
                              {l.leave_type} Leave
                            </td>
                            <td className="px-5 py-4 font-mono text-muted-foreground">
                              {l.start_date} → {l.end_date}
                            </td>
                            <td className="px-5 py-4 font-bold text-foreground">
                              {l.days} {l.days === 1 ? 'day' : 'days'}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                              {l.reason}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                              {new Date(l.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4">
                              {isPending ? (
                                <span className={`font-mono text-[11px] font-bold ${deadlineSeverity(deadline)}`}>
                                  ⏱ {formatRemaining(deadline)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge
                                status={
                                  l.status === 'approved' ? 'Approved' :
                                  l.status === 'rejected' ? 'Rejected' :
                                  l.status === 'cancelled' ? 'Cancelled' : 'Pending'
                                }
                              />
                            </td>
                            <td className="px-5 py-4 text-right">
                              {l.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => cancelLeave(l.id)}
                                  className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                >
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: HOLIDAY LIST (2026 Calendar)                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'holidays' && (
          <div className="space-y-4">
            <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border bg-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    Corporate & Gazetted Holidays (2026)
                  </h2>
                  <p className="text-xs text-muted-foreground">Official holidays observed across company offices</p>
                </div>
                <Badge variant="secondary" className="bg-[#0078FF]/10 text-[#0078FF] border-none font-bold">
                  {holidays.length} Total Holidays
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {holidays.map((h, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-muted/20 border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {h.date.split(' ')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-primary font-mono">{h.date}</p>
                      <p className="text-[10px] text-muted-foreground">{h.day}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* How to use Dialog */}
        <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Leave Policy Guide
              </DialogTitle>
              <DialogDescription className="text-xs">
                Key rules and guidelines for applying and managing time off.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs text-muted-foreground py-2 leading-relaxed">
              <p>• <strong className="text-foreground">Accrual Cycle:</strong> Quotas are renewed at the beginning of each calendar year.</p>
              <p>• <strong className="text-foreground">SLA Window:</strong> All submitted leaves have an administrative response SLA of {settings?.leave_approval_sla_hours ?? 48} hours.</p>
              <p>• <strong className="text-foreground">Cancellation:</strong> Pending requests can be cancelled directly from the Requests tab.</p>
              <p>• <strong className="text-foreground">Half-Day:</strong> Half-day leaves count as 0.5 against your quota.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setHelpDialogOpen(false)} className="text-xs font-bold rounded-xl bg-primary">
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FAQ Dialog */}
        <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-xs text-muted-foreground py-2 leading-relaxed">
              <div>
                <p className="font-bold text-foreground">Q: Can I take Casual Leave along with Sick Leave?</p>
                <p>A: Yes, provided medical certificate documentation is attached for extended sick periods.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">Q: How do I carry forward unused Earned Leaves?</p>
                <p>A: Up to 15 unused Earned Leaves are carried forward to the next year automatically.</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setFaqDialogOpen(false)} className="text-xs font-bold rounded-xl bg-primary">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
