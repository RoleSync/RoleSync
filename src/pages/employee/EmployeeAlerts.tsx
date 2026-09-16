import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, CheckCircle2, Clock, FileText, ShieldAlert, Sparkles, 
  Smile, AlertTriangle, Check, X, ArrowRight, ShieldCheck, 
  FileCheck2, Calendar as CalendarIcon, UserCheck, DollarSign, 
  Award, Trash2, Archive, HelpCircle, Eye, ExternalLink, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MainTab = 'notifications' | 'actions';
type ActionSubTab = 'pending' | 'archived';
type NotificationSubTab = 'all' | 'unread' | 'system' | 'broadcasts';

interface ActionItem {
  id: string;
  title: string;
  category: 'Policy & Compliance' | 'Tax & Finance' | 'Performance' | 'Approvals' | 'Tasks';
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

  // Navigation State
  const [mainTab, setMainTab] = useState<MainTab>('notifications');
  const [actionSubTab, setActionSubTab] = useState<ActionSubTab>('pending');
  const [notifSubTab, setNotifSubTab] = useState<NotificationSubTab>('all');
  const [loading, setLoading] = useState(true);

  // Actions Data State
  const [actionList, setActionList] = useState<ActionItem[]>([]);

  // Notifications Data State
  const [notifList, setNotifList] = useState<NotificationItem[]>([]);

  // Fetch live alerts and tasks from Supabase
  useEffect(() => {
    async function loadAlerts() {
      if (!user?.id || !user?.companyId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const [msgRes, taskRes, leaveRes] = await Promise.all([
          supabase.from('admin_messages')
            .select('*')
            .eq('company_id', user.companyId)
            .or(`receiver_id.eq.${user.id},is_broadcast.eq.true`)
            .order('created_at', { ascending: false })
            .limit(20),
          supabase.from('tasks')
            .select('*')
            .eq('assigned_to', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase.from('leaves')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        const messages = msgRes.data || [];
        const tasks = taskRes.data || [];
        const leaves = leaveRes.data || [];

        // Map messages to notifications
        const liveNotifs: NotificationItem[] = messages.map(m => ({
          id: m.id,
          title: m.subject || (m.is_broadcast ? 'Company Announcement' : 'Direct Message'),
          description: m.body,
          category: m.is_broadcast ? 'broadcasts' : 'system',
          created_at: new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          read: !!m.read_at,
          icon: m.is_broadcast ? Sparkles : Bell,
          iconColor: m.is_broadcast ? 'text-indigo-500' : 'text-primary'
        }));

        // Append leaves updates as system notifications
        leaves.forEach(l => {
          liveNotifs.push({
            id: `leave-${l.id}`,
            title: `Leave Request ${l.status.toUpperCase()}`,
            description: `Your ${l.leave_type || 'leave'} request from ${l.start_date} to ${l.end_date} is ${l.status}.`,
            category: 'system',
            created_at: new Date(l.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            read: true,
            icon: l.status === 'approved' ? CheckCircle2 : l.status === 'rejected' ? AlertTriangle : Clock,
            iconColor: l.status === 'approved' ? 'text-emerald-500' : l.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'
          });
        });

        setNotifList(liveNotifs);

        // Map pending tasks to action items
        const liveActions: ActionItem[] = tasks.map(t => ({
          id: t.id,
          title: t.title,
          category: 'Tasks',
          description: t.description || 'Assigned task awaiting completion.',
          deadline: t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No deadline',
          priority: t.priority === 'urgent' || t.priority === 'high' ? 'urgent' : t.priority === 'medium' ? 'medium' : 'low',
          status: t.status === 'completed' ? 'archived' : 'pending',
          action_label: t.status === 'completed' ? 'Completed' : 'Complete Task'
        }));

        setActionList(liveActions);
      } catch (err) {
        console.error('Error loading live alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, [user?.id, user?.companyId]);

  // Action Handlers
  const handleCompleteAction = async (actionId: string, label: string) => {
    setActionList(prev => prev.map(a => a.id === actionId ? { ...a, status: 'archived' } : a));
    try {
      await supabase.from('tasks').update({ status: 'completed' }).eq('id', actionId);
    } catch {}
    toast.success(`Action "${label}" completed successfully!`, {
      description: "Moved to Archived actions list."
    });
  };

  const handleMarkAllRead = async () => {
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
                  All Clear
                </h3>
                
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {actionSubTab === 'archived' 
                    ? 'No archived actions to display.'
                    : 'No pending actions right now. You\'re up to date.'}
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
