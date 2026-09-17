import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { 
  Users, GitBranch, Search, Filter, RotateCcw, Eye, Network, 
  Mail, Phone, MapPin, Building2, User, ChevronRight, ChevronLeft, 
  ChevronUp, ChevronDown, UserCheck, MessageSquare, ExternalLink,
  Briefcase, Calendar as CalendarIcon, Sparkles, CheckCircle2, Loader2, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ActiveTab = 'org_chart' | 'directory';

export interface EmployeeRecord {
  id: string;
  name: string;
  designation: string;
  department: string;
  reporting_manager: string;
  reporting_manager_id?: string | null;
  work_email: string;
  phone: string;
  location: string;
  joined_date: string;
  avatar_initials: string;
  avatar_url?: string | null;
  direct_reports_count?: number;
  is_owner?: boolean;
  status?: string;
  employee_internal_id?: string | null;
}

function getInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return 'EM';
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function EmployeePeople() {
  const { user } = useAuth();
  const { features } = useCompanyFeatures();
  const { companySlug } = useParams<{ companySlug?: string }>();
  const navigate = useNavigate();

  const showOrgChart = !!features?.org_chart_tree_enabled;

  // Active Tab: 'org_chart' | 'directory'
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => (showOrgChart ? 'org_chart' : 'directory'));

  // Directory Filters & Search State
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name_asc');

  // Org Chart Selected Focus Manager
  const [focusedManagerId, setFocusedManagerId] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Profile Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);

  // Real Database State
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCompanyName, setCurrentCompanyName] = useState<string>('');

  const slug = companySlug || user?.company?.slug;
  const prefix = slug ? `/${slug}` : '';

  // Load Real Company Profiles from Supabase
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      let targetCompanyId: string | null = null;
      let targetCompanyName = user?.company?.name || 'Main Office';
      let targetOwnerId: string | null = null;

      // 1. Resolve company by URL slug first (e.g. /technoml/admin/people)
      if (companySlug) {
        const { data: comp } = await supabase
          .from('companies')
          .select('id, name, owner_id')
          .eq('slug', companySlug)
          .maybeSingle();

        if (comp) {
          targetCompanyId = comp.id;
          targetCompanyName = comp.name;
          targetOwnerId = comp.owner_id;
        }
      }

      // 2. Fallback to user's company profile
      if (!targetCompanyId) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', currentUserId)
          .maybeSingle() as any;

        targetCompanyId = profData?.company_id || user?.companyId;

        if (targetCompanyId) {
          const { data: comp } = await supabase
            .from('companies')
            .select('owner_id, name')
            .eq('id', targetCompanyId)
            .maybeSingle();
          if (comp) {
            targetOwnerId = comp.owner_id;
            if (comp.name) targetCompanyName = comp.name;
          }
        }
      }

      // 3. Super admin global fallback
      if (!targetCompanyId && user?.role === 'super_admin') {
        const { data: firstComp } = await supabase
          .from('companies')
          .select('id, name, owner_id')
          .limit(1)
          .maybeSingle();
        if (firstComp) {
          targetCompanyId = firstComp.id;
          targetCompanyName = firstComp.name;
          targetOwnerId = firstComp.owner_id;
        }
      }

      setCurrentCompanyName(targetCompanyName);

      // 4. Fetch all profiles for this company (using only existing columns)
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, department, job_title, status, employee_internal_id, created_at, avatar_url, address');

      if (targetCompanyId) {
        query = query.eq('company_id', targetCompanyId);
      }
      const { data: profiles, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase profiles query error:', error);
        throw error;
      }

      const rawList = profiles || [];
      if (rawList.length === 0) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      // 5. Fetch user roles to structure reporting hierarchy
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', rawList.map(p => p.id));

      const roleMap = new Map((rolesData || []).map(r => [r.user_id, r.role]));
      const profMap = new Map(rawList.map(p => [p.id, p]));
      const ownerProf = targetOwnerId ? profMap.get(targetOwnerId) : null;
      const adminList = rawList.filter(p => p.id !== targetOwnerId && roleMap.get(p.id) === 'admin');

      // 6. Map to clean EmployeeRecord with hierarchical reporting relationships
      const records: EmployeeRecord[] = rawList.map(p => {
        const isOwner = p.id === targetOwnerId;
        const userRole = roleMap.get(p.id) || 'employee';
        let reportingManagerName = 'Executive Leadership';
        let reportingManagerId: string | null = null;

        if (isOwner) {
          reportingManagerName = 'Company Owner / Board';
          reportingManagerId = null;
        } else if (userRole === 'admin') {
          reportingManagerName = ownerProf?.full_name || ownerProf?.email || 'Company Owner';
          reportingManagerId = targetOwnerId;
        } else {
          // Employee / Staff
          const deptAdmin = adminList.find(a => a.department && a.department === p.department) || adminList[0];
          if (deptAdmin) {
            reportingManagerName = deptAdmin.full_name || deptAdmin.email;
            reportingManagerId = deptAdmin.id;
          } else if (ownerProf) {
            reportingManagerName = ownerProf.full_name || ownerProf.email;
            reportingManagerId = targetOwnerId;
          }
        }

        return {
          id: p.id,
          name: p.full_name || p.email.split('@')[0],
          designation: p.job_title || (isOwner ? 'Company Administrator' : userRole === 'admin' ? 'Operations Admin' : 'Staff Member'),
          department: p.department || 'General',
          reporting_manager: reportingManagerName,
          reporting_manager_id: reportingManagerId,
          work_email: p.email,
          phone: p.phone || '—',
          location: p.address || targetCompanyName,
          joined_date: formatDate(p.created_at),
          avatar_initials: getInitials(p.full_name, p.email),
          avatar_url: p.avatar_url,
          direct_reports_count: 0,
          is_owner: isOwner,
          status: p.status,
          employee_internal_id: p.employee_internal_id,
        };
      });

      // 7. Calculate direct reports count
      const reportsCount = new Map<string, number>();
      records.forEach(r => {
        if (r.reporting_manager_id) {
          reportsCount.set(r.reporting_manager_id, (reportsCount.get(r.reporting_manager_id) || 0) + 1);
        }
      });
      records.forEach(r => {
        r.direct_reports_count = reportsCount.get(r.id) || 0;
      });

      setEmployees(records);

      // Default focused manager in Org Chart to Owner or first manager/user
      if (records.length > 0) {
        const defaultFocus = records.find(r => r.is_owner) || records.find(r => (r.direct_reports_count || 0) > 0) || records[0];
        setFocusedManagerId(prev => prev && records.some(r => r.id === prev) ? prev : defaultFocus.id);
      }
    } catch (err: any) {
      console.error('Failed to load employee directory:', err);
      toast.error('Failed to load company directory');
    } finally {
      setLoading(false);
    }
  }, [companySlug, user?.companyId, user?.company?.name, user?.role]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Distinct Departments from Real Data
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => {
      if (emp.department && emp.department.trim()) {
        depts.add(emp.department.trim());
      }
    });
    return Array.from(depts);
  }, [employees]);

  // Filtered & Sorted Directory
  const filteredDirectory = useMemo(() => {
    return employees.filter(emp => {
      if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
      if (searchName.trim()) {
        const term = searchName.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(term);
        const matchesEmail = emp.work_email.toLowerCase().includes(term);
        const matchesDesignation = emp.designation.toLowerCase().includes(term);
        const matchesCode = emp.employee_internal_id ? emp.employee_internal_id.toLowerCase().includes(term) : false;
        if (!matchesName && !matchesEmail && !matchesDesignation && !matchesCode) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'dept') return a.department.localeCompare(b.department);
      return 0;
    });
  }, [employees, selectedDept, searchName, sortBy]);

  // Focused Manager and Direct Reports for Org Chart
  const currentFocusedManager = useMemo(() => {
    if (employees.length === 0) return null;
    return employees.find(e => e.id === focusedManagerId) || employees[0];
  }, [employees, focusedManagerId]);

  const directReports = useMemo(() => {
    if (!currentFocusedManager) return [];
    return employees.filter(e => 
      e.id !== currentFocusedManager.id && 
      (e.reporting_manager_id === currentFocusedManager.id || e.reporting_manager === currentFocusedManager.name)
    );
  }, [employees, currentFocusedManager]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedDept('all');
    setSearchName('');
    setSortBy('name_asc');
    toast.info("Directory filters reset.");
  };

  // Switch to Org Chart focused on specific employee
  const handleJumpToOrgChart = (emp: EmployeeRecord) => {
    if (emp.reporting_manager_id && employees.some(e => e.id === emp.reporting_manager_id)) {
      setFocusedManagerId(emp.reporting_manager_id);
    } else {
      setFocusedManagerId(emp.id);
    }
    setActiveTab('org_chart');
    toast.success(`Centered Org Chart around ${emp.name}`);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" />
            <span>People & Org Chart</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentCompanyName ? `${currentCompanyName} · ` : ''}Reporting hierarchy and active employee directory
          </p>
        </div>

        {user?.role === 'admin' || user?.isOwner || user?.role === 'super_admin' ? (
          <Button 
            onClick={() => navigate(`${prefix}/admin/employees`)}
            className="gap-2 self-start sm:self-auto"
            size="sm"
          >
            <Shield className="h-4 w-4" /> Manage Employees
          </Button>
        ) : null}
      </div>

      {/* ─── Main Tabs: Organization Chart vs Organization Directory ─── */}
      <div className="border-b border-border/70">
        <div className="flex gap-8 overflow-x-auto pb-1">
          {showOrgChart && (
            <button
              onClick={() => setActiveTab('org_chart')}
              className={`relative pb-3 pt-1 text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'org_chart'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Network className="h-4 w-4" />
              Organization Chart
            </button>
          )}

          <button
            onClick={() => setActiveTab('directory')}
            className={`relative pb-3 pt-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'directory' || !showOrgChart
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Organization Directory ({employees.length})
          </button>
        </div>
      </div>

      {loading ? (
        <Card className="p-16 text-center border-border/60">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading company directory…</p>
        </Card>
      ) : (
        <>
          {/* ─── TAB 1: ORGANIZATION CHART ─── */}
          {showOrgChart && activeTab === 'org_chart' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Select Employee Filter Bar */}
              <Card className="p-4 border-border/70 shadow-sm bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="w-full sm:max-w-md space-y-1">
                    <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Select Focus Leader</Label>
                    <Select value={focusedManagerId} onValueChange={setFocusedManagerId}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} — {emp.designation} ({emp.department}) {emp.is_owner ? '👑' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
                      title="Zoom Out"
                    >
                      -
                    </Button>
                    <span className="text-xs font-mono font-semibold text-muted-foreground px-1">{Math.round(zoomLevel * 100)}%</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setZoomLevel(prev => Math.min(1.3, prev + 0.1))}
                      title="Zoom In"
                    >
                      +
                    </Button>
                    {currentFocusedManager?.reporting_manager_id && employees.some(e => e.id === currentFocusedManager.reporting_manager_id) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFocusedManagerId(currentFocusedManager.reporting_manager_id!)}
                        className="h-8 text-xs gap-1 ml-2"
                      >
                        <ChevronUp className="h-3.5 w-3.5" /> Up to Manager
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Interactive Hierarchy Canvas Tree */}
              {currentFocusedManager ? (
                <div 
                  className="p-8 sm:p-12 rounded-3xl border border-border/70 bg-gradient-to-b from-muted/20 via-background to-secondary/10 shadow-inner overflow-x-auto min-h-[480px] flex flex-col items-center justify-start transition-all"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                >
                  
                  {/* Top / Focused Manager Node */}
                  <div className="relative flex flex-col items-center mb-8">
                    <div className="w-64 sm:w-72 p-5 rounded-2xl border border-border/80 bg-card shadow-xl relative hover:border-primary/50 transition-all text-center group">
                      
                      {/* Avatar with count badge */}
                      <div className="relative inline-block mb-3">
                        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary border-2 border-primary/30 flex items-center justify-center font-bold text-lg mx-auto shadow-sm overflow-hidden">
                          {currentFocusedManager.avatar_url ? (
                            <img src={currentFocusedManager.avatar_url} alt={currentFocusedManager.name} className="h-full w-full object-cover" />
                          ) : (
                            currentFocusedManager.avatar_initials
                          )}
                        </div>
                        {directReports.length > 0 && (
                          <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md">
                            {directReports.length}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <h4 className="font-heading font-extrabold text-base text-foreground">
                          {currentFocusedManager.name}
                        </h4>
                        {currentFocusedManager.is_owner && (
                          <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 h-4 border-none">
                            Owner
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-primary font-medium mt-0.5">{currentFocusedManager.designation}</p>
                      <p className="text-[11px] text-muted-foreground">{currentFocusedManager.department}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">Reports to: {currentFocusedManager.reporting_manager}</p>

                      {/* Location Footer Bar */}
                      <div className="mt-4 py-1.5 px-3 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold truncate">
                        {currentFocusedManager.location}
                      </div>
                    </div>

                    {/* Connecting Tree Stem Down */}
                    {directReports.length > 0 && (
                      <div className="h-10 w-0.5 bg-primary/40 mt-0" />
                    )}
                  </div>

                  {/* Direct Reports Row */}
                  {directReports.length > 0 ? (
                    <div className="w-full relative flex flex-col items-center">
                      
                      {/* Horizontal Connecting Crossbar */}
                      {directReports.length > 1 && (
                        <div className="w-[85%] max-w-5xl h-0.5 bg-primary/40 mb-6" />
                      )}

                      {/* Child Nodes Grid */}
                      <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6 max-w-6xl">
                        {directReports.map((report) => (
                          <div
                            key={report.id}
                            className="w-52 sm:w-56 p-4 rounded-2xl border border-border/70 bg-card shadow-lg hover:border-primary/50 hover:shadow-xl transition-all flex flex-col justify-between text-center relative group cursor-pointer"
                            onClick={() => setSelectedEmployee(report)}
                          >
                            <div>
                              {/* Avatar */}
                              <div className="h-12 w-12 rounded-full bg-muted/70 text-foreground border border-border/80 flex items-center justify-center font-bold text-sm mx-auto mb-2.5 overflow-hidden">
                                {report.avatar_url ? (
                                  <img src={report.avatar_url} alt={report.name} className="h-full w-full object-cover" />
                                ) : (
                                  report.avatar_initials
                                )}
                              </div>

                              <h5 className="font-heading font-bold text-sm text-foreground">{report.name}</h5>
                              <p className="text-[11px] text-primary font-medium mt-0.5">{report.designation}</p>
                              <p className="text-[10px] text-muted-foreground">{report.department}</p>
                              <p className="text-[9px] text-muted-foreground font-mono mt-0.5">Lead: {report.reporting_manager}</p>
                            </div>

                            {/* Bottom Location Bar */}
                            <div className="mt-3 py-1 px-2 rounded-md bg-muted text-muted-foreground border border-border/50 text-[11px] font-semibold truncate">
                              {report.location}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      No direct reports assigned under {currentFocusedManager.name}.
                    </div>
                  )}

                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  No company records found for hierarchy mapping.
                </Card>
              )}
            </div>
          )}

          {/* ─── TAB 2: ORGANIZATION DIRECTORY ─── */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Department Filter & Search Bar */}
              <Card className="p-4 border-border/70 shadow-sm bg-card">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {/* Department Select */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Department</Label>
                        <button 
                          onClick={handleResetFilters}
                          className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      </div>
                      <Select value={selectedDept} onValueChange={setSelectedDept}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments ({employees.length})</SelectItem>
                          {availableDepartments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search by Name */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Search</Label>
                      <div className="relative flex items-center">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3" />
                        <Input 
                          placeholder="Search by name, email, employee code…" 
                          value={searchName} 
                          onChange={e => setSearchName(e.target.value)} 
                          className="h-9 text-xs pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="space-y-1 sm:w-44">
                    <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Sort by</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name_asc">Name (A – Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z – A)</SelectItem>
                        <SelectItem value="dept">Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </Card>

              {/* Directory Data Table */}
              <Card className="p-0 overflow-hidden border-border/70 shadow-sm bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/70 bg-muted/30 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3.5 px-4">Employee</th>
                        <th className="py-3.5 px-4">Department & Location</th>
                        <th className="py-3.5 px-4">Reporting Manager</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDirectory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                            {employees.length === 0 
                              ? 'No employee profiles registered under this company yet.' 
                              : 'No employees found matching the selected filters.'}
                          </td>
                        </tr>
                      ) : (
                        filteredDirectory.map((emp) => (
                          <tr key={emp.id} className="border-b border-border/40 last:border-0 hover:bg-muted/15 transition-colors">
                            
                            {/* Name & Designation Column */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                  {emp.avatar_url ? (
                                    <img src={emp.avatar_url} alt={emp.name} className="h-full w-full object-cover" />
                                  ) : (
                                    emp.avatar_initials
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-foreground text-sm">{emp.name}</p>
                                    {emp.is_owner && (
                                      <Badge className="bg-amber-500 text-white text-[8px] px-1 py-0 h-3.5 border-none">
                                        Owner
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-primary font-medium">{emp.designation}</p>
                                  {emp.employee_internal_id && (
                                    <p className="text-[10px] font-mono text-muted-foreground">ID: {emp.employee_internal_id}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Department & Location Column */}
                            <td className="py-4 px-4 text-xs space-y-1">
                              <p className="text-foreground"><strong>Department:</strong> {emp.department}</p>
                              <p className="text-muted-foreground"><strong>Location:</strong> {emp.location}</p>
                              <p className="text-muted-foreground"><strong>Joined:</strong> {emp.joined_date}</p>
                            </td>

                            {/* Reporting Manager Column */}
                            <td className="py-4 px-4 text-xs space-y-1">
                              <p className="text-foreground font-medium"><strong>Manager:</strong> {emp.reporting_manager}</p>
                              <p className="text-muted-foreground"><strong>Work Email:</strong> <span className="font-mono text-primary">{emp.work_email}</span></p>
                              <p className="text-muted-foreground"><strong>Phone:</strong> {emp.phone}</p>
                            </td>

                            {/* Actions Column */}
                            <td className="py-4 px-4 text-right space-y-1.5">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedEmployee(emp)}
                                className="h-8 w-28 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 justify-center block ml-auto"
                              >
                                <User className="h-3.5 w-3.5 inline" /> View Details
                              </Button>
                              {showOrgChart && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleJumpToOrgChart(emp)}
                                  className="h-8 w-28 text-xs font-semibold gap-1.5 border-border/80 hover:border-primary/40 justify-center block ml-auto"
                                >
                                  <GitBranch className="h-3.5 w-3.5 inline" /> Org Chart
                                </Button>
                              )}
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 bg-muted/20 text-xs text-muted-foreground">
                  <span>Showing {filteredDirectory.length} total active employees</span>
                  <span className="font-semibold text-foreground">RoleSync Directory Active</span>
                </div>
              </Card>

            </div>
          )}
        </>
      )}

      {/* ─── View Profile Modal Dialog ─── */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Employee Profile Details
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4 py-2 text-xs sm:text-sm">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-muted/30 border border-border/60">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary border-2 border-primary/30 flex items-center justify-center font-extrabold text-lg shrink-0 overflow-hidden">
                  {selectedEmployee.avatar_url ? (
                    <img src={selectedEmployee.avatar_url} alt={selectedEmployee.name} className="h-full w-full object-cover" />
                  ) : (
                    selectedEmployee.avatar_initials
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-foreground text-base">{selectedEmployee.name}</h4>
                    {selectedEmployee.is_owner && (
                      <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 h-4 border-none">
                        Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-primary font-medium">{selectedEmployee.designation}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedEmployee.department} · {selectedEmployee.location}</p>
                </div>
              </div>

              <div className="space-y-2.5 p-3 rounded-xl bg-card border border-border/50 text-xs">
                {selectedEmployee.employee_internal_id && (
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Employee ID:</span>
                    <span className="font-mono font-semibold text-foreground">{selectedEmployee.employee_internal_id}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Reporting Manager:</span>
                  <span className="font-semibold text-foreground">{selectedEmployee.reporting_manager}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Work Email:</span>
                  <span className="font-mono text-primary">{selectedEmployee.work_email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Phone Number:</span>
                  <span className="font-mono">{selectedEmployee.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Date Joined:</span>
                  <span>{selectedEmployee.joined_date}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {showOrgChart && (
                  <Button 
                    onClick={() => {
                      const emp = selectedEmployee;
                      setSelectedEmployee(null);
                      handleJumpToOrgChart(emp);
                    }}
                    variant="outline" 
                    className="w-1/2 text-xs font-semibold gap-1.5"
                  >
                    <Network className="h-3.5 w-3.5" /> View in Org Tree
                  </Button>
                )}
                {user?.role === 'admin' || user?.isOwner || user?.role === 'super_admin' ? (
                  <Button 
                    onClick={() => {
                      navigate(`${prefix}/admin/employees/${selectedEmployee.id}`);
                    }}
                    className="w-full text-xs font-semibold bg-primary gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5" /> Manage In Admin Hub
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      setSelectedEmployee(null);
                      navigate(`${prefix}/employee/chat`);
                    }}
                    className="w-full text-xs font-semibold bg-gradient-to-r from-primary to-indigo-600 gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Send Message
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
