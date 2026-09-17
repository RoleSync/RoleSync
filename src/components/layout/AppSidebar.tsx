import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Clock, CheckSquare, CalendarDays, TrendingUp,
  User, Users, FileBarChart, Settings, Building2, Globe, Target, MapPin,
  Award, MessageSquare, LifeBuoy, ToggleLeft, GitBranch, Megaphone, Mail, HeartPulse, DollarSign, Shield, IdCard,
  ArrowLeftRight, Receipt, UserMinus, Bell, BookOpen
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { RoleSyncLogo } from '@/components/RoleSyncLogo';

export function AppSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { features, plan: livePlan, loading } = useCompanyFeatures();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  
  const plan = livePlan || user?.company?.planType || 'basic';
  const isPro = plan === 'pro' || plan === 'enterprise';
  const isEnterprise = plan === 'enterprise';

  const [viewMode, setViewMode] = useState<'admin' | 'employee'>(() => {
    if (user?.role === 'employee') return 'employee';
    return (localStorage.getItem('sidebar_view_mode') as any) || 'admin';
  });

  useEffect(() => {
    if (user?.role === 'employee') {
      setViewMode('employee');
    }
  }, [user?.role]);

  // Strict visibility helper for database-only flags
  const isEnabled = (key: keyof typeof features) => {
    if (loading) return false;
    return !!features?.[key];
  };

  const slug = user?.company?.slug;
  const prefix = slug ? `/${slug}` : '';

  const employeeMenu = [
    { title: 'Dashboard', url: `${prefix}/employee`, icon: LayoutDashboard, show: true },
    { title: 'My Leave', url: `${prefix}/employee/leave`, icon: CalendarDays, show: isEnabled('leave_management_enabled') },
    { title: 'My Attendance', url: `${prefix}/employee/attendance`, icon: Clock, show: true },
    { title: 'My Compensation', url: `${prefix}/employee/compensation`, icon: DollarSign, show: isEnabled('compensation_enabled') },
    { title: 'My Expenses', url: `${prefix}/employee/expenses`, icon: Receipt, show: isEnabled('travel_expenses_enabled') },
    { title: 'My Performance', url: `${prefix}/employee/performance`, icon: TrendingUp, show: isEnabled('performance_enabled') },
    { title: 'My Separation', url: `${prefix}/employee/separation`, icon: UserMinus, show: isEnabled('separation_enabled') },
    { title: 'Intranet', url: `${prefix}/employee/intranet`, icon: Globe, show: isEnabled('chat_enabled') || isEnabled('kudos_enabled') },
    { title: 'Alerts', url: `${prefix}/employee/alerts`, icon: Bell, show: true },
    { title: 'My Calendar', url: `${prefix}/employee/calendar`, icon: CalendarDays, show: isEnabled('google_calendar_enabled') },
    { title: 'People', url: `${prefix}/employee/people`, icon: Users, show: isEnabled('org_directory_enabled') },
    { title: 'Knowledge Base', url: `${prefix}/employee/knowledge-base`, icon: BookOpen, show: isEnabled('knowledge_base_enabled') },
    { title: 'Tasks', url: `${prefix}/employee/tasks`, icon: CheckSquare, show: isEnabled('tasks_enabled') },
    { title: 'My Targets', url: `${prefix}/employee/targets`, icon: Target, show: isEnabled('performance_enabled') },
    { title: 'Kudos', url: `${prefix}/employee/kudos`, icon: Award, show: isEnabled('kudos_enabled') },
    { title: 'Chat', url: `${prefix}/employee/chat`, icon: MessageSquare, show: isEnabled('chat_enabled') },
    { title: 'Birthdays', url: `${prefix}/employee/birthdays`, icon: CalendarDays, show: isEnabled('birthdays_enabled') },
    { title: 'Office Updates', url: `${prefix}/employee/inbox`, icon: Mail, show: true },
    { title: 'Helpdesk', url: `${prefix}/employee/helpdesk`, icon: LifeBuoy, show: isEnabled('helpdesk_enabled') },
    { title: 'Profile', url: `${prefix}/employee/profile`, icon: User, show: true },
  ].filter(i => i.show);

  const adminMenu = [
    { title: 'Dashboard', url: `${prefix}/admin`, icon: LayoutDashboard, show: true },
    { title: 'Employees', url: `${prefix}/admin/employees`, icon: Users, show: true },
    { title: 'Org Chart & Directory', url: `${prefix}/admin/people`, icon: Users, show: isEnabled('org_directory_enabled') || isEnabled('org_chart_tree_enabled') },
    { title: 'Settings', url: `${prefix}/admin/settings`, icon: Settings, show: true },
    { title: 'Attendance', url: `${prefix}/admin/attendance`, icon: Clock, show: true },
    { title: 'Live Map', url: `${prefix}/admin/live-map`, icon: MapPin, show: isEnabled('mock_gps_detection_enabled') },
    { title: 'Tasks', url: `${prefix}/admin/tasks`, icon: CheckSquare, show: isEnabled('tasks_enabled') },
    { title: 'Targets', url: `${prefix}/admin/targets`, icon: Target, show: isEnabled('performance_enabled') },
    { title: 'Leave Requests', url: `${prefix}/admin/leave`, icon: CalendarDays, show: isEnabled('leave_management_enabled') },
    { title: 'Expense Approvals', url: `${prefix}/admin/expenses`, icon: Receipt, show: isEnabled('travel_expenses_enabled') },
    { title: 'Exit Management', url: `${prefix}/admin/separation`, icon: UserMinus, show: isEnabled('separation_enabled') },
    { title: 'Alerts Center', url: `${prefix}/admin/alerts`, icon: Bell, show: true },
    { title: 'Company Calendar', url: `${prefix}/admin/calendar`, icon: CalendarDays, show: isEnabled('google_calendar_enabled') },
    { title: 'Intranet Wall', url: `${prefix}/admin/intranet`, icon: Globe, show: isEnabled('chat_enabled') || isEnabled('kudos_enabled') },
    { title: 'Helpdesk', url: `${prefix}/admin/helpdesk`, icon: LifeBuoy, show: isEnabled('helpdesk_enabled') },
    { title: 'Chat', url: `${prefix}/admin/chat`, icon: MessageSquare, show: isEnabled('chat_enabled') },
    { title: 'Kudos', url: `${prefix}/admin/kudos`, icon: Award, show: isEnabled('kudos_enabled') },
    { title: 'Birthdays', url: `${prefix}/admin/birthdays`, icon: CalendarDays, show: isEnabled('birthdays_enabled') },
    { title: 'Communication', url: `${prefix}/admin/communication`, icon: Megaphone, show: isEnabled('chat_enabled') || isEnabled('kudos_enabled') },
    { title: 'Wellbeing', url: `${prefix}/admin/wellbeing`, icon: HeartPulse, show: isEnabled('wellbeing_enabled') },
    { title: 'Payroll', url: `${prefix}/admin/payroll`, icon: DollarSign, show: isEnabled('payroll_export_enabled') },
    { title: 'AI Analytics', url: `${prefix}/admin/ai-analytics`, icon: TrendingUp, show: isEnabled('ai_analytics_enabled') },
    { title: 'IP Whitelisting', url: `${prefix}/admin/ip-whitelist`, icon: Globe, show: isEnabled('ip_whitelist_enabled') },
    { title: 'Mock GPS', url: `${prefix}/admin/mock-gps`, icon: MapPin, show: isEnabled('mock_gps_detection_enabled') },
    { title: 'Audit Trail', url: `${prefix}/admin/audit`, icon: Shield, show: isEnabled('ai_analytics_enabled') || isEnterprise },
    { title: 'Permissions', url: `${prefix}/admin/permissions`, icon: Shield, show: true },
    { title: 'Corrections', url: `${prefix}/admin/corrections`, icon: Clock, show: isEnabled('attendance_regularization_enabled') },
    { title: 'Approval Chain', url: `${prefix}/admin/approval-chain`, icon: GitBranch, show: isEnabled('multi_level_approvals_enabled') },
    { title: 'Reports', url: `${prefix}/admin/reports`, icon: FileBarChart, show: true },
    { title: 'Features', url: `${prefix}/admin/features`, icon: ToggleLeft, show: true },
  ].filter(i => i.show);

  const superAdminMenu = [
    { title: 'Dashboard', url: '/super-admin', icon: LayoutDashboard },
    { title: 'Companies', url: '/super-admin/companies', icon: Globe },
    { title: 'Settings', url: `${prefix}/admin/settings`, icon: Settings },
    { title: 'My Company', url: `${prefix}/admin`, icon: Building2 },
  ];

  const menu = user?.role === 'super_admin' 
    ? superAdminMenu
    : (user?.role === 'admin' || user?.isOwner) 
      ? (viewMode === 'admin' ? adminMenu : employeeMenu) 
      : employeeMenu;


  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="gap-2 px-1 mb-6 h-auto py-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.company?.logoUrl ? (
                <img src={supabase.storage.from('company-assets').getPublicUrl(user.company.logoUrl).data.publicUrl} alt="Logo" className="object-contain h-full w-full" />
              ) : (
                <RoleSyncLogo size={40} showText={false} />
              )}
            </div>
            {!collapsed && (
              <span className="font-heading font-bold text-primary truncate">
                {user?.company?.name ?? 'RoleSync Hub'}
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Real Logged-in Staff Member Details */}
            {!collapsed && user && (
              <div className="px-3 py-2.5 mb-2 mx-1 rounded-2xl bg-muted/30 border flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name?.charAt(0)?.toUpperCase() ?? 'U'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate text-foreground leading-tight">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.jobTitle || (user.role === 'admin' ? 'Administrator' : 'Employee')}</p>
                  <p className="text-[10px] text-primary font-medium truncate">{user.department || user.company?.name || 'RoleSync'}</p>
                </div>
              </div>
            )}

            {/* View Switcher for Admins/Owners */}
            {(user?.role === 'admin' || user?.isOwner) && !collapsed && (
              <div className="px-3 py-2 mb-2 border-b">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between hover:bg-primary/5 border-primary/20 text-xs font-semibold"
                  onClick={() => {
                    const nextMode = viewMode === 'admin' ? 'employee' : 'admin';
                    setViewMode(nextMode);
                    localStorage.setItem('sidebar_view_mode', nextMode);
                    navigate(nextMode === 'admin' ? `${prefix}/admin` : `${prefix}/employee`);
                  }}
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    Mode: <span className="text-primary font-bold">{viewMode === 'admin' ? 'Admin Portal' : 'Employee Portal'}</span>
                  </span>
                  <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                </Button>
              </div>
            )}
            
            {/* Collapsed simple icon toggle */}
            {(user?.role === 'admin' || user?.isOwner) && collapsed && (
              <div className="flex justify-center py-2 mb-2 border-b">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-primary hover:bg-primary/10"
                  title={viewMode === 'admin' ? 'Switch to Employee Portal' : 'Switch to Admin Portal'}
                  onClick={() => {
                    const nextMode = viewMode === 'admin' ? 'employee' : 'admin';
                    setViewMode(nextMode);
                    localStorage.setItem('sidebar_view_mode', nextMode);
                    navigate(nextMode === 'admin' ? '/admin' : '/employee');
                  }}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>
            )}

             <SidebarMenu>
              {menu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin' || item.url === '/employee' || item.url === '/super-admin'}
                      className="hover:bg-sidebar-accent/50 group flex items-center w-full px-3 py-2 rounded-md transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-primary shadow-sm"
                    >
                      <item.icon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
                      {!collapsed && <span className="group-hover:translate-x-0.5 transition-transform duration-200">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 bg-sidebar-accent/20">
        {!collapsed ? (
          <div className="flex flex-col gap-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            {user?.employeeId && (
              <p className="text-[10px] font-mono text-primary flex items-center gap-1">
                <IdCard className="h-3 w-3" /> {user.employeeId}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
