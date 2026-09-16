import React, { createContext, useContext, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, UserCheck, CalendarDays, AlertTriangle, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAdminNotifications, NotificationItem } from '@/hooks/useAdminNotifications';
import { useTheme } from '@/hooks/useTheme';
import { NotificationsBell } from '@/components/NotificationsBell';

export const DashboardLayoutContext = createContext<boolean>(false);

const iconFor = (kind: NotificationItem['kind']) => {
  if (kind === 'pending_employee') return UserCheck;
  if (kind === 'pending_leave') return CalendarDays;
  return AlertTriangle;
};

function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getPrimaryForeground(hex: string): string {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const L = getRelativeLuminance(r, g, b);
  return L > 0.179 ? '212 60% 12%' : '0 0% 100%';
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isNested = useContext(DashboardLayoutContext);

  if (isNested) {
    return <>{children}</>;
  }

  const { user, logout } = useAuth();
  const [searchScope, setSearchScope] = useState<'people' | 'department'>('people');
  const [helpTextVisible, setHelpTextVisible] = useState(() => localStorage.getItem('help_text_visible') !== 'false');
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?';
  const { items, count } = useAdminNotifications();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const showAdminNotifications = user?.role === 'admin' || user?.role === 'super_admin' || user?.isOwner;
  const showUserNotifications = !!user;

  const profilePath =
    user?.role === 'employee' && !user?.isOwner ? '/employee/profile'
    : (user?.role === 'admin' || user?.isOwner) ? '/admin/settings'
    : '/super-admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const themeColor = user?.company?.themeColor || '#6366F1';
  const primaryHsl = hexToHsl(themeColor);
  const primaryForegroundHsl = getPrimaryForeground(themeColor);

  return (
    <DashboardLayoutContext.Provider value={true}>
      <SidebarProvider>
      <div 
        className="min-h-screen flex w-full" 
        style={{ 
          '--primary': primaryHsl,
          '--primary-foreground': primaryForegroundHsl
        } as any}
      >
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xl mx-2">
              <SidebarTrigger />
              {/* Global Entity Search Bar (Screenshot 32) */}
              <div className="hidden md:flex items-center flex-1 relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="h-8 px-2.5 rounded-l-lg border border-r-0 bg-muted/40 hover:bg-muted text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0 transition-colors">
                      {searchScope === 'people' ? 'People' : 'Department'}
                      <span className="text-[10px] opacity-70">▼</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-40 p-2 text-xs space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Search By</p>
                    <button 
                      onClick={() => setSearchScope('people')} 
                      className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between ${searchScope === 'people' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted'}`}
                    >
                      <span>People</span>
                      {searchScope === 'people' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                    <button 
                      onClick={() => setSearchScope('department')} 
                      className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between ${searchScope === 'department' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted'}`}
                    >
                      <span>Department</span>
                      {searchScope === 'department' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  </PopoverContent>
                </Popover>

                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={`Search by ${searchScope === 'people' ? 'name or employee code' : 'department or team'}…`}
                    className="w-full h-8 pl-3 pr-8 rounded-r-lg border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigate('/employee/people');
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {showUserNotifications && <NotificationsBell />}
              {showAdminNotifications && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" aria-label="Admin queue">
                      <AlertTriangle className="h-4 w-4" />
                      {count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center">
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <h4 className="font-heading font-semibold">Admin Queue</h4>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">All caught up. No pending requests.</p>
                      ) : (
                        items.map((n) => {
                          const Icon = iconFor(n.kind);
                          return (
                            <button key={n.id} onClick={() => navigate(n.href)}
                              className="w-full text-left px-4 py-3 hover:bg-accent border-b last:border-0 flex items-start gap-3">
                              <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* User Profile Dropdown Menu (Screenshot 48) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-hidden" aria-label="Account menu">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary-foreground">{initial}</span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl rounded-2xl border">
                  <div className="p-3 bg-muted/30 rounded-xl mb-1.5">
                    <p className="font-bold text-sm text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate font-normal">{user?.email}</p>
                    <button 
                      onClick={() => navigate(profilePath)} 
                      className="mt-2 text-xs font-semibold text-primary hover:underline block"
                    >
                      View Profile →
                    </button>
                  </div>
                  
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate(profilePath)} className="py-2 cursor-pointer text-xs font-medium">
                    <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                    My Account Settings
                  </DropdownMenuItem>

                  {/* Help Text Visible UX Switch (Screenshot 48) */}
                  <div className="px-2 py-2 flex items-center justify-between text-xs text-foreground font-medium rounded-lg hover:bg-muted/40">
                    <span className="text-muted-foreground">Help Text Visible</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={helpTextVisible}
                      onClick={() => {
                        const next = !helpTextVisible;
                        setHelpTextVisible(next);
                        localStorage.setItem('help_text_visible', next ? 'true' : 'false');
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        helpTextVisible ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          helpTextVisible ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout} className="py-2 cursor-pointer text-xs text-destructive focus:text-destructive font-medium">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
    </DashboardLayoutContext.Provider>
  );
}
