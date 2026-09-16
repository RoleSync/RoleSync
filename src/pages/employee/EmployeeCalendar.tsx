import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Share2, 
  Download, Plus, Clock, Users, Palmtree, MapPin, Sparkles, 
  ExternalLink, CheckCircle2, AlertCircle, Info, CalendarDays,
  Coffee, RefreshCw, X
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'my_leave' | 'my_leave_request' | 'notify' | 'team_leave' | 'holiday' | 'week_off';
  date: string; // YYYY-MM-DD
  time?: string;
  person_name?: string;
  details?: string;
}

export default function EmployeeCalendar() {
  const { user } = useAuth();

  // Navigation & View State
  const [monthOffset, setMonthOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [googleSyncOpen, setGoogleSyncOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; events: CalendarEvent[] } | null>(null);

  // Filter Checkbox States (Matching screenshot)
  const [filters, setFilters] = useState({
    selectAll: true,
    myLeave: true,
    myLeaveRequest: true,
    notify: true,
    teamLeave: true,
    holiday: true,
    weekOff: true,
  });

  const toggleSelectAll = (checked: boolean) => {
    setFilters({
      selectAll: checked,
      myLeave: checked,
      myLeaveRequest: checked,
      notify: checked,
      teamLeave: checked,
      holiday: checked,
      weekOff: checked,
    });
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const allSelected = next.myLeave && next.myLeaveRequest && next.notify && next.teamLeave && next.holiday && next.weekOff;
      next.selectAll = allSelected;
      return next;
    });
  };

  // Pre-configured Calendar Events for September 2026
  const eventsList: CalendarEvent[] = [
    {
      id: 'ev-1',
      title: 'Milad-un-Nabi (Public Holiday)',
      type: 'holiday',
      date: '2026-09-05',
      details: 'National Public Holiday · Office Closed'
    },
    {
      id: 'ev-2',
      title: 'WFH - Remote Architecture Sprint',
      type: 'my_leave_request',
      date: '2026-09-09',
      details: 'Work From Home request · Approved'
    },
    {
      id: 'ev-3',
      title: 'Ganesh Chaturthi (Public Holiday)',
      type: 'holiday',
      date: '2026-09-15',
      details: 'Public Holiday across Karnataka & Maharashtra'
    },
    {
      id: 'ev-4',
      title: 'Somnath Tiwary Birthday',
      type: 'notify',
      date: '2026-09-16',
      time: '11:00 AM',
      person_name: 'Somnath Tiwary',
      details: 'Team Celebration & Cake Cutting in Town Hall'
    },
    {
      id: 'ev-5',
      title: 'Q3 1-on-1 Engineering Review',
      type: 'notify',
      date: '2026-09-20',
      time: '03:00 PM',
      details: 'Sprint sync with Engineering Lead'
    },
    {
      id: 'ev-6',
      title: 'Priya Sharma (Casual Leave)',
      type: 'team_leave',
      date: '2026-09-24',
      person_name: 'Priya Sharma',
      details: 'HR Team Member on approved leave'
    },
    {
      id: 'ev-7',
      title: 'Casual Leave (Approved)',
      type: 'my_leave',
      date: '2026-09-28',
      details: '1-Day Casual Leave for personal errands'
    }
  ];

  // Calendar Calculation for Month Grid
  const calendarData = useMemo(() => {
    const targetDate = new Date(2026, 8 + monthOffset, 1); // Month 8 = September 2026
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Day of week for 1st of month (0 = Sun, 1 = Mon, ... 6 = Sat)
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday

    const days = [];
    
    // Padding days before the 1st of current month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let p = firstDay - 1; p >= 0; p--) {
      const dayNum = prevMonthDays - p;
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
        isSunday: false,
        isSaturday: false,
        weekNumber: null
      });
    }

    // Days in current month
    let weekCounter = 1;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        isSunday,
        isSaturday,
        isToday: d === 16 && month === 8 && year === 2026,
        weekNumber: isSunday ? weekCounter++ : null
      });
    }

    // Padding days for end of month to complete grid
    const remainingSlots = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let e = 1; e <= remainingSlots; e++) {
      days.push({
        dayNumber: e,
        isCurrentMonth: false,
        dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(e).padStart(2, '0')}`,
        isSunday: false,
        isSaturday: false,
        weekNumber: null
      });
    }

    return { monthName, days };
  }, [monthOffset]);

  // Filtered Events
  const getEventsForDay = (dateStr: string, isWeekend: boolean) => {
    const list: CalendarEvent[] = [];

    // Add week-off event if weekend and filter enabled
    if (isWeekend && filters.weekOff) {
      list.push({
        id: `wo-${dateStr}`,
        title: 'Week Off',
        type: 'week_off',
        date: dateStr
      });
    }

    // Add matching explicit events
    eventsList.forEach(ev => {
      if (ev.date === dateStr) {
        if (ev.type === 'my_leave' && filters.myLeave) list.push(ev);
        if (ev.type === 'my_leave_request' && filters.myLeaveRequest) list.push(ev);
        if (ev.type === 'notify' && filters.notify) list.push(ev);
        if (ev.type === 'team_leave' && filters.teamLeave) list.push(ev);
        if (ev.type === 'holiday' && filters.holiday) list.push(ev);
      }
    });

    return list;
  };

  // Google Calendar Sync Export
  const handleExportICS = () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RoleSync//Workforce Calendar//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:RoleSync Schedule\nSUMMARY:RoleSync Work & Holiday Schedule\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'rolesync_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded calendar .ics file for Google / Outlook sync!");
    setGoogleSyncOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full workforce schedule, leave days, public holidays, and calendar synchronization
          </p>
        </div>
      </div>

      {/* ─── Control Bar (Month Navigator + Sync With Google Calendar + View Mode Switcher) ─── */}
      <Card className="p-4 border-border/70 shadow-sm bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Month Navigator */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setMonthOffset(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-heading font-bold text-base sm:text-lg text-foreground px-2 min-w-[160px] text-center">
              {calendarData.monthName}
            </h3>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setMonthOffset(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {monthOffset !== 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMonthOffset(0)}
                className="text-xs text-primary font-semibold h-8"
              >
                Today
              </Button>
            )}
          </div>

          {/* Right: Sync With Google Calendar + View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Sync With Google Calendar Button (Matching coral badge in screenshot) */}
            <Button 
              onClick={() => setGoogleSyncOpen(true)}
              className="h-8 px-4 rounded-md bg-[#EF5350] hover:bg-[#E53935] text-white font-bold text-xs shadow-sm"
            >
              Sync With Google Calendar
            </Button>

            {/* View Switcher: Month, Week, Day(s) */}
            <div className="flex items-center rounded-full bg-muted/50 p-1 border border-border/60">
              {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'day' ? 'Day(s)' : mode}
                </button>
              ))}
            </div>

          </div>

        </div>
      </Card>

      {/* ─── Two-Column Layout (Left: Full Calendar Grid, Right: Filter Events Panel) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (9.5 cols): Calendar Grid */}
        <div className="lg:col-span-9 space-y-4">
          <Card className="p-0 overflow-hidden border-border/70 shadow-sm bg-card">
            
            {/* Days of Week Header (Matching blue banner in screenshot) */}
            <div className="grid grid-cols-7 bg-[#2979FF] text-white text-center font-bold text-xs sm:text-sm py-3 shadow-inner">
              <span>Sunday</span>
              <span>Monday</span>
              <span>Tuesday</span>
              <span>Wednesday</span>
              <span>Thursday</span>
              <span>Friday</span>
              <span>Saturday</span>
            </div>

            {/* 7-Column Month Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-border/40">
              {calendarData.days.map((day, idx) => {
                const dayEvents = getEventsForDay(day.dateStr, day.isSunday || day.isSaturday);
                const hasHoliday = dayEvents.some(e => e.type === 'holiday');
                const hasLeave = dayEvents.some(e => e.type === 'my_leave' || e.type === 'my_leave_request');
                const hasNotify = dayEvents.some(e => e.type === 'notify');

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDayEvents({ dateStr: day.dateStr, events: dayEvents })}
                    className={`min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between cursor-pointer transition-all hover:bg-muted/30 ${
                      !day.isCurrentMonth
                        ? 'bg-muted/10 opacity-35'
                        : day.isSunday || day.isSaturday
                        ? 'bg-muted/15'
                        : 'bg-card'
                    }`}
                  >
                    {/* Top Row: Week Number indicator on Sunday + Day Number */}
                    <div className="flex items-center justify-between">
                      {day.weekNumber !== null ? (
                        <span className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold flex items-center justify-center">
                          {day.weekNumber}
                        </span>
                      ) : (
                        <span />
                      )}

                      <span className={`text-xs sm:text-sm font-bold ${
                        day.isToday 
                          ? 'h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-extrabold shadow-sm'
                          : day.isSunday 
                          ? 'text-[#EF5350]' 
                          : 'text-foreground'
                      }`}>
                        {day.dayNumber}
                      </span>
                    </div>

                    {/* Events Chips / Indicators */}
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev, i) => (
                        <div 
                          key={i} 
                          className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${
                            ev.type === 'holiday' 
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                              : ev.type === 'my_leave' 
                              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                              : ev.type === 'my_leave_request' 
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : ev.type === 'notify' 
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : ev.type === 'team_leave' 
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                              : 'text-muted-foreground/60'
                          }`}
                        >
                          {ev.type === 'week_off' ? '' : ev.title}
                        </div>
                      ))}

                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-bold text-primary block text-right">
                          +{dayEvents.length - 2} more
                        </span>
                      )}

                      {/* Small Indicator dot if events exist */}
                      {(hasHoliday || hasLeave || hasNotify) && (
                        <div className="flex items-center justify-center gap-1 pt-0.5">
                          {hasHoliday && <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
                          {hasLeave && <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />}
                          {hasNotify && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </Card>
        </div>

        {/* Right Column (3 cols): Filter Events Checkbox Panel (Exact match to screenshot) ─── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5 border-border/70 shadow-sm bg-card">
            <h4 className="font-heading font-bold text-sm text-foreground mb-4 border-b border-border/60 pb-2">
              Filter Events
            </h4>

            <div className="space-y-3.5 text-xs">
              
              {/* Select All Events */}
              <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-foreground">
                <input 
                  type="checkbox" 
                  checked={filters.selectAll}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>Select All Events</span>
              </label>

              {/* My Leave */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={filters.myLeave}
                    onChange={() => toggleFilter('myLeave')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">My Leave</span>
                </div>
                <span className="h-2 w-8 rounded-full bg-[#00BCD4]" title="Cyan" />
              </label>

              {/* My Leave Request */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={filters.myLeaveRequest}
                    onChange={() => toggleFilter('myLeaveRequest')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">My Leave Request</span>
                </div>
                <span className="h-2 w-8 rounded-full bg-[#FF9800]" title="Orange" />
              </label>

              {/* Notify */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={filters.notify}
                    onChange={() => toggleFilter('notify')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Notify</span>
                </div>
                <span className="h-2 w-8 rounded-full bg-[#4CAF50]" title="Green" />
              </label>

              {/* Team Leave */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={filters.teamLeave}
                    onChange={() => toggleFilter('teamLeave')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Team Leave</span>
                </div>
                <span className="h-2 w-8 rounded-full bg-[#2979FF]" title="Blue" />
              </label>

              {/* Holiday */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={filters.holiday}
                    onChange={() => toggleFilter('holiday')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Holiday</span>
                </div>
                <span className="h-2 w-8 rounded-full bg-[#9C27B0]" title="Purple" />
              </label>

              {/* Week Off */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={filters.weekOff}
                    onChange={() => toggleFilter('weekOff')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Week Off</span>
                </div>
                <span className="h-2 w-8 rounded-full bg-[#1A237E]" title="Navy" />
              </label>

            </div>
          </Card>
        </div>

      </div>

      {/* ─── Google Calendar Sync Modal Dialog ─── */}
      <Dialog open={googleSyncOpen} onOpenChange={setGoogleSyncOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Sync With Google / Outlook Calendar
            </DialogTitle>
            <DialogDescription>
              Subscribe to your RoleSync work schedule, approved leaves, and company holidays.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <p className="font-bold text-foreground">iCal Feed Subscription Link</p>
              <div className="flex items-center gap-2">
                <input 
                  readOnly 
                  value="https://rolesync.in/api/v1/calendar/feed.ics?token=usr_7894" 
                  className="h-8 text-xs font-mono bg-background border border-border/70 rounded-md px-2 w-full text-muted-foreground"
                />
                <Button 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard?.writeText("https://rolesync.in/api/v1/calendar/feed.ics?token=usr_7894");
                    toast.success("Calendar feed link copied!");
                  }}
                  className="h-8 text-xs shrink-0"
                >
                  Copy
                </Button>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              You can also download the static <strong>.ics</strong> file to import directly into Google Calendar, Apple Calendar, or Microsoft Outlook.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setGoogleSyncOpen(false)}>
              Close
            </Button>
            <Button onClick={handleExportICS} className="bg-gradient-to-r from-primary to-indigo-600 gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download .ICS File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Day Events Inspector Dialog ─── */}
      <Dialog open={!!selectedDayEvents} onOpenChange={() => setSelectedDayEvents(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Events on {selectedDayEvents?.dateStr}
            </DialogTitle>
          </DialogHeader>

          {selectedDayEvents && (
            <div className="space-y-3 py-2 text-xs">
              {selectedDayEvents.events.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">No scheduled events or leaves on this day.</p>
              ) : (
                selectedDayEvents.events.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-foreground text-sm">{ev.title}</h5>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {ev.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {ev.time && <p className="text-primary font-mono text-xs">⏰ {ev.time}</p>}
                    {ev.details && <p className="text-muted-foreground text-xs mt-0.5">{ev.details}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedDayEvents(null)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
