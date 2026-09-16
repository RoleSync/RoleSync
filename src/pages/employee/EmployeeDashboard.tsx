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
  Calendar,
  Sparkles,
  Palmtree,
  Stethoscope,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatTime } from '@/lib/helpers';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [streak, setStreak] = useState({ count: 0, isActive: false });
  const [loading, setLoading] = useState(true);

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

  // Format Seconds to HH:MM:SS
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
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

    Promise.all([
      supabase.from('attendance').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('tasks').select('id, status').eq('assigned_to', user.id),
      supabase.from('leave_requests').select('days, status, leave_type').eq('user_id', user.id).eq('status', 'approved'),
      supabase.from('tasks').select('*').eq('assigned_to', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('attendance').select('*').eq('user_id', user.id).gte('date', sixtyDaysAgoStr).order('date', { ascending: false }),
    ]).then(([att, tasks, leaves, recent, history]) => {
      setTodayAtt(att.data);
      const t = tasks.data ?? [];
      setTaskCounts({
        total: t.length,
        completed: t.filter((x) => x.status === 'completed').length,
        inProgress: t.filter((x) => x.status === 'in_progress').length,
      });
      setRecentTasks(recent.data ?? []);
      setRecentAttendance(history.data ?? []);

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

  // Generate 7-day Weekly Chart Data (Mon - Sun) with Week Offsets
  const weeklyChartData = useMemo(() => {
    const curr = new Date();
    // Calculate start of week (Monday)
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    const monday = new Date(curr.setDate(diff));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const attMap = new Map<string, any>();
    recentAttendance.forEach((a) => attMap.set(a.date, a));

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
          // If checked in today without check out, calculate elapsed
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
  }, [recentAttendance, weekOffset]);

  // Leave Balances
  const leaveStats = useMemo(() => {
    const casual = settings?.casual_leave_quota ?? 10;
    const sick = settings?.sick_leave_quota ?? 8;
    const earned = settings?.annual_leave_quota ?? 12;
    return {
      casual: { total: casual, available: casual - 2 },
      sick: { total: sick, available: sick - 1 },
      earned: { total: earned, available: earned - 3 },
      optional: { total: 2, available: 2 }
    };
  }, [settings]);

  // Upcoming Holidays Mock / Static schedule
  const upcomingHolidays = [
    { name: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', type: 'National Holiday' },
    { name: 'Dussehra (Vijayadashami)', date: '20 Oct 2026', day: 'Tuesday', type: 'Gazetted Holiday' },
    { name: 'Diwali (Deepavali)', date: '08 Nov 2026', day: 'Sunday', type: 'Festive Holiday' },
    { name: 'Christmas Day', date: '25 Dec 2026', day: 'Friday', type: 'Public Holiday' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
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
        {/* 1. TIME & ATTENDANCE WIDGET (Exact Match to Reference Image)    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border border-border/80 bg-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Section: Live Clock, Metrics & Action Buttons */}
            <div className="lg:col-span-5 space-y-6 lg:border-r lg:pr-8 border-border/60">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Time & Attendance
                </span>
                {/* Real-time Large Digital Clock */}
                <h2 className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-foreground">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h2>
                <p className="text-xs font-medium text-muted-foreground">
                  {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                </p>
              </div>

              {/* Clock In Time & Break Duration Metrics */}
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

              {/* Action Buttons: Clock In/Out & Start/End Break */}
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

              {/* Period & Average Working Hours Pills */}
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

            {/* Right Section: Weekly Work Hours & Break Interactive Bar Chart */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
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

              {/* Recharts Bar Chart */}
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

              {/* Chart Legend & Week Navigation */}
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
        {/* 2. LEAVE BALANCE & HOLIDAYS (Exact Match to Reference Image)    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card className="p-6 sm:p-8 rounded-3xl shadow-sm border border-border/80 bg-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold font-heading text-foreground">
                Leave Balance and Holidays
              </h2>
              <p className="text-xs text-muted-foreground">
                Track your available quotas and upcoming public holidays
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary">
              <Link to="/employee/leave">
                Apply Leave <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Leave Balance Breakdown Cards */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center space-y-1">
                <div className="h-8 w-8 mx-auto rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2">
                  <Briefcase className="h-4 w-4" />
                </div>
                <p className="text-2xl font-extrabold text-foreground font-heading">
                  {leaveStats.earned.available}
                </p>
                <p className="text-xs font-semibold text-blue-600">Earned Leave</p>
                <p className="text-[10px] text-muted-foreground">of {leaveStats.earned.total} Total</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1">
                <div className="h-8 w-8 mx-auto rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                  <Palmtree className="h-4 w-4" />
                </div>
                <p className="text-2xl font-extrabold text-foreground font-heading">
                  {leaveStats.casual.available}
                </p>
                <p className="text-xs font-semibold text-emerald-600">Casual Leave</p>
                <p className="text-[10px] text-muted-foreground">of {leaveStats.casual.total} Total</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center space-y-1">
                <div className="h-8 w-8 mx-auto rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <p className="text-2xl font-extrabold text-foreground font-heading">
                  {leaveStats.sick.available}
                </p>
                <p className="text-xs font-semibold text-rose-600">Sick Leave</p>
                <p className="text-[10px] text-muted-foreground">of {leaveStats.sick.total} Total</p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-center space-y-1">
                <div className="h-8 w-8 mx-auto rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-2xl font-extrabold text-foreground font-heading">
                  {leaveStats.optional.available}
                </p>
                <p className="text-xs font-semibold text-purple-600">Optional</p>
                <p className="text-[10px] text-muted-foreground">Floating Leave</p>
              </div>
            </div>

            {/* Upcoming Holidays Mini List */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-muted/20 border space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>Upcoming Holidays</span>
                <span className="text-[10px] font-normal lowercase">2026 calendar</span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {upcomingHolidays.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-card border text-xs">
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
        {/* 3. IDENTITY & BIRTHDAYS CARDS                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={features?.birthdays_enabled !== false ? "lg:col-span-2" : "lg:col-span-3"}>
            <EmployeeIdCard />
          </div>
          {features?.birthdays_enabled !== false && <BirthdaysCard />}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 4. TASKS & PERFORMANCE OVERVIEW                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6 rounded-3xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" /> Recent Assigned Tasks
              </h3>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
                <Link to="/employee/tasks">View all</Link>
              </Button>
            </div>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No pending tasks assigned.</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">Due {t.due_date ?? '—'}</p>
                    </div>
                    <StatusBadge status={t.status === 'in_progress' ? 'In Progress' : t.status === 'completed' ? 'Completed' : 'Pending'} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 rounded-3xl shadow-sm border">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Fast Workspace Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1 hover:border-primary" asChild>
                <Link to="/employee/attendance">
                  <Clock className="h-5 w-5 text-primary" /> Attendance Logs
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1 hover:border-primary" asChild>
                <Link to="/employee/leave">
                  <CalendarDays className="h-5 w-5 text-emerald-600" /> Apply for Leave
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1 hover:border-primary" asChild>
                <Link to="/employee/tasks">
                  <CheckSquare className="h-5 w-5 text-blue-600" /> View All Tasks
                </Link>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center rounded-2xl text-xs font-semibold gap-1 hover:border-primary" asChild>
                <Link to="/employee/helpdesk">
                  <Briefcase className="h-5 w-5 text-purple-600" /> Submit Helpdesk Ticket
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
