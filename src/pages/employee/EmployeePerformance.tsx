import { useEffect, useState, useMemo } from 'react';
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  TrendingUp, Clock, Award, CheckCircle, Target, Users, Calendar, 
  MessageSquare, Star, Plus, Search, Filter, HelpCircle, FileText, 
  Smile, Sparkles, AlertCircle, ArrowRight, UserCheck, ShieldCheck, 
  ChevronDown, Check, X, Send, Eye, MoreVertical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { toast } from 'sonner';

type ActiveTab = 'my_1_1' | 'updates' | 'feedback' | 'reviews';
type SearchByMode = 'people' | 'department';

interface OneOnOneSession {
  id: string;
  manager_name: string;
  scheduled_date: string;
  time_slot: string;
  agenda: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  action_items?: string[];
  notes?: string;
}

interface GoalUpdate {
  id: string;
  title: string;
  category: string;
  progress: number;
  target_value: string;
  current_value: string;
  last_updated: string;
  notes: string;
}

interface FeedbackItem {
  id: string;
  from_name: string;
  from_role: string;
  type: 'positive' | 'constructive' | 'peer_praise';
  date: string;
  content: string;
  tags: string[];
  badge?: string;
}

interface AppraisalCycle {
  id: string;
  cycle_name: string;
  period: string;
  deadline: string;
  status: 'pending_self_review' | 'manager_review' | 'completed';
  self_rating?: number;
  manager_rating?: number;
}

const COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EC4899'];

export default function EmployeePerformance() {
  const { user } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('reviews');
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  
  // Search & Filter State (as shown in top bar of screenshot)
  const [searchBy, setSearchBy] = useState<SearchByMode>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Performance Stats
  const [stats, setStats] = useState({ taskRate: 88, attendanceRate: 96, completed: 14, onTime: 22 });
  const [taskBreakdown, setTaskBreakdown] = useState<{ name: string; value: number }[]>([
    { name: 'Completed', value: 14 },
    { name: 'In Progress', value: 4 },
    { name: 'Pending', value: 2 },
  ]);

  // Data States
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOneSession[]>([
    {
      id: '1-1-1',
      manager_name: 'Sarah Jenkins (Eng Lead)',
      scheduled_date: '20-Mar-2026',
      time_slot: '03:00 PM – 03:45 PM',
      agenda: 'Q1 Sprint deliverables, backend latency optimization, and career progression roadmap',
      status: 'upcoming',
      action_items: ['Complete Swagger API docs', 'Review Supabase RLS policies']
    },
    {
      id: '1-1-2',
      manager_name: 'Sarah Jenkins (Eng Lead)',
      scheduled_date: '27-Feb-2026',
      time_slot: '04:00 PM – 04:30 PM',
      agenda: 'Bi-weekly sync on attendance geolocation module and offline sync',
      status: 'completed',
      notes: 'Great work on offline cache handling. Next focus on unit testing.'
    }
  ]);

  const [goalUpdates, setGoalUpdates] = useState<GoalUpdate[]>([
    {
      id: 'GOAL-1',
      title: 'Complete RoleSync HRMS Module Overhaul',
      category: 'Core Engineering',
      progress: 92,
      target_value: '100%',
      current_value: '92%',
      last_updated: '14-Mar-2026',
      notes: 'Implemented Attendance 4-tabs, Leave 6-tier quotas, and Expense Management.'
    },
    {
      id: 'GOAL-2',
      title: 'Maintain >99.5% Unit Test & Build Success Rate',
      category: 'Quality & Reliability',
      progress: 100,
      target_value: '99.5%',
      current_value: '100%',
      last_updated: '16-Mar-2026',
      notes: 'All Vite production builds clean with 0 TypeScript/lint errors.'
    },
    {
      id: 'GOAL-3',
      title: 'Product Engineering Knowledge Sharing',
      category: 'Team Leadership',
      progress: 60,
      target_value: '3 Sessions',
      current_value: '2 Completed',
      last_updated: '08-Mar-2026',
      notes: 'Conducted walkthrough on Supabase RLS and React state patterns.'
    }
  ]);

  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([
    {
      id: 'fb-1',
      from_name: 'Priya Sharma',
      from_role: 'Senior Product Manager',
      type: 'positive',
      date: '14-Mar-2026',
      content: 'Exceptional speed and precision delivering the new Attendance and Leave workflows ahead of schedule!',
      tags: ['High Ownership', 'Fast Delivery', 'Attention to Detail'],
      badge: '⭐ Star Performer'
    },
    {
      id: 'fb-2',
      from_name: 'Vikram Mehta',
      from_role: 'Lead Architect',
      type: 'peer_praise',
      date: '10-Mar-2026',
      content: 'Great architectural decoupling for multi-tenant isolation and clean TypeScript typing across the codebase.',
      tags: ['Architecture', 'Clean Code'],
      badge: '💡 Innovator'
    }
  ]);

  const [appraisalCycles, setAppraisalCycles] = useState<AppraisalCycle[]>([]);

  // Dialog States
  const [schedule11Open, setSchedule11Open] = useState(false);
  const [new11Manager, setNew11Manager] = useState('Sarah Jenkins (Eng Lead)');
  const [new11Date, setNew11Date] = useState('2026-03-25');
  const [new11Time, setNew11Time] = useState('15:00');
  const [new11Agenda, setNew11Agenda] = useState('');

  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('Core Engineering');
  const [goalProgress, setGoalProgress] = useState('50');
  const [goalNotes, setGoalNotes] = useState('');

  const [giveFeedbackOpen, setGiveFeedbackOpen] = useState(false);
  const [feedbackTo, setFeedbackTo] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackTag, setFeedbackTag] = useState('Team Player');

  const [selfReviewOpen, setSelfReviewOpen] = useState(false);
  const [techRating, setTechRating] = useState(5);
  const [teamRating, setTeamRating] = useState(5);
  const [accomplishments, setAccomplishments] = useState('');
  const [growthGoals, setGrowthGoals] = useState('');

  // Handle Create 1-1
  const handleCreate11 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!new11Agenda.trim()) {
      toast.error('Please enter meeting agenda');
      return;
    }
    const newSession: OneOnOneSession = {
      id: `1-1-${Date.now()}`,
      manager_name: new11Manager,
      scheduled_date: new Date(new11Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time_slot: `${new11Time} (30 mins)`,
      agenda: new11Agenda.trim(),
      status: 'upcoming'
    };
    setOneOnOnes(prev => [newSession, ...prev]);
    toast.success('1-on-1 check-in meeting scheduled!');
    setSchedule11Open(false);
    setNew11Agenda('');
  };

  // Handle Add Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      toast.error('Please enter goal title');
      return;
    }
    const newG: GoalUpdate = {
      id: `GOAL-${Math.floor(100 + Math.random() * 900)}`,
      title: goalTitle.trim(),
      category: goalCategory,
      progress: parseInt(goalProgress) || 0,
      target_value: '100%',
      current_value: `${goalProgress}%`,
      last_updated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes: goalNotes.trim()
    };
    setGoalUpdates(prev => [newG, ...prev]);
    toast.success('Goal progress milestone added!');
    setAddGoalOpen(false);
    setGoalTitle('');
    setGoalNotes('');
  };

  // Handle Submit Feedback
  const handleGiveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTo.trim() || !feedbackContent.trim()) {
      toast.error('Please fill recipient name and feedback message');
      return;
    }
    const newFb: FeedbackItem = {
      id: `fb-${Date.now()}`,
      from_name: `To: ${feedbackTo.trim()}`,
      from_role: 'Colleague',
      type: 'positive',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      content: feedbackContent.trim(),
      tags: [feedbackTag],
      badge: '⭐ Peer Appreciation'
    };
    setFeedbackList(prev => [newFb, ...prev]);
    toast.success('Feedback submitted successfully!');
    setGiveFeedbackOpen(false);
    setFeedbackTo('');
    setFeedbackContent('');
  };

  // Handle Submit Self Review
  const handleSubmitSelfReview = (e: React.FormEvent) => {
    e.preventDefault();
    const newCycle: AppraisalCycle = {
      id: 'APR-2026-Q1',
      cycle_name: 'Annual Performance Appraisal 2026',
      period: 'Jan 2026 – Dec 2026',
      deadline: '31-Mar-2026',
      status: 'manager_review',
      self_rating: (techRating + teamRating) / 2
    };
    setAppraisalCycles([newCycle]);
    toast.success('Self assessment submitted for manager review!');
    setSelfReviewOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Top Global Search Bar (Matching Search By People / Department dropdown in screenshot) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Performance Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Continuous 1-on-1 check-ins, goal updates, peer feedback, and appraisal reviews
          </p>
        </div>

        {/* Search By People / Department Dropdown Input */}
        <div className="relative flex items-center max-w-md w-full sm:w-auto">
          <div className="relative flex items-center w-full bg-card border border-border/80 rounded-full shadow-sm">
            <button
              onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
              className="flex items-center gap-1.5 pl-3.5 pr-2 py-2 text-xs font-semibold text-foreground hover:text-primary transition-colors border-r border-border/70"
            >
              <span className="capitalize">{searchBy}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <div className="relative flex-1 flex items-center">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2.5" />
              <Input
                placeholder={`Search by name, department or location…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 border-0 bg-transparent pl-8 pr-3 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Search Type Dropdown Menu */}
          {searchDropdownOpen && (
            <div className="absolute top-11 left-0 z-50 w-44 rounded-xl border border-border/80 bg-popover p-2 shadow-xl animate-in fade-in-50 zoom-in-95">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 block">
                Search By
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => { setSearchBy('people'); setSearchDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    searchBy === 'people' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${searchBy === 'people' ? 'bg-primary' : 'border border-muted-foreground'}`} />
                  People
                </button>
                <button
                  onClick={() => { setSearchBy('department'); setSearchDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    searchBy === 'department' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${searchBy === 'department' ? 'bg-primary' : 'border border-muted-foreground'}`} />
                  Department
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 4 Main Tabs: MY 1-1, UPDATES, REGULAR FEEDBACK, REVIEWS (Exact matching screenshot) ─── */}
      <div className="border-b border-border/70">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto pb-1">
          {[
            { id: 'my_1_1', label: 'MY 1-1', icon: Users, count: oneOnOnes.filter(o => o.status === 'upcoming').length },
            { id: 'updates', label: 'UPDATES', icon: TrendingUp, count: goalUpdates.length },
            { id: 'feedback', label: 'REGULAR FEEDBACK', icon: MessageSquare, count: feedbackList.length },
            { id: 'reviews', label: 'REVIEWS', icon: Award, count: appraisalCycles.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`relative pb-3 pt-1 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB 1: MY 1-1 ─── */}
      {activeTab === 'my_1_1' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">One-on-One Check-Ins</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Bi-weekly syncs with your manager for mentorship, blockers, and alignment</p>
            </div>
            <Button 
              onClick={() => setSchedule11Open(true)}
              className="bg-gradient-to-r from-primary to-indigo-600 font-semibold text-xs gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule 1-on-1
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {oneOnOnes.map((item) => (
              <Card key={item.id} className="p-5 border-border/70 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {item.manager_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{item.manager_name}</h4>
                      <p className="text-[11px] text-muted-foreground font-medium">{item.scheduled_date} · {item.time_slot}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`capitalize text-[11px] ${
                    item.status === 'upcoming' 
                      ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  }`}>
                    {item.status}
                  </Badge>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-0.5">Agenda:</span>
                    <p className="text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg">{item.agenda}</p>
                  </div>
                  {item.action_items && (
                    <div className="pt-1">
                      <span className="font-semibold text-muted-foreground block mb-1">Action Items:</span>
                      <ul className="space-y-1">
                        {item.action_items.map((act, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-foreground">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.notes && (
                    <div className="pt-1">
                      <span className="font-semibold text-muted-foreground block mb-0.5">Manager Notes:</span>
                      <p className="text-xs text-muted-foreground italic bg-secondary/30 p-2 rounded-md">"{item.notes}"</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: UPDATES (OKRs & Goal Progress) ─── */}
      {activeTab === 'updates' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">Quarterly Goals & Milestones</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Track your key results, deliverables, and weekly progress updates</p>
            </div>
            <Button 
              onClick={() => setAddGoalOpen(true)}
              className="bg-gradient-to-r from-primary to-indigo-600 font-semibold text-xs gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" /> Add Goal Update
            </Button>
          </div>

          <div className="grid gap-4">
            {goalUpdates.map((goal) => (
              <Card key={goal.id} className="p-5 border-border/70 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{goal.category}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{goal.id}</Badge>
                    </div>
                    <h4 className="font-bold text-foreground text-sm sm:text-base mt-0.5">{goal.title}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-primary">{goal.progress}%</span>
                    <p className="text-[11px] text-muted-foreground">Target: {goal.target_value}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2.5 mb-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-border/50 text-muted-foreground">
                  <p><strong className="text-foreground">Latest Update:</strong> {goal.notes}</p>
                  <span className="text-[11px] shrink-0 font-medium">Updated on {goal.last_updated}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Visual Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <Card className="p-5 border-border/70 shadow-sm">
              <h4 className="font-heading font-bold text-sm mb-4">Task Deliverables Breakdown</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={taskBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {taskBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5 border-border/70 shadow-sm">
              <h4 className="font-heading font-bold text-sm mb-4">Attendance & Productivity Consistency</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-xs text-muted-foreground">Task Completion Rate</span>
                  <p className="font-extrabold text-xl text-foreground mt-0.5">{stats.taskRate}%</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-xs text-muted-foreground">Attendance On-Time Rate</span>
                  <p className="font-extrabold text-xl text-emerald-500 mt-0.5">{stats.attendanceRate}%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consistency score calculated based on daily selfie punches, zero unauthorized no-shows, and milestone target delivery.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 3: REGULAR FEEDBACK ─── */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">Continuous 360 Feedback</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time peer recognitions, manager praise, and growth suggestions</p>
            </div>
            <Button 
              onClick={() => setGiveFeedbackOpen(true)}
              className="bg-gradient-to-r from-primary to-indigo-600 font-semibold text-xs gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" /> Give Peer Feedback
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {feedbackList.map((fb) => (
              <Card key={fb.id} className="p-5 border-border/70 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      {fb.from_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{fb.from_name}</h4>
                      <p className="text-[11px] text-muted-foreground">{fb.from_role} · {fb.date}</p>
                    </div>
                  </div>
                  {fb.badge && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px]">
                      {fb.badge}
                    </Badge>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl mb-3 border border-border/40 italic">
                  "{fb.content}"
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {fb.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: REVIEWS (Exact matching screenshot with "WOO!" Empty State & Self-Assessment) ─── */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {appraisalCycles.length === 0 ? (
            /* Exact Empty State matching user screenshot */
            <Card className="p-16 text-center border-border/70 shadow-sm">
              <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                {/* Visual Feedback Paper Icon Illustration */}
                <div className="relative mb-6">
                  <div className="h-24 w-28 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex flex-col items-center justify-center p-3 shadow-inner">
                    <div className="h-2 w-12 bg-muted-foreground/30 rounded-full mb-2" />
                    <div className="h-2 w-16 bg-muted-foreground/20 rounded-full mb-2" />
                    <div className="h-7 w-7 rounded-full border border-muted-foreground/30 flex items-center justify-center text-muted-foreground">
                      <Smile className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-bounce">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>

                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground mb-1 tracking-tight uppercase">
                  WOO!
                </h3>
                
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                  Seems like there are no performance related activities mapped to you
                </p>

                <Button 
                  onClick={() => setSelfReviewOpen(true)}
                  className="bg-gradient-to-r from-primary to-indigo-600 font-semibold text-xs px-6 h-10 shadow-md shadow-primary/20"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Start Annual Self-Assessment
                </Button>
              </div>
            </Card>
          ) : (
            /* Populated Appraisal Cycles View */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">Active Appraisal Cycles</h3>
                  <p className="text-xs text-muted-foreground">Annual performance appraisal reviews and manager evaluation</p>
                </div>
                <Button 
                  onClick={() => setSelfReviewOpen(true)}
                  variant="outline" 
                  size="sm" 
                  className="text-xs font-semibold"
                >
                  Edit Self-Review
                </Button>
              </div>

              {appraisalCycles.map((cycle) => (
                <Card key={cycle.id} className="p-6 border-border/70 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1">
                        Cycle {cycle.period}
                      </Badge>
                      <h4 className="font-heading font-bold text-lg text-foreground">{cycle.cycle_name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Review Status:</span>
                      <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        {cycle.status === 'manager_review' ? 'Pending Manager Review' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground">Self-Assessment Score:</span>
                      <p className="font-extrabold text-base text-primary mt-0.5">{cycle.self_rating} / 5.0 ⭐</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Appraisal Deadline:</span>
                      <p className="font-bold text-foreground mt-0.5">{cycle.deadline}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ─── Schedule 1-on-1 Modal ─── */}
      <Dialog open={schedule11Open} onOpenChange={setSchedule11Open}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Schedule 1-on-1 Check-In
            </DialogTitle>
            <DialogDescription>
              Book a dedicated one-on-one session with your manager or team lead.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate11} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Manager / Mentor</Label>
              <Input required value={new11Manager} onChange={e => setNew11Manager(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date</Label>
                <Input type="date" required value={new11Date} onChange={e => setNew11Date(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Time</Label>
                <Input type="time" required value={new11Time} onChange={e => setNew11Time(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Discussion Agenda & Topics</Label>
              <Textarea 
                required 
                rows={3} 
                placeholder="What topics, sprint blockers, or goals would you like to discuss?…" 
                value={new11Agenda} 
                onChange={e => setNew11Agenda(e.target.value)} 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSchedule11Open(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-indigo-600">
                Confirm Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Add Goal Milestone Modal ─── */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Add Goal Progress Milestone
            </DialogTitle>
            <DialogDescription>
              Update your key results and milestone achievements.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGoal} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Goal Objective Title</Label>
              <Input required placeholder="e.g. Optimize Database Indexes & Query Speed" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={goalCategory} onValueChange={setGoalCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core Engineering">Core Engineering</SelectItem>
                    <SelectItem value="Quality & Reliability">Quality & Reliability</SelectItem>
                    <SelectItem value="Team Leadership">Team Leadership</SelectItem>
                    <SelectItem value="Process & Documentation">Process & Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Current Progress ({goalProgress}%)</Label>
                <Input type="number" min={0} max={100} required value={goalProgress} onChange={e => setGoalProgress(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Milestone Notes & Key Results</Label>
              <Textarea 
                rows={2} 
                placeholder="What progress was achieved this week?…" 
                value={goalNotes} 
                onChange={e => setGoalNotes(e.target.value)} 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddGoalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-indigo-600">
                Save Goal Milestone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Give Peer Feedback Modal ─── */}
      <Dialog open={giveFeedbackOpen} onOpenChange={setGiveFeedbackOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Give Peer Feedback & Praise
            </DialogTitle>
            <DialogDescription>
              Recognize a teammate for their support, quality work, or collaboration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGiveFeedback} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Teammate Name</Label>
              <Input required placeholder="e.g. Rajesh Kumar" value={feedbackTo} onChange={e => setFeedbackTo(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Praise Tag</Label>
              <Select value={feedbackTag} onValueChange={setFeedbackTag}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Team Player">🤝 Team Player</SelectItem>
                  <SelectItem value="High Ownership">🚀 High Ownership</SelectItem>
                  <SelectItem value="Clean Architecture">💻 Clean Architecture</SelectItem>
                  <SelectItem value="Helpful & Supportive">🌟 Helpful & Supportive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Feedback Message</Label>
              <Textarea 
                required 
                rows={3} 
                placeholder="Share constructive appreciation or feedback…" 
                value={feedbackContent} 
                onChange={e => setFeedbackContent(e.target.value)} 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setGiveFeedbackOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-indigo-600">
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Annual Self Assessment Modal ─── */}
      <Dialog open={selfReviewOpen} onOpenChange={setSelfReviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Annual Performance Self-Assessment
            </DialogTitle>
            <DialogDescription>
              Evaluate your technical execution, ownership, and key accomplishments.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSelfReview} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Technical Execution (1-5 ⭐)</Label>
                <Select value={techRating.toString()} onValueChange={val => setTechRating(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5.0 (Exceptional)</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 4.0 (Exceeds Expectations)</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 3.0 (Meets Expectations)</SelectItem>
                    <SelectItem value="2">⭐⭐ 2.0 (Needs Improvement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Team Ownership (1-5 ⭐)</Label>
                <Select value={teamRating.toString()} onValueChange={val => setTeamRating(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5.0 (Leader)</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 4.0 (Proactive)</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 3.0 (Reliable)</SelectItem>
                    <SelectItem value="2">⭐⭐ 2.0 (Developing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Key Accomplishments & Impact</Label>
              <Textarea 
                required 
                rows={3} 
                placeholder="Detail key projects delivered, metrics moved, or operational efficiencies created…" 
                value={accomplishments} 
                onChange={e => setAccomplishments(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Growth Goals for Next Cycle</Label>
              <Textarea 
                rows={2} 
                placeholder="Skills, certifications, or leadership responsibilities you plan to develop…" 
                value={growthGoals} 
                onChange={e => setGrowthGoals(e.target.value)} 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSelfReviewOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-indigo-600">
                Submit Self Assessment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
