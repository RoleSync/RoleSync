import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, CheckCircle2, Clock, FileText, ShieldAlert, Sparkles, 
  Smile, AlertTriangle, Check, X, ArrowRight, ShieldCheck, 
  FileCheck2, Calendar as CalendarIcon, UserCheck, DollarSign, 
  Award, Trash2, Archive, HelpCircle, Eye, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type MainTab = 'notifications' | 'actions';
type ActionSubTab = 'pending' | 'archived';
type NotificationSubTab = 'all' | 'unread' | 'system' | 'broadcasts';

interface ActionItem {
  id: string;
  title: string;
  category: 'Policy & Compliance' | 'Tax & Finance' | 'Performance' | 'Approvals';
  description: string;
  deadline: string;
  priority: 'urgent' | 'medium' | 'low';
  status: 'pending' | 'archived';
  action_label: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: 'system' | 'broadcasts' | 'kudos' | 'attendance' | 'payroll';
  created_at: string;
  read: boolean;
  icon: any;
  iconColor: string;
}

export default function EmployeeAlerts() {
  const { user } = useAuth();

  // Navigation State (Matching screenshot)
  const [mainTab, setMainTab] = useState<MainTab>('actions');
  const [actionSubTab, setActionSubTab] = useState<ActionSubTab>('archived');
  const [notifSubTab, setNotifSubTab] = useState<NotificationSubTab>('all');

  // Actions Data State
  const [actionList, setActionList] = useState<ActionItem[]>([
    {
      id: 'ACT-101',
      title: 'Acknowledge Information Security & Data Protection Policy 2026',
      category: 'Policy & Compliance',
      description: 'Annual mandatory sign-off on enterprise SOC-2 & confidentiality policies.',
      deadline: '25-Mar-2026',
      priority: 'urgent',
      status: 'pending',
      action_label: 'Sign & Acknowledge'
    },
    {
      id: 'ACT-102',
      title: 'Submit Investment Declarations & Rent Receipts (Form 12BB)',
      category: 'Tax & Finance',
      description: 'Upload proof of investments for EPF, 80C, 80D, and HRA tax exemptions.',
      deadline: '28-Mar-2026',
      priority: 'urgent',
      status: 'pending',
      action_label: 'Upload Proofs'
    },
    {
      id: 'ACT-103',
      title: 'Complete Q1 2026 Annual Self-Assessment Review',
      category: 'Performance',
      description: 'Submit your self-ratings and key technical milestones for managerial review.',
      deadline: '31-Mar-2026',
      priority: 'medium',
      status: 'pending',
      action_label: 'Fill Assessment'
    }
  ]);

  // Notifications Data State
  const [notifList, setNotifList] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Leave Request Approved',
      description: 'Your Casual Leave request for 20-Mar-2026 has been approved by your manager.',
      category: 'system',
      created_at: '10 minutes ago',
      read: false,
      icon: CheckCircle2,
      iconColor: 'text-emerald-500'
    },
    {
      id: 'notif-2',
      title: 'New Kudos Recognition Received! ⭐',
      description: 'Priya Sharma awarded you the "Star Performer" badge on the company Intranet wall.',
      category: 'kudos',
      created_at: '1 hour ago',
      read: false,
      icon: Award,
      iconColor: 'text-amber-500'
    },
    {
      id: 'notif-3',
      title: 'Referral Drive Bonus Announced 🚀',
      description: 'Earn up to ₹50,000 for referring senior frontend and backend engineers.',
      category: 'broadcasts',
      created_at: 'Yesterday',
      read: true,
      icon: Sparkles,
      iconColor: 'text-indigo-500'
    },
    {
      id: 'notif-4',
      title: 'March 2026 Payslip Ready for Download 📄',
      description: 'Your monthly salary payslip has been generated with statutory EPF & ESI breakdown.',
      category: 'payroll',
      created_at: '2 days ago',
      read: true,
      icon: DollarSign,
      iconColor: 'text-sky-500'
    }
  ]);

  // Action Handlers
  const handleCompleteAction = (actionId: string, label: string) => {
    setActionList(prev => prev.map(a => a.id === actionId ? { ...a, status: 'archived' } : a));
    toast.success(`Action "${label}" completed successfully!`, {
      description: "Moved to Archived actions list."
    });
  };

  const handleMarkAllRead = () => {
    setNotifList(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const handleClearNotif = (id: string) => {
    setNotifList(prev => prev.filter(n => n.id !== id));
  };

  // Filtered Actions
  const filteredActions = useMemo(() => {
    return actionList.filter(a => a.status === actionSubTab);
  }, [actionList, actionSubTab]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifList.filter(n => {
      if (notifSubTab === 'unread') return !n.read;
      if (notifSubTab === 'system') return n.category === 'system';
      if (notifSubTab === 'broadcasts') return n.category === 'broadcasts';
      return true;
    });
  }, [notifList, notifSubTab]);

  const pendingActionCount = useMemo(() => actionList.filter(a => a.status === 'pending').length, [actionList]);
  const unreadNotifCount = useMemo(() => notifList.filter(n => !n.read).length, [notifList]);

  return (
    <div className="space-y-6">
      
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System notifications, team recognitions, and actionable tasks requiring your response
          </p>
        </div>
      </div>

      {/* ─── Main Tabs: Notifications vs Actions (Matching screenshot) ─── */}
      <div className="border-b border-border/70">
        <div className="flex gap-8 overflow-x-auto pb-1">
          <button
            onClick={() => setMainTab('notifications')}
            className={`relative pb-3 pt-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              mainTab === 'notifications'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
            {unreadNotifCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-primary/15 text-primary">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('actions')}
            className={`relative pb-3 pt-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              mainTab === 'actions'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Actions
            {pendingActionCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/15 text-amber-600">
                {pendingActionCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Sub-Tab Navigation Bar ─── */}
      {mainTab === 'actions' && (
        <div className="flex gap-6 border-b border-border/40 pb-2">
          <button
            onClick={() => setActionSubTab('pending')}
            className={`text-xs font-semibold uppercase tracking-wider transition-all pb-1 ${
              actionSubTab === 'pending'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending ({pendingActionCount})
          </button>

          <button
            onClick={() => setActionSubTab('archived')}
            className={`text-xs font-semibold uppercase tracking-wider transition-all pb-1 ${
              actionSubTab === 'archived'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Archived
          </button>
        </div>
      )}

      {mainTab === 'notifications' && (
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex gap-4">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadNotifCount})` },
              { id: 'system', label: 'System' },
              { id: 'broadcasts', label: 'Broadcasts' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setNotifSubTab(tab.id as NotificationSubTab)}
                className={`text-xs font-semibold uppercase tracking-wider transition-all pb-1 ${
                  notifSubTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllRead} 
            className="text-xs text-primary hover:text-primary hover:bg-primary/10 h-7"
          >
            Mark all as read
          </Button>
        </div>
      )}

      {/* ─── TAB 1: ACTIONS (Matching screenshot layout) ─── */}
      {mainTab === 'actions' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {filteredActions.length === 0 ? (
            /* Exact Empty State matching user screenshot */
            <Card className="p-16 text-center border-border/70 shadow-sm min-h-[360px] flex flex-col items-center justify-center bg-card">
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

                <h3 className="font-heading font-extrabold text-xl text-foreground mb-1 tracking-tight uppercase">
                  WOO!
                </h3>
                
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {actionSubTab === 'archived' 
                    ? 'Seems like there are no pending action notifications for you'
                    : 'You have cleared all pending action items. Great job!'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredActions.map(action => (
                <Card key={action.id} className="p-5 border-border/70 shadow-sm bg-card hover:border-primary/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                          {action.category}
                        </Badge>
                        {action.priority === 'urgent' && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            Urgent · Due {action.deadline}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-foreground text-sm sm:text-base">{action.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteAction(action.id, action.action_label)}
                        className="bg-gradient-to-r from-primary to-indigo-600 font-semibold text-xs h-9 px-4 shadow-sm gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {action.action_label}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ─── TAB 2: NOTIFICATIONS ─── */}
      {mainTab === 'notifications' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center border-border/70 shadow-sm">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Bell className="h-7 w-7" />
              </div>
              <h4 className="font-bold text-foreground text-sm">No Notifications Found</h4>
              <p className="text-xs text-muted-foreground mt-1">You are all caught up with your updates!</p>
            </Card>
          ) : (
            filteredNotifications.map(notif => (
              <Card 
                key={notif.id} 
                className={`p-4 border-border/70 shadow-sm transition-colors ${
                  !notif.read ? 'bg-primary/5 border-primary/30' : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-background border border-border/60 shrink-0 mt-0.5">
                      <notif.icon className={`h-4 w-4 ${notif.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-foreground text-xs sm:text-sm">{notif.title}</h5>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.description}</p>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 block">{notif.created_at}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleClearNotif(notif.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

    </div>
  );
}
