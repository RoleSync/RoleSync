import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  Table as TableIcon, 
  BarChart2, 
  Info, 
  AlertTriangle,
  FolderX,
  Check,
  Palmtree,
  Stethoscope,
  Briefcase,
  Heart,
  Droplet
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
  status: 'approved' | 'rejected' | 'pending' | 'cancelled' | 'cancelled_pending' | 'cancelled_post_approval' | 'cancel_rejected'; 
  admin_notes: string | null; 
  created_at: string; 
};

type ActiveTab = 'status' | 'requests' | 'holidays';
type ViewMode = 'table' | 'graph';

interface HolidayItem {
  id: string;
  name: string;
  date: string;
  rawDate: string;
  day: string;
  type: 'mandatory' | 'restricted';
}

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

  // Status Tab Filters
  const [statusLeaveTypeFilter, setStatusLeaveTypeFilter] = useState('all');

  // Requests Tab Filter State
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [requestPeriodFilter, setRequestPeriodFilter] = useState('custom');
  const [requestStartDateFilter, setRequestStartDateFilter] = useState('');
  const [requestEndDateFilter, setRequestEndDateFilter] = useState('');

  // Holiday Tab Filters
  const [holidayTypeFilter, setHolidayTypeFilter] = useState<'upcoming' | 'all' | 'mandatory' | 'restricted' | 'past'>('upcoming');
  const [selectedRestrictedHolidays, setSelectedRestrictedHolidays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rolesync_selected_restricted_holidays');
      return saved ? JSON.parse(saved) : ['hol-4'];
    } catch {
      return ['hol-4'];
    }
  });

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

    const calculatedDays = isHalfDay ? 0.5 : Math.max(1, daysBetween(start, end));

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

  // Toggle Restricted Holiday Selection
  function toggleRestrictedHoliday(id: string, name: string) {
    let updated: string[];
    if (selectedRestrictedHolidays.includes(id)) {
      updated = selectedRestrictedHolidays.filter(i => i !== id);
      toast.info(`Deselected optional holiday: ${name}`);
    } else {
      if (selectedRestrictedHolidays.length >= 2) {
        toast.error('You can only choose a maximum of 2 Restricted/Optional holidays per year.');
        return;
      }
      updated = [...selectedRestrictedHolidays, id];
      toast.success(`Selected optional holiday: ${name}`);
    }
    setSelectedRestrictedHolidays(updated);
    try {
      localStorage.setItem('rolesync_selected_restricted_holidays', JSON.stringify(updated));
    } catch {}
  }

  // Calculate dynamic quota breakdown for the "Status" tab table
  const leaveCategories = useMemo(() => {
    const casualQuota = settings?.casual_leave_quota ?? 10;
    const sickQuota = settings?.sick_leave_quota ?? 8;
    const earnedQuota = settings?.annual_leave_quota ?? 12;
    const bereavementQuota = 3;
    const menstrualQuota = 12;

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
        name: 'Bereavement Leave',
        icon: Heart,
        accrued: bereavementQuota > 0 ? bereavementQuota : '-',
        usedTillDate: getUsed('bereavement') > 0 ? getUsed('bereavement') : '-',
        usedCurrentYear: getUsed('bereavement') > 0 ? getUsed('bereavement') : '-',
        requested: getRequested('bereavement') > 0 ? getRequested('bereavement') : '-',
        balance: (bereavementQuota - getUsed('bereavement')) > 0 ? (bereavementQuota - getUsed('bereavement')) : '-',
        numericAccrued: bereavementQuota,
        numericUsed: getUsed('bereavement'),
        numericBalance: Math.max(0, bereavementQuota - getUsed('bereavement'))
      },
      {
        id: 'casual',
        name: 'Casual Leave',
        icon: Palmtree,
        accrued: casualQuota > 0 ? casualQuota : '-',
        usedTillDate: getUsed('casual') > 0 ? getUsed('casual') : '-',
        usedCurrentYear: getUsed('casual') > 0 ? getUsed('casual') : '-',
        requested: getRequested('casual') > 0 ? getRequested('casual') : '-',
        balance: (casualQuota - getUsed('casual')) > 0 ? (casualQuota - getUsed('casual')) : '-',
        numericAccrued: casualQuota,
        numericUsed: getUsed('casual'),
        numericBalance: Math.max(0, casualQuota - getUsed('casual'))
      },
      {
        id: 'annual',
        name: 'Earned Leave',
        icon: Briefcase,
        accrued: earnedQuota > 0 ? earnedQuota : '-',
        usedTillDate: getUsed('annual') > 0 ? getUsed('annual') : '-',
        usedCurrentYear: getUsed('annual') > 0 ? getUsed('annual') : '-',
        requested: getRequested('annual') > 0 ? getRequested('annual') : '-',
        balance: (earnedQuota - getUsed('annual')) > 0 ? (earnedQuota - getUsed('annual')) : '-',
        numericAccrued: earnedQuota,
        numericUsed: getUsed('annual'),
        numericBalance: Math.max(0, earnedQuota - getUsed('annual'))
      },
      {
        id: 'unpaid',
        name: 'Leave Without Pay',
        icon: Clock,
        accrued: '-',
        usedTillDate: getUsed('unpaid') > 0 ? getUsed('unpaid') : '-',
        usedCurrentYear: getUsed('unpaid') > 0 ? getUsed('unpaid') : '-',
        requested: getRequested('unpaid') > 0 ? getRequested('unpaid') : '-',
        balance: '-',
        numericAccrued: 0,
        numericUsed: getUsed('unpaid'),
        numericBalance: 0
      },
      {
        id: 'menstrual',
        name: 'Menstrual Leave',
        icon: Droplet,
        accrued: menstrualQuota > 0 ? menstrualQuota : '-',
        usedTillDate: getUsed('menstrual') > 0 ? getUsed('menstrual') : '-',
        usedCurrentYear: getUsed('menstrual') > 0 ? getUsed('menstrual') : '-',
        requested: getRequested('menstrual') > 0 ? getRequested('menstrual') : '-',
        balance: (menstrualQuota - getUsed('menstrual')) > 0 ? (menstrualQuota - getUsed('menstrual')) : '-',
        numericAccrued: menstrualQuota,
        numericUsed: getUsed('menstrual'),
        numericBalance: Math.max(0, menstrualQuota - getUsed('menstrual'))
      },
      {
        id: 'sick',
        name: 'Sick Leave',
        icon: Stethoscope,
        accrued: sickQuota > 0 ? sickQuota : '-',
        usedTillDate: getUsed('sick') > 0 ? getUsed('sick') : '-',
        usedCurrentYear: getUsed('sick') > 0 ? getUsed('sick') : '-',
        requested: getRequested('sick') > 0 ? getRequested('sick') : '-',
        balance: (sickQuota - getUsed('sick')) > 0 ? (sickQuota - getUsed('sick')) : '-',
        numericAccrued: sickQuota,
        numericUsed: getUsed('sick'),
        numericBalance: Math.max(0, sickQuota - getUsed('sick'))
      }
    ];
  }, [settings, leaves]);

  // Filtered Leave Categories in Status tab
  const displayedStatusCategories = useMemo(() => {
    if (statusLeaveTypeFilter === 'all') return leaveCategories;
    return leaveCategories.filter(c => c.id === statusLeaveTypeFilter);
  }, [leaveCategories, statusLeaveTypeFilter]);

  // Filtered Requests List (Matches screenshot 2)
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (requestTypeFilter !== 'all' && l.leave_type !== requestTypeFilter) return false;
      if (requestStartDateFilter && l.start_date < requestStartDateFilter) return false;
      if (requestEndDateFilter && l.end_date > requestEndDateFilter) return false;
      return true;
    });
  }, [leaves, requestTypeFilter, requestStartDateFilter, requestEndDateFilter]);

  // Export to CSV Function
  function exportToCSV() {
    if (filteredLeaves.length === 0) {
      toast.error('No leave requests found to export.');
      return;
    }

    const headers = ['Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Applied Date'];
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
    link.setAttribute('download', `RoleSync_Leave_Requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leave requests exported to CSV!');
  }

  // Official Holidays Data
  const allHolidays: HolidayItem[] = [
    { id: 'hol-1', name: "New Year's Day", date: '01 Jan 2026', rawDate: '2026-01-01', day: 'Thursday', type: 'restricted' },
    { id: 'hol-2', name: 'Makar Sankranti / Pongal', date: '14 Jan 2026', rawDate: '2026-01-14', day: 'Wednesday', type: 'restricted' },
    { id: 'hol-3', name: 'Republic Day', date: '26 Jan 2026', rawDate: '2026-01-26', day: 'Monday', type: 'mandatory' },
    { id: 'hol-4', name: 'Maha Shivratri', date: '15 Feb 2026', rawDate: '2026-02-15', day: 'Sunday', type: 'restricted' },
    { id: 'hol-5', name: 'Holi (Festival of Colours)', date: '04 Mar 2026', rawDate: '2026-03-04', day: 'Wednesday', type: 'mandatory' },
    { id: 'hol-6', name: 'Eid-ul-Fitr', date: '20 Mar 2026', rawDate: '2026-03-20', day: 'Friday', type: 'mandatory' },
    { id: 'hol-7', name: 'Good Friday', date: '03 Apr 2026', rawDate: '2026-04-03', day: 'Friday', type: 'mandatory' },
    { id: 'hol-8', name: 'Mahavir Jayanti', date: '11 Apr 2026', rawDate: '2026-04-11', day: 'Saturday', type: 'restricted' },
    { id: 'hol-9', name: 'Buddha Purnima', date: '12 May 2026', rawDate: '2026-05-12', day: 'Tuesday', type: 'restricted' },
    { id: 'hol-10', name: 'Bakrid / Eid al-Adha', date: '27 May 2026', rawDate: '2026-05-27', day: 'Wednesday', type: 'mandatory' },
    { id: 'hol-11', name: 'Muharram', date: '26 Jun 2026', rawDate: '2026-06-26', day: 'Friday', type: 'restricted' },
    { id: 'hol-12', name: 'Independence Day', date: '15 Aug 2026', rawDate: '2026-08-15', day: 'Saturday', type: 'mandatory' },
    { id: 'hol-13', name: 'Janmashtami', date: '04 Sep 2026', rawDate: '2026-09-04', day: 'Friday', type: 'restricted' },
    { id: 'hol-14', name: 'Milad-un-Nabi', date: '16 Sep 2026', rawDate: '2026-09-16', day: 'Wednesday', type: 'restricted' },
    { id: 'hol-15', name: 'Mahatma Gandhi Jayanti', date: '02 Oct 2026', rawDate: '2026-10-02', day: 'Friday', type: 'mandatory' },
    { id: 'hol-16', name: 'Dussehra (Vijayadashami)', date: '20 Oct 2026', rawDate: '2026-10-20', day: 'Tuesday', type: 'mandatory' },
    { id: 'hol-17', name: 'Diwali (Deepavali)', date: '08 Nov 2026', rawDate: '2026-11-08', day: 'Sunday', type: 'mandatory' },
    { id: 'hol-18', name: 'Guru Nanak Jayanti', date: '24 Nov 2026', rawDate: '2026-11-24', day: 'Tuesday', type: 'mandatory' },
    { id: 'hol-19', name: 'Christmas Day', date: '25 Dec 2026', rawDate: '2026-12-25', day: 'Friday', type: 'mandatory' },
  ];

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    const todayStr = '2026-09-16';
    if (holidayTypeFilter === 'all') return allHolidays;
    if (holidayTypeFilter === 'upcoming') {
      return allHolidays.filter(h => h.rawDate >= todayStr);
    }
    if (holidayTypeFilter === 'past') {
      return allHolidays.filter(h => h.rawDate < todayStr);
    }
    if (holidayTypeFilter === 'mandatory') {
      return allHolidays.filter(h => h.type === 'mandatory');
    }
    if (holidayTypeFilter === 'restricted') {
      return allHolidays.filter(h => h.type === 'restricted');
    }
    return allHolidays;
  }, [holidayTypeFilter]);

  // Status mapping helper for screenshot 2 status badges
  function renderRequestStatus(status: Leave['status']) {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-300">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> Cancelled
          </span>
        );
      case 'cancelled_pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-200">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> Cancelled Request Pending
          </span>
        );
      case 'cancelled_post_approval':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Leave Cancelled Post Approval
          </span>
        );
      case 'cancel_rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-600" /> Cancellation Request Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: Breadcrumbs & How to use section link             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground">
            My Leave
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            View leave balances, submit time off requests, and track company holiday lists
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setHelpDialogOpen(true)}
            className="text-xs font-medium text-[#0078FF] hover:underline flex items-center gap-1"
          >
            How to use this section? <Info className="h-3.5 w-3.5" />
          </button>

          {/* Apply Leave Modal Trigger */}
          <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 bg-[#0078FF] hover:bg-[#0066DB] text-white font-semibold rounded-lg text-xs gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Apply for Leave</DialogTitle>
                <DialogDescription className="text-xs">
                  Submit your leave application for reporting manager & HR review.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={submitLeave} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Leave Type *</Label>
                  <Select value={type} onValueChange={(v) => setType(v as Leave['leave_type'])}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/30">
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
                      className="h-10 rounded-xl bg-muted/30 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">End Date *</Label>
                    <Input
                      type="date"
                      required
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="h-10 rounded-xl bg-muted/30 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="half-day"
                    checked={isHalfDay}
                    onChange={(e) => setIsHalfDay(e.target.checked)}
                    className="rounded border-slate-300 text-[#0078FF] focus:ring-[#0078FF] h-4 w-4"
                  />
                  <label htmlFor="half-day" className="text-xs font-medium text-muted-foreground cursor-pointer">
                    Apply as Half Day (0.5 Day)
                  </label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reason *</Label>
                  <Textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe why you are taking this leave..."
                    className="rounded-xl bg-muted/30 text-xs resize-none min-h-[85px]"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setApplyDialogOpen(false)} className="text-xs rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-[#0078FF] hover:bg-[#0066DB] text-white text-xs font-bold rounded-xl">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3 TABS BAR: Status | Requests | Holiday List                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="border-b flex items-center gap-8">
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'status'
              ? 'text-[#0078FF] border-b-2 border-[#0078FF]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Status
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'requests'
              ? 'text-[#0078FF] border-b-2 border-[#0078FF]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Requests
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'holidays'
              ? 'text-[#0078FF] border-b-2 border-[#0078FF]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Holiday List
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: STATUS (Matches Screenshot 1)                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          {/* Top Row Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-64">
              <Select value={statusLeaveTypeFilter} onValueChange={setStatusLeaveTypeFilter}>
                <SelectTrigger className="h-9 rounded-lg bg-card border text-xs text-muted-foreground">
                  <SelectValue placeholder="Select Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select Leave Type (All)</SelectItem>
                  <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="annual">Earned Leave</SelectItem>
                  <SelectItem value="unpaid">Leave Without Pay</SelectItem>
                  <SelectItem value="menstrual">Menstrual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setFaqDialogOpen(true)}
                className="text-xs font-medium text-[#0078FF] hover:underline flex items-center gap-1.5"
              >
                <HelpCircle className="h-3.5 w-3.5" /> FAQ's
              </button>

              <div className="flex items-center border rounded-lg overflow-hidden bg-card text-xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-[#0078FF] text-white font-medium' 
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Check className={`h-3.5 w-3.5 ${viewMode === 'table' ? 'opacity-100' : 'opacity-0 hidden'}`} />
                  <TableIcon className="h-3.5 w-3.5" /> Table
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                    viewMode === 'graph' 
                      ? 'bg-[#0078FF] text-white font-medium' 
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Check className={`h-3.5 w-3.5 ${viewMode === 'graph' ? 'opacity-100' : 'opacity-0 hidden'}`} />
                  <BarChart2 className="h-3.5 w-3.5" /> Graph
                </button>
              </div>
            </div>
          </div>

          {/* Table View (Exact Replica of Screenshot 1) */}
          {viewMode === 'table' ? (
            <Card className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">Leave Type</th>
                      <th className="py-3.5 px-6 font-semibold">Accrued</th>
                      <th className="py-3.5 px-6 font-semibold">Used <span className="text-[11px] font-normal text-muted-foreground">(Till Date)</span></th>
                      <th className="py-3.5 px-6 font-semibold">Used* <span className="text-[11px] font-normal text-muted-foreground">(Current Leave Calendar Year)</span></th>
                      <th className="py-3.5 px-6 font-semibold">Requested</th>
                      <th className="py-3.5 px-6 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {displayedStatusCategories.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-4 px-6 font-medium text-foreground">
                          {item.name}
                        </td>
                        <td className="py-4 px-6 font-mono text-muted-foreground">
                          {item.accrued}
                        </td>
                        <td className="py-4 px-6 font-mono text-muted-foreground">
                          {item.usedTillDate}
                        </td>
                        <td className="py-4 px-6 font-mono text-muted-foreground">
                          {item.usedCurrentYear}
                        </td>
                        <td className="py-4 px-6 font-mono text-muted-foreground">
                          {item.requested}
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-foreground">
                          {item.balance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Graph View Mode */
            <Card className="p-6 rounded-2xl shadow-sm border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Leave Quota & Consumption Graph</h3>
                  <p className="text-xs text-muted-foreground">Comparative visualization of accrued, utilized, and remaining balance</p>
                </div>
              </div>
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayedStatusCategories.filter(c => c.id !== 'unpaid')}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="numericAccrued" fill="#0078FF" name="Accrued Quota" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="numericUsed" fill="#EF4444" name="Used Days" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="numericBalance" fill="#10B981" name="Remaining Balance" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: REQUESTS (Matches Screenshot 2)                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter Bar matching Screenshot 2 */}
          <div className="p-4 rounded-xl bg-card border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Leave Type Select */}
              <div className="w-52 space-y-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Select Leave Type</Label>
                <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
                  <SelectTrigger className="h-9 rounded-lg bg-card text-xs">
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

              {/* Period Select */}
              <div className="w-32 space-y-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Select</Label>
                <Select value={requestPeriodFilter} onValueChange={setRequestPeriodFilter}>
                  <SelectTrigger className="h-9 rounded-lg bg-card text-xs">
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

              {/* Select Date Range */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Select Date</Label>
                <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border text-xs h-9">
                  <input
                    type="date"
                    value={requestStartDateFilter}
                    onChange={(e) => setRequestStartDateFilter(e.target.value)}
                    className="bg-transparent text-xs focus:outline-none w-28"
                    placeholder="Start date"
                  />
                  <span className="text-muted-foreground text-xs">→</span>
                  <input
                    type="date"
                    value={requestEndDateFilter}
                    onChange={(e) => setRequestEndDateFilter(e.target.value)}
                    className="bg-transparent text-xs focus:outline-none w-28"
                    placeholder="End date"
                  />
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </div>
              </div>
            </div>

            {/* Export to CSV button */}
            <div className="flex items-end">
              <Button
                onClick={exportToCSV}
                className="h-9 bg-[#0078FF] hover:bg-[#0066DB] text-white text-xs font-medium rounded-lg shadow-sm gap-2"
              >
                <Download className="h-4 w-4" /> Export to CSV
              </Button>
            </div>
          </div>

          {/* Status Legends List (Exact Match to Screenshot 2) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted-foreground px-1">
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
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-700" /> Cancellation Request Rejected
            </span>
          </div>

          {/* Requests Content Area (Empty State or Table) */}
          {filteredLeaves.length === 0 ? (
            <Card className="py-20 px-6 rounded-xl shadow-sm border bg-card flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-blue-500/10 flex items-center justify-center text-[#0078FF]">
                  <FolderX className="h-10 w-10" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">No Data Found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  You do not have any leave requests matching the chosen criteria.
                </p>
              </div>
              <Button
                onClick={() => setApplyDialogOpen(true)}
                variant="outline"
                size="sm"
                className="rounded-lg text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5" /> Apply New Leave
              </Button>
            </Card>
          ) : (
            <Card className="rounded-xl shadow-sm border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-muted-foreground font-semibold border-b">
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
                        <tr key={l.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-5 py-4 font-medium text-foreground capitalize">
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
                              <span className={`font-mono text-[11px] font-semibold ${deadlineSeverity(deadline)}`}>
                                ⏱ {formatRemaining(deadline)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {renderRequestStatus(l.status)}
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
      {/* TAB 3: HOLIDAY LIST (Matches Screenshot 3)                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          {/* Top Filter Bar matching Screenshot 3 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-52 space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Select Holiday Type</Label>
              <Select value={holidayTypeFilter} onValueChange={(v) => setHolidayTypeFilter(v as any)}>
                <SelectTrigger className="h-9 rounded-lg bg-card text-xs">
                  <SelectValue placeholder="Upcoming" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="all">All Holidays</SelectItem>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="restricted">Restricted / Optional</SelectItem>
                  <SelectItem value="past">Past Holidays</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Centered Informative Note */}
            <div className="text-xs text-muted-foreground font-medium text-center">
              You Can Choose of restricted/Optional holiday(s) only.
            </div>

            {/* Right-aligned Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Mandatory
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0078FF]" /> Restricted/Optional
              </span>
            </div>
          </div>

          {/* Holiday Content List or Empty State */}
          {filteredHolidays.length === 0 ? (
            <Card className="py-20 px-6 rounded-xl shadow-sm border bg-card flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">No Data Found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  There are no holidays matching the selected filter.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              <Card className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/30 text-muted-foreground font-medium border-b">
                      <tr>
                        <th className="py-3.5 px-6 font-semibold">Holiday Name</th>
                        <th className="py-3.5 px-6 font-semibold">Date</th>
                        <th className="py-3.5 px-6 font-semibold">Day</th>
                        <th className="py-3.5 px-6 font-semibold">Type</th>
                        <th className="py-3.5 px-6 font-semibold text-right">Action / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-foreground">
                      {filteredHolidays.map((holiday) => {
                        const isSelected = selectedRestrictedHolidays.includes(holiday.id);
                        const isMandatory = holiday.type === 'mandatory';

                        return (
                          <tr key={holiday.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-4 px-6 font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isMandatory ? 'bg-[#F59E0B]' : 'bg-[#0078FF]'}`} />
                                <span>{holiday.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono text-muted-foreground">
                              {holiday.date}
                            </td>
                            <td className="py-4 px-6 text-muted-foreground">
                              {holiday.day}
                            </td>
                            <td className="py-4 px-6">
                              {isMandatory ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  Mandatory Holiday
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                  Restricted / Optional
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {isMandatory ? (
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  Company Wide Off
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => toggleRestrictedHoliday(holiday.id, holiday.name)}
                                  className={`h-7 text-xs rounded-lg px-2.5 ${
                                    isSelected 
                                      ? 'bg-[#0078FF] hover:bg-[#0066DB] text-white font-medium' 
                                      : 'border-[#0078FF]/30 text-[#0078FF] hover:bg-blue-50'
                                  }`}
                                >
                                  {isSelected ? '✓ Selected' : 'Opt In'}
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
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* GUIDE & FAQ DIALOGS                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      
      {/* How to use Guide Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Info className="h-5 w-5 text-primary" /> Leave & Time-Off Policy Guide
            </DialogTitle>
            <DialogDescription className="text-xs">
              Key guidelines for tracking balances and requesting time off.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground py-2 leading-relaxed">
            <p>• <strong className="text-foreground">Leave Quota Accrual:</strong> Leave allocations (Casual, Sick, Earned) are accrued annually according to company policy.</p>
            <p>• <strong className="text-foreground">SLA Window:</strong> All leave submissions are reviewed within {settings?.leave_approval_sla_hours ?? 48} hours.</p>
            <p>• <strong className="text-foreground">Restricted Holidays:</strong> Employees are entitled to choose up to 2 optional/restricted holidays per calendar year.</p>
            <p>• <strong className="text-foreground">Cancellations:</strong> Pending requests can be cancelled directly at any time from the Requests tab.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setHelpDialogOpen(false)} className="text-xs font-semibold rounded-xl bg-primary">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQs Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <HelpCircle className="h-5 w-5 text-primary" /> Leave FAQ's
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground py-2 leading-relaxed">
            <div>
              <p className="font-semibold text-foreground">Q: What is the difference between Accrued and Balance?</p>
              <p>A: Accrued is the total days credited to your account this year. Balance is the remaining available days after subtracting approved leaves.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Q: Can I apply for a Half Day leave?</p>
              <p>A: Yes! Simply check the "Half Day" checkbox on the Apply Leave form.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Q: How many optional holidays can I select?</p>
              <p>A: You can choose up to 2 restricted/optional holidays from the Holiday List tab.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setFaqDialogOpen(false)} className="text-xs font-semibold rounded-xl bg-primary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
