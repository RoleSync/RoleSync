import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckSquare, 
  CalendarDays, 
  TrendingUp, 
  Flame, 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Sun,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  Palmtree,
  Stethoscope,
  Briefcase,
  Cake,
  Award,
  Search,
  AlertCircle,
  FileEdit,
  Home,
  User,
  PartyPopper,
  Info,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatTime } from '@/lib/helpers';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { EmployeeIdCard } from '@/components/EmployeeIdCard';
import { BirthdaysCard } from '@/components/BirthdaysCard';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { toast } from 'sonner';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { features } = useCompanyFeatures();
  const { settings } = useCompanySettings();

  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance & Stats State
  const [todayAtt, setTodayAtt] = useState<any>(null);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [streak, setStreak] = useState({ count: 0, isActive: false });
  const [loading, setLoading] = useState(true);

  // Requests Data
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<any[]>([]);

  // Celebrations Tab
  const [celebrationTab, setCelebrationTab] = useState<'birthdays' | 'anniversaries'>('birthdays');

  // Calendar View Month State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any>(null);

  // Leave Balance View Month State
  const [leaveBalanceMonth, setLeaveBalanceMonth] = useState(new Date());
  const [leaveCarouselIdx, setLeaveCarouselIdx] = useState(0);

  // Break Management State
  const [onBreak, setOnBreak] = useState(() => {
    return localStorage.getItem(`break_active_${user?.id}`) === 'true';
  });
  const [breakSeconds, setBreakSeconds] = useState(() => {
    const saved = localStorage.getItem(`break_seconds_${user?.id}_${new Date().toISOString().split('T')[0]}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Weekly Navigation State
  const [weekOffset, setWeekOffset] = useState(0);

  // Performance Search
  const [performanceSearch, setPerformanceSearch] = useState('');

  // Live Clock Interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Break Duration Timer
  useEffect(() => {
    let interval: any = null;
    if (onBreak) {
      interval = setInterval(() => {
        setBreakSeconds((prev) => {
          const updated = prev + 1;
          if (user?.id) {
            localStorage.setItem(`break_seconds_${user.id}_${new Date().toISOString().split('T')[0]}`, updated.toString());
          }
          return updated;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [onBreak, user?.id]);

  function toggleBreak() {
    if (!todayAtt?.check_in) {
      toast.error('Please clock in before starting a break.');
      return;
    }
    const nextState = !onBreak;
    setOnBreak(nextState);
    if (user?.id) {
      localStorage.setItem(`break_active_${user.id}`, nextState ? 'true' : 'false');
    }
    if (nextState) {
      toast.info('Break started. Enjoy your break!');
    } else {
      toast.success('Break ended. Welcome back!');
    }
  }

  function formatSeconds(sec: number) {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Data Fetching
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    Promise.all([
      supabase.from('attendance').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('tasks').select('id, status').eq('assigned_to', user.id),
      supabase.from('leave_requests').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('*').eq('assigned_to', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('attendance').select('*').eq('user_id', user.id).gte('date', ninetyDaysAgoStr).order('date', { ascending: false }),
      supabase.from('attendance_corrections' as any).select('*').eq('user_id', user.id),
      supabase.from('profiles').select('id, full_name, email, job_title, department, avatar_url, date_of_birth, created_at, company_id').eq('company_id', user.companyId ?? ''),
    ]).then(([att, tasks, leaves, recent, history, corrs, profs]) => {
      setTodayAtt(att.data);
      const t = tasks.data ?? [];
      setTaskCounts({
        total: t.length,
        completed: t.filter((x) => x.status === 'completed').length,
        inProgress: t.filter((x) => x.status === 'in_progress').length,
      });
      setRecentTasks(recent.data ?? []);
      setAllAttendance(history.data ?? []);
      setLeaveRequests(leaves.data ?? []);
      setCorrections((corrs.data as any) ?? []);
      setCompanyProfiles(profs.data ?? []);

      // Calculate Streak
      let currentStreak = 0;
      let isActive = !!att.data;
      const dates = (history.data ?? []).map((h: any) => h.date);
      
      const checkDate = new Date();
      if (!isActive) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      for (let i = 0; i < 30; i++) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (dates.includes(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          const day = checkDate.getDay();
          if (day === 0 || day === 6) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
      setStreak({ count: currentStreak, isActive: isActive || currentStreak > 0 });
      setLoading(false);
    });
  }, [user]);

  // Weekly Chart Data
  const weeklyChartData = useMemo(() => {
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    const monday = new Date(curr.setDate(diff));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const attMap = new Map<string, any>();
    allAttendance.forEach((a) => attMap.set(a.date, a));

    let totalHours = 0;
    let workedDaysCount = 0;

    const chartDays = days.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const att = attMap.get(dateStr);

      let workHours = 0;
      if (att?.check_in) {
        if (att.check_out) {
          const inTime = new Date(att.check_in).getTime();
          const outTime = new Date(att.check_out).getTime();
          workHours = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
        } else {
          const inTime = new Date(att.check_in).getTime();
          const elapsed = (Date.now() - inTime) / (1000 * 60 * 60);
          workHours = Math.min(12, Math.max(0, elapsed));
        }
        workHours = Number(workHours.toFixed(2));
        totalHours += workHours;
        workedDaysCount++;
      }

      return {
        label: `${dayNum} ${dayName}`,
        date: dateStr,
        workHours: workHours,
        breakHours: workHours > 0 ? 0.75 : 0,
        isToday: dateStr === new Date().toISOString().split('T')[0],
      };
    });

    const avgHours = workedDaysCount > 0 ? (totalHours / workedDaysCount).toFixed(2) : '00:00';
    return { days: chartDays, avgHours, mondayDate: monday };
  }, [allAttendance, weekOffset]);

  // Request Status Stats
  const requestStats = useMemo(() => {
    const leaveTotal = leaveRequests.length;
    const leavePending = leaveRequests.filter(l => l.status === 'pending').length;
    const leaveApproved = leaveRequests.filter(l => l.status === 'approved').length;
    const leaveRejected = leaveRequests.filter(l => l.status === 'rejected' || l.status === 'cancelled').length;

    const corrTotal = corrections.length;
    const corrPending = corrections.filter(c => c.status === 'pending').length;
    const corrApproved = corrections.filter(c => c.status === 'approved').length;
    const corrRejected = corrections.filter(c => c.status === 'rejected').length;

    return {
      leave: { total: leaveTotal, pending: leavePending, approved: leaveApproved, rejected: leaveRejected },
      regularization: { total: corrTotal, pending: corrPending, approved: corrApproved, rejected: corrRejected },
      wfh: { total: 0, pending: 0, approved: 0, rejected: 0 }
    };
  }, [leaveRequests, corrections]);

  // Monthly Calendar Matrix Generation
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const attMap = new Map<string, any>();
    allAttendance.forEach(a => attMap.set(a.date, a));

    const leaveMap = new Map<string, any>();
    leaveRequests.forEach(l => {
      leaveMap.set(l.start_date, l);
    });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true, dayNum: null, dateStr: '' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dObj = new Date(year, month, d);
      const dateStr = dObj.toISOString().split('T')[0];
      const dayOfWeek = dObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const att = attMap.get(dateStr);
      const leave = leaveMap.get(dateStr);

      let status = 'none';
      if (att?.check_in) status = 'present';
      else if (leave?.status === 'approved') status = 'leave_approved';
      else if (leave?.status === 'pending') status = 'leave_pending';
      else if (isWeekend) status = 'weekend';

      days.push({
        empty: false,
        dayNum: d,
        dateStr,
        isToday: dateStr === todayStr,
        isWeekend,
        status,
        att,
        leave
      });
    }

    return days;
  }, [calendarDate, allAttendance, leaveRequests]);

  // Dynamic Leave Quotas List
  const leaveQuotasList = useMemo(() => {
    const casual = settings?.casual_leave_quota ?? 10;
    const sick = settings?.sick_leave_quota ?? 8;
    const earned = settings?.annual_leave_quota ?? 12;

    const usedCasual = leaveRequests.filter(l => l.leave_type === 'casual' && l.status === 'approved').reduce((s, l) => s + (l.days ?? 0), 0);
    const usedSick = leaveRequests.filter(l => l.leave_type === 'sick' && l.status === 'approved').reduce((s, l) => s + (l.days ?? 0), 0);
    const usedEarned = leaveRequests.filter(l => l.leave_type === 'annual' && l.status === 'approved').reduce((s, l) => s + (l.days ?? 0), 0);

    return [
      { name: 'Leave Without Pay', available: 0, total: 0, type: 'Unpaid' },
      { name: 'Casual Leave', available: Math.max(0, casual - usedCasual), total: casual, type: 'Paid' },
      { name: 'Sick Leave', available: Math.max(0, sick - usedSick), total: sick, type: 'Paid' },
      { name: 'Earned Leave', available: Math.max(0, earned - usedEarned), total: earned, type: 'Paid' },
      { name: 'Optional Leave', available: 2, total: 2, type: 'Floating' },
    ];
  }, [settings, leaveRequests]);

  // Upcoming Holidays Schedule
  const upcomingHolidays = [
    { name: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', type: 'National Holiday' },
    { name: 'Dussehra (Vijayadashami)', date: '20 Oct 2026', day: 'Tuesday', type: 'Gazetted Holiday' },
    { name: 'Diwali (Deepavali)', date: '08 Nov 2026', day: 'Sunday', type: 'Festive Holiday' },
    { name: 'Christmas Day', date: '25 Dec 2026', day: 'Friday', type: 'Public Holiday' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Overview
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome back, <strong className="text-foreground">{user?.name}</strong>. Here is your daily workplace overview.
            </p>
          </div>
          
          {/* Streak Indicator */}
          {streak.count > 0 && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border bg-card shadow-sm ${streak.isActive ? 'border-orange-500/30' : 'opacity-70'}`}>
              <div className="bg-orange-500/10 p-2 rounded-xl">
                <Flame className={`h-5 w-5 ${streak.isActive ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Attendance Streak</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-heading">{streak.count}</span>
                  <span className="text-xs font-medium">Days</span>
                  {streak.count >= 5 && <Badge variant="secondary" className="ml-1.5 text-[10px] bg-orange-500/10 text-orange-600 border-none">Early Bird</Badge>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 1. TIME & ATTENDANCE WIDGET                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border border-border/80 bg-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Clock & Direct Actions */}
            <div className="lg:col-span-5 space-y-6 lg:border-r lg:pr-8 border-border/60">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Time & Attendance
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-foreground">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h2>
                <p className="text-xs font-medium text-muted-foreground">
                  {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                </p>
              </div>

              {/* Clock In Time & Break Duration */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground font-mono">
                      {todayAtt?.check_in ? formatTime(todayAtt.check_in) : '--:--:--'}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">Clock In Time</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Coffee className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground font-mono">
                      {formatSeconds(breakSeconds)}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">Break Duration</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {todayAtt?.check_in && !todayAtt?.check_out ? (
                  <Button
                    onClick={() => navigate('/employee/attendance')}
                    className="h-12 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-2xl shadow-sm text-sm gap-2 transition-all"
                  >
                    <Clock className="h-4 w-4" /> Clock Out
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/employee/attendance')}
                    className="h-12 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-2xl shadow-sm text-sm gap-2 transition-all"
                  >
                    <Clock className="h-4 w-4" /> {todayAtt?.check_out ? 'Completed' : 'Clock In'}
                  </Button>
                )}

                <Button
                  onClick={toggleBreak}
                  variant="outline"
                  className={`h-12 font-bold rounded-2xl text-sm gap-2 border-amber-500/30 transition-all ${
                    onBreak 
                      ? 'bg-amber-500 text-white hover:bg-amber-600' 
                      : 'bg-[#F97316]/10 text-[#EA580C] hover:bg-[#F97316]/20'
                  }`}
                >
                  <Coffee className="h-4 w-4" /> {onBreak ? 'End Break' : 'Start Break'}
                </Button>
              </div>

              {/* Period & Averages */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-[11px] font-semibold bg-muted/60 text-muted-foreground px-3 py-1 rounded-full border">
                    Period: Last 07 Day's
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-2xl bg-muted/30 border">
                    <p className="text-base font-extrabold text-foreground font-mono">
                      {weeklyChartData.avgHours} hrs
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Average Working Hours
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-muted/30 border">
                    <p className="text-base font-extrabold text-foreground font-mono">
                      00:45 hrs
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Average Break Duration
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Weekly Bar Chart */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Weekly Work Analysis
                </h3>
                <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border text-xs font-semibold">
                  <button 
                    onClick={() => setWeekOffset(w => w - 1)}
                    className="p-1 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-2 font-mono">
                    {weeklyChartData.mondayDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
                    disabled={weekOffset === 0}
                    className="p-1 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData.days} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 12]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border bg-popover p-2.5 shadow-md text-xs space-y-1">
                              <p className="font-bold text-foreground">{data.date}</p>
                              <p className="text-emerald-600 font-semibold">Work Hours: {data.workHours} hrs</p>
                              <p className="text-amber-600">Break: {data.breakHours} hrs</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="workHours" radius={[6, 6, 0, 0]}>
                      {weeklyChartData.days.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.workHours > 0 ? '#10B981' : 'rgba(148, 163, 184, 0.2)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-3 w-3 rounded-md bg-[#10B981]" /> Work Hours
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-3 w-3 rounded-md bg-[#F59E0B]" /> Break Duration
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-3 w-3 rounded-md bg-[#EF4444]" /> Auto ClockOut
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setWeekOffset(w => w - 1)}
                    className="h-7 text-xs rounded-xl"
                  >
                    ‹ Pre Week
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
                    disabled={weekOffset === 0}
                    className="h-7 text-xs rounded-xl"
                  >
                    Next Week ›
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 2. LEAVE BALANCE & HOLIDAY (Exact Match to Screenshot 1)        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-heading text-foreground">
                Leave Balance and Holiday
              </h2>
              <p className="text-xs text-muted-foreground">
                Track your available leave balance quotas and upcoming company holidays
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border text-sm font-semibold">
              <button 
                onClick={() => setLeaveBalanceMonth(new Date(leaveBalanceMonth.getFullYear(), leaveBalanceMonth.getMonth() - 1, 1))}
                className="p-1 hover:bg-card rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 font-mono">
                {leaveBalanceMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setLeaveBalanceMonth(new Date(leaveBalanceMonth.getFullYear(), leaveBalanceMonth.getMonth() + 1, 1))}
                className="p-1 hover:bg-card rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Leave Balance Carousel (Matches Screenshot 1) */}
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Leave Balance</p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLeaveCarouselIdx(i => Math.max(0, i - 1))}
                  disabled={leaveCarouselIdx === 0}
                  className="h-10 w-10 rounded-2xl border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all flex-shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {leaveQuotasList.slice(leaveCarouselIdx, leaveCarouselIdx + 2).map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-muted/20 border text-center space-y-1">
                      <p className="text-3xl font-extrabold text-foreground font-heading">
                        {item.available.toString().padStart(2, '0')} <span className="text-sm font-semibold text-muted-foreground">Day(s)</span>
                      </p>
                      <p className="text-xs font-bold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">({item.type} Quota)</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setLeaveCarouselIdx(i => Math.min(leaveQuotasList.length - 2, i + 1))}
                  disabled={leaveCarouselIdx >= leaveQuotasList.length - 2}
                  className="h-10 w-10 rounded-2xl border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all flex-shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center">
                <span className="text-[11px] font-semibold bg-muted px-3 py-1 rounded-full border">
                  Period: Next 90 Day's
                </span>
              </div>
            </div>

            {/* Right: Upcoming Holidays (Matches Screenshot 1) */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-muted/20 border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">
                  {upcomingHolidays.length.toString().padStart(2, '0')} Upcoming Holiday(s)
                </p>
                <Link to="/employee/leave" className="text-[11px] font-semibold text-primary hover:underline">
                  View full calendar
                </Link>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {upcomingHolidays.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-card border text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{h.name}</p>
                      <p className="text-[10px] text-muted-foreground">{h.type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary">{h.date}</p>
                      <p className="text-[10px] text-muted-foreground">{h.day}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 3. MONTHLY ATTENDANCE CALENDAR & EVENT FILTERS (Screenshot 2)   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> Calendar
            </h2>
            <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border text-sm font-semibold">
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="p-1 hover:bg-card rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 font-mono">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="p-1 hover:bg-card rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Calendar Matrix (Left 9 cols) */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-7 text-center font-bold text-xs text-muted-foreground pb-2 border-b">
                <div className="text-muted-foreground/70">Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div className="text-muted-foreground/70">Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2">
                {calendarDays.map((d, i) => {
                  if (d.empty) {
                    return <div key={`empty-${i}`} className="min-h-[52px] sm:min-h-[64px]" />;
                  }

                  let bgClass = "bg-card hover:bg-muted/30 border";
                  let textClass = "text-foreground";

                  if (d.isToday) {
                    bgClass = "bg-[#0078FF] text-white font-bold shadow-md shadow-blue-500/20 border-[#0078FF]";
                    textClass = "text-white";
                  } else if (d.status === 'weekend') {
                    bgClass = "bg-muted/40 border-muted/50 text-muted-foreground";
                  } else if (d.status === 'present') {
                    bgClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
                  } else if (d.status === 'leave_approved') {
                    bgClass = "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400";
                  }

                  return (
                    <div
                      key={`day-${i}`}
                      onClick={() => setSelectedCalendarDay(d)}
                      className={`min-h-[52px] sm:min-h-[64px] p-2 rounded-2xl flex flex-col justify-between transition-all cursor-pointer relative ${bgClass}`}
                    >
                      <span className={`text-xs font-semibold ${textClass}`}>
                        {d.dayNum?.toString().padStart(2, '0')}
                      </span>
                      
                      <div className="flex items-center gap-1 mt-auto">
                        {d.status === 'present' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {d.status === 'leave_approved' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        )}
                        {d.isWeekend && (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 opacity-50" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter Events & Metrics Summary (Right 3 cols) */}
            <div className="lg:col-span-3 space-y-4 lg:border-l lg:pl-6 border-border/60">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Filter Events
              </h3>

              <div className="space-y-2 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Approved Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Leave Request</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span>Team Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0078FF]" />
                  <span>Present Day</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="p-3 rounded-2xl bg-muted/20 border">
                  <p className="text-xl font-bold text-foreground font-mono">
                    {leaveRequests.filter(l => l.status === 'approved').length} Day(s)
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">My Leave</p>
                </div>

                <div className="p-3 rounded-2xl bg-muted/20 border">
                  <p className="text-xl font-bold text-foreground font-mono">
                    {leaveRequests.filter(l => l.status === 'pending').length} Day(s)
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">My Leave Request</p>
                </div>

                <div className="p-3 rounded-2xl bg-muted/20 border">
                  <p className="text-xl font-bold text-foreground font-mono">0 Day(s)</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Team Leave</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 4. REQUEST STATUS SUMMARY & CELEBRATIONS (Screenshot 2 & 3)     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left 8 Cols: Request Status Summary with Circular Donut Rings */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border bg-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    Request Status Summary
                  </h2>
                  <p className="text-xs text-muted-foreground">Track all raised, pending, and approved requests</p>
                </div>
                <span className="text-[11px] font-semibold bg-muted px-3 py-1 rounded-full border">
                  Last 07 Day's
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Leave Card */}
                <div className="p-5 rounded-2xl border bg-muted/10 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">Leave</h3>
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl" asChild>
                      <Link to="/employee/leave">Raise Request</Link>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Donut Progress Ring */}
                    <div className="relative h-14 w-14 flex-shrink-0 flex items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted/30 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#0078FF] stroke-current"
                          strokeDasharray={`${requestStats.leave.total > 0 ? (requestStats.leave.approved / requestStats.leave.total) * 100 : 0}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold font-mono">
                        {requestStats.leave.total}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs flex-1">
                      <div>
                        <p className="font-bold text-foreground text-sm leading-none">{requestStats.leave.total}</p>
                        <p className="text-[10px] text-muted-foreground">Raised</p>
                      </div>
                      <div>
                        <p className="font-bold text-amber-600 text-sm leading-none">{requestStats.leave.pending}</p>
                        <p className="text-[10px] text-muted-foreground">Pending</p>
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-emerald-600 text-sm leading-none">{requestStats.leave.approved}</p>
                        <p className="text-[10px] text-muted-foreground">Approved</p>
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-rose-600 text-sm leading-none">{requestStats.leave.rejected}</p>
                        <p className="text-[10px] text-muted-foreground">Rejected</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Attendance Regularization Card */}
                <div className="p-5 rounded-2xl border bg-muted/10 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">Regularization</h3>
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl" asChild>
                      <Link to="/employee/attendance">Raise Request</Link>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 flex-shrink-0 flex items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted/30 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#0078FF] stroke-current"
                          strokeDasharray={`${requestStats.regularization.total > 0 ? (requestStats.regularization.approved / requestStats.regularization.total) * 100 : 0}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold font-mono">
                        {requestStats.regularization.total}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs flex-1">
                      <div>
                        <p className="font-bold text-foreground text-sm leading-none">{requestStats.regularization.total}</p>
                        <p className="text-[10px] text-muted-foreground">Raised</p>
                      </div>
                      <div>
                        <p className="font-bold text-amber-600 text-sm leading-none">{requestStats.regularization.pending}</p>
                        <p className="text-[10px] text-muted-foreground">Pending</p>
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-emerald-600 text-sm leading-none">{requestStats.regularization.approved}</p>
                        <p className="text-[10px] text-muted-foreground">Approved</p>
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-rose-600 text-sm leading-none">{requestStats.regularization.rejected}</p>
                        <p className="text-[10px] text-muted-foreground">Rejected</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Work From Home Card */}
                <div className="p-5 rounded-2xl border bg-muted/10 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">Work From Home</h3>
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl" asChild>
                      <Link to="/employee/attendance">Raise Request</Link>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 flex-shrink-0 flex items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted/30 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#0078FF] stroke-current"
                          strokeDasharray="0, 100"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold font-mono">0</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs flex-1">
                      <div>
                        <p className="font-bold text-foreground text-sm leading-none">0</p>
                        <p className="text-[10px] text-muted-foreground">Raised</p>
                      </div>
                      <div>
                        <p className="font-bold text-amber-600 text-sm leading-none">0</p>
                        <p className="text-[10px] text-muted-foreground">Pending</p>
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-emerald-600 text-sm leading-none">0</p>
                        <p className="text-[10px] text-muted-foreground">Approved</p>
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-rose-600 text-sm leading-none">0</p>
                        <p className="text-[10px] text-muted-foreground">Rejected</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          </div>

          {/* Right 4 Cols: Celebrations Widget */}
          <div className="lg:col-span-4">
            <Card className="p-6 rounded-3xl shadow-sm border bg-[#EBF3FE] dark:bg-card h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-blue-200 dark:border-border pb-3 mb-4">
                  <button
                    onClick={() => setCelebrationTab('birthdays')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      celebrationTab === 'birthdays'
                        ? 'bg-[#0078FF] text-white shadow-sm'
                        : 'text-slate-600 dark:text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Birthday(s) {companyProfiles.length > 0 ? 1 : 0}
                  </button>
                  <button
                    onClick={() => setCelebrationTab('anniversaries')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      celebrationTab === 'anniversaries'
                        ? 'bg-[#0078FF] text-white shadow-sm'
                        : 'text-slate-600 dark:text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Work Anniversaries
                  </button>
                </div>

                {/* Main Celebrant Showcase */}
                <div className="text-center py-4 space-y-3">
                  <div className="h-16 w-16 rounded-full bg-white dark:bg-muted shadow-md mx-auto flex items-center justify-center border-2 border-primary/20 text-primary overflow-hidden">
                    {companyProfiles[0]?.avatar_url ? (
                      <img src={companyProfiles[0].avatar_url} alt={companyProfiles[0].full_name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-primary/20 text-[#0078FF] text-[10px] font-bold mb-1">
                      <Cake className="h-3 w-3" /> Team Celebration
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-foreground">
                      {companyProfiles[0]?.full_name || user?.name || 'Team Member'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground">
                      {companyProfiles[0]?.job_title || user?.jobTitle || 'Employee'} · {companyProfiles[0]?.department || user?.department || user?.company?.name || 'RoleSync'}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => toast.success(`Celebration wishes sent to ${companyProfiles[0]?.full_name || user?.name}! 🎉`)}
                    className="h-8 text-xs font-bold bg-[#0078FF] hover:bg-[#0066DB] text-white rounded-xl shadow-md shadow-blue-500/20"
                  >
                    <PartyPopper className="h-3.5 w-3.5 mr-1.5" /> Send Wishes
                  </Button>
                </div>
              </div>

              {/* Upcoming Celebrations Footer List */}
              {companyProfiles.length > 1 && (
                <div className="pt-3 border-t border-blue-200/60 dark:border-border text-xs">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider mb-2">
                    Company Colleagues
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    {companyProfiles.slice(1, 3).map((prof) => (
                      <div key={prof.id} className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-blue-200 dark:bg-muted flex items-center justify-center text-xs font-bold">
                          {prof.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 dark:text-foreground truncate text-[11px]">{prof.full_name}</p>
                          <p className="text-[9px] text-slate-500 truncate">{prof.department || 'Team'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 5. PERFORMANCE MANAGEMENT WIDGET (Screenshot 3)                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Performance Management
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                You can view all the review cycles for which you are a part, as a reviewer or/and reviewee
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs font-semibold rounded-xl">
              <Link to="/employee/performance">
                View Performance Hub <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={performanceSearch}
                onChange={(e) => setPerformanceSearch(e.target.value)}
                placeholder="Search review cycles..."
                className="pl-9 h-10 bg-muted/30 rounded-xl text-xs"
              />
            </div>

            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 rounded-2xl border border-dashed">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">No Active Review Cycles Found</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  There are currently no active performance appraisal cycles assigned to your profile for this period.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 6. IDENTITY & WORKSPACE SHORTCUTS                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EmployeeIdCard />
          </div>
          <Card className="p-6 rounded-3xl shadow-sm border flex flex-col justify-between">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Workspace Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1" asChild>
                <Link to="/employee/attendance">
                  <Clock className="h-4 w-4 text-primary" /> Attendance
                </Link>
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1" asChild>
                <Link to="/employee/leave">
                  <CalendarDays className="h-5 w-5 text-emerald-600" /> Leaves
                </Link>
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1" asChild>
                <Link to="/employee/tasks">
                  <CheckSquare className="h-4 w-4 text-blue-600" /> Tasks ({taskCounts.inProgress})
                </Link>
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1" asChild>
                <Link to="/employee/helpdesk">
                  <Briefcase className="h-4 w-4 text-purple-600" /> Helpdesk
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
