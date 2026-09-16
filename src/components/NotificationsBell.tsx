import { useState } from 'react';
import { Bell, CalendarCheck, CalendarX, Target, CheckCircle2, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useUserNotifications, UserNotification } from '@/hooks/useUserNotifications';

const iconFor = (type: string) => {
  if (type === 'leave_approved') return CalendarCheck;
  if (type === 'leave_rejected') return CalendarX;
  if (type === 'target_assigned') return Target;
  if (type?.includes('attendance') || type?.includes('penalty')) return ShieldAlert;
  return Bell;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsBell() {
  const { items, unread, markRead, markAllRead } = useUserNotifications();
  const [activeTab, setActiveTab] = useState<'notifications' | 'actions'>('notifications');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  function open(n: UserNotification) {
    if (!n.read) markRead(n.id);
    if (n.link) {
      setIsOpen(false);
      navigate(n.link);
    }
  }

  // Sample pending actions for the Actions tab
  const sampleActions = [
    {
      id: 'act-1',
      title: 'Regularize Attendance (12-Sep)',
      desc: 'No-show warning. Regularize before payroll lock.',
      deadline: 'Due Today',
      link: '/employee/attendance'
    },
    {
      id: 'act-2',
      title: 'Quarterly Review Self-Assessment',
      desc: 'Q3 Goal Evaluation & Self-Rating.',
      deadline: 'In 3 Days',
      link: '/employee/performance'
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-84 sm:w-96 p-0 shadow-xl rounded-2xl border border-border/80 bg-card overflow-hidden">
        {/* Header Tabs: Notifications vs Actions */}
        <div className="border-b bg-muted/30 flex items-center justify-between px-2 pt-2">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'notifications'
                  ? 'border-primary text-primary bg-card font-bold shadow-sm'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Notifications {unread > 0 && `(${unread})`}
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'actions'
                  ? 'border-primary text-primary bg-card font-bold shadow-sm'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Actions
            </button>
          </div>

          {activeTab === 'notifications' && unread > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary" onClick={markAllRead}>
              Mark read
            </Button>
          )}
        </div>

        {/* Tab 1: Notifications List */}
        {activeTab === 'notifications' && (
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center space-y-1">
                <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto opacity-70" />
                <p className="text-xs font-semibold text-foreground">All Clear</p>
                <p className="text-[11px] text-muted-foreground">No new notifications right now.</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => open(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border/40 last:border-0 flex items-start gap-3 transition-colors ${
                      !n.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                      {n.body && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Actions List */}
        {activeTab === 'actions' && (
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {sampleActions.map((act) => (
              <div key={act.id} className="p-3.5 hover:bg-muted/40 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-foreground leading-tight">{act.title}</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{act.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/20 shrink-0">
                    {act.deadline}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-7 gap-1 font-semibold"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(act.link);
                  }}
                >
                  Take Action <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Footer Link */}
        <div className="p-2.5 border-t bg-muted/20 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-primary font-semibold hover:bg-primary/10 h-7"
            onClick={() => {
              setIsOpen(false);
              navigate('/employee/alerts');
            }}
          >
            See All Notifications & Actions →
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
