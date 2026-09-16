import { useState, useMemo } from 'react';
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
  Briefcase, Calendar as CalendarIcon, Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ActiveTab = 'org_chart' | 'directory';

interface EmployeeRecord {
  id: string;
  name: string;
  designation: string;
  department: string;
  reporting_manager: string;
  reporting_manager_id?: string;
  work_email: string;
  phone: string;
  location: string;
  joined_date: string;
  avatar_initials: string;
  direct_reports_count?: number;
}

export default function EmployeePeople() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'org_chart' | 'directory'
  const [activeTab, setActiveTab] = useState<ActiveTab>('org_chart');

  // Directory Filters & Search State (Matching screenshots 2 & 3)
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name_asc');

  // Org Chart Selected Focus Manager
  const [focusedManagerId, setFocusedManagerId] = useState<string>('emp-lead-1');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Profile Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);

  // Comprehensive Organization Directory Data (Matching screenshots)
  const allEmployees: EmployeeRecord[] = [
    {
      id: 'emp-exec-1',
      name: 'Rohit Raju',
      designation: 'Vice President of Engineering',
      department: 'Product Engineering',
      reporting_manager: 'Executive Leadership',
      work_email: 'rohit.raju@rolesync.in',
      phone: '+91 98765 00001',
      location: 'Bengaluru',
      joined_date: '15-Jan-2022',
      avatar_initials: 'RR',
      direct_reports_count: 8
    },
    {
      id: 'emp-lead-1',
      name: 'Sachin Shetty',
      designation: 'Technical Lead',
      department: 'Product Engineering',
      reporting_manager: 'Rohit Raju',
      reporting_manager_id: 'emp-exec-1',
      work_email: 'sachin.shetty@rolesync.in',
      phone: '+91 98765 11002',
      location: 'Bengaluru',
      joined_date: '10-Aug-2022',
      avatar_initials: 'SS',
      direct_reports_count: 5
    },
    {
      id: 'emp-1',
      name: 'Dipendra raj',
      designation: 'Software Engineer',
      department: 'Product Engineering',
      reporting_manager: 'Sachin Shetty',
      reporting_manager_id: 'emp-lead-1',
      work_email: 'dipendra.raj@rolesync.in',
      phone: '+91 98765 11003',
      location: 'Bengaluru',
      joined_date: '05-Jun-2023',
      avatar_initials: 'DR'
    },
    {
      id: 'emp-2',
      name: 'Abhiraj Kumar',
      designation: 'Software Engineer',
      department: 'Product Engineering',
      reporting_manager: 'Sachin Shetty',
      reporting_manager_id: 'emp-lead-1',
      work_email: 'abhiraj.kumar@rolesync.in',
      phone: '+91 98765 11004',
      location: 'Bengaluru',
      joined_date: '12-Jul-2023',
      avatar_initials: 'AK'
    },
    {
      id: 'emp-3',
      name: 'Nitesh Khatri',
      designation: 'Software Engineer',
      department: 'Product Engineering',
      reporting_manager: 'Sachin Shetty',
      reporting_manager_id: 'emp-lead-1',
      work_email: 'nitesh.khatri@rolesync.in',
      phone: '+91 98765 11005',
      location: 'Bengaluru',
      joined_date: '18-Aug-2023',
      avatar_initials: 'NK'
    },
    {
      id: 'emp-4',
      name: 'Ritul Mishra',
      designation: 'Software Engineer',
      department: 'Product Engineering',
      reporting_manager: 'Sachin Shetty',
      reporting_manager_id: 'emp-lead-1',
      work_email: 'ritul.mishra@rolesync.in',
      phone: '+91 98765 11006',
      location: 'Bengaluru',
      joined_date: '02-Oct-2023',
      avatar_initials: 'RM'
    },
    {
      id: 'emp-5',
      name: 'Anil Dhakar',
      designation: 'Frontend Developer Intern',
      department: 'Product Engineering',
      reporting_manager: 'Sachin Shetty',
      reporting_manager_id: 'emp-lead-1',
      work_email: 'anil.dhakar@rolesync.in',
      phone: '+91 98765 11007',
      location: 'Bengaluru',
      joined_date: '01-Feb-2026',
      avatar_initials: 'AD'
    },
    {
      id: 'emp-6',
      name: 'Aniket',
      designation: 'ASM',
      department: 'Sales',
      reporting_manager: 'Aniket',
      work_email: 'aniket@smeowl.com',
      phone: '+91 98765 22001',
      location: 'Mumbai',
      joined_date: '14-Mar-2023',
      avatar_initials: 'A'
    },
    {
      id: 'emp-7',
      name: 'Swaraj',
      designation: 'Assistant Manager - Retention',
      department: 'Operations',
      reporting_manager: 'Shantanu Kumar',
      work_email: 'swaraj@codeyoung.com',
      phone: '+91 98765 22002',
      location: 'Bengaluru',
      joined_date: '20-May-2023',
      avatar_initials: 'S'
    },
    {
      id: 'emp-8',
      name: 'Ankit Kumar',
      designation: 'Senior Manager',
      department: 'Sales',
      reporting_manager: 'Rishabh Tripathi',
      work_email: 'ankit@codeyoung.com',
      phone: '+91 98765 22003',
      location: 'Delhi NCR',
      joined_date: '11-Nov-2022',
      avatar_initials: 'AK'
    },
    {
      id: 'emp-9',
      name: 'Swati P',
      designation: 'Inside Sales Executive',
      department: 'Growth & Marketing',
      reporting_manager: 'Somnath Tiwary',
      work_email: 'swathi.p@smeowl.com',
      phone: '+91 98765 22004',
      location: 'Bengaluru',
      joined_date: '09-Jan-2024',
      avatar_initials: 'SP'
    },
    {
      id: 'emp-10',
      name: 'Priyanka Bakhredia',
      designation: 'Growth Marketing Manager',
      department: 'Growth & Marketing',
      reporting_manager: 'ASHIKA SINGH',
      work_email: 'priyanka@codeyoung.com',
      phone: '+91 98765 22005',
      location: 'Bengaluru',
      joined_date: '19-Sep-2023',
      avatar_initials: 'PB'
    }
  ];

  // Filtered & Sorted Directory
  const filteredDirectory = useMemo(() => {
    return allEmployees.filter(emp => {
      if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
      if (searchName.trim() && !emp.name.toLowerCase().includes(searchName.toLowerCase()) && !emp.designation.toLowerCase().includes(searchName.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'dept') return a.department.localeCompare(b.department);
      return 0;
    });
  }, [allEmployees, selectedDept, searchName, sortBy]);

  // Focused Manager and Direct Reports for Org Chart
  const currentFocusedManager = useMemo(() => {
    return allEmployees.find(e => e.id === focusedManagerId) || allEmployees[1];
  }, [allEmployees, focusedManagerId]);

  const directReports = useMemo(() => {
    return allEmployees.filter(e => e.reporting_manager_id === currentFocusedManager.id || e.reporting_manager === currentFocusedManager.name);
  }, [allEmployees, currentFocusedManager]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedDept('all');
    setSearchName('');
    setSortBy('name_asc');
    toast.info("Directory filters reset.");
  };

  // Switch to Org Chart focused on specific employee
  const handleJumpToOrgChart = (emp: EmployeeRecord) => {
    if (emp.reporting_manager_id) {
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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">People</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organization reporting hierarchy chart and searchable employee directory
          </p>
        </div>
      </div>

      {/* ─── Main Tabs: Organization Chart vs Organization Directory (Matching screenshot) ─── */}
      <div className="border-b border-border/70">
        <div className="flex gap-8 overflow-x-auto pb-1">
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

          <button
            onClick={() => setActiveTab('directory')}
            className={`relative pb-3 pt-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Organization Directory
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ORGANIZATION CHART (Exact match to screenshot 1) ─── */}
      {activeTab === 'org_chart' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Select Employee Filter Bar */}
          <Card className="p-4 border-border/70 shadow-sm bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="w-full sm:max-w-md space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Select Employee</Label>
                <Select value={focusedManagerId} onValueChange={setFocusedManagerId}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {allEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} — {emp.designation} ({emp.department})
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
                {currentFocusedManager.reporting_manager_id && (
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
          <div 
            className="p-8 sm:p-12 rounded-3xl border border-border/70 bg-gradient-to-b from-muted/20 via-background to-secondary/10 shadow-inner overflow-x-auto min-h-[500px] flex flex-col items-center justify-start transition-all"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          >
            
            {/* Top / Focused Manager Node (Matching Sachin Shetty card in screenshot 1) */}
            <div className="relative flex flex-col items-center mb-8">
              <div className="w-64 sm:w-72 p-5 rounded-2xl border border-border/80 bg-card shadow-xl relative hover:border-primary/50 transition-all text-center group">
                
                {/* Avatar with count badge */}
                <div className="relative inline-block mb-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary border-2 border-primary/30 flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                    {currentFocusedManager.avatar_initials}
                  </div>
                  <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md">
                    {directReports.length || 6}
                  </span>
                </div>

                <h4 className="font-heading font-extrabold text-base text-foreground">
                  {currentFocusedManager.name}
                </h4>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{currentFocusedManager.designation}</p>
                <p className="text-[11px] text-muted-foreground">{currentFocusedManager.department}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">Reports to: {currentFocusedManager.reporting_manager}</p>

                {/* Location Footer Bar (Matching blue bar in screenshot) */}
                <div className="mt-4 py-1.5 px-3 rounded-lg bg-[#2979FF]/10 text-[#2979FF] border border-[#2979FF]/20 text-xs font-semibold">
                  {currentFocusedManager.location}
                </div>

                {/* Left / Right Nav Arrows on manager card */}
                <button 
                  onClick={() => setFocusedManagerId('emp-exec-1')}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setFocusedManagerId('emp-lead-1')}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Connecting Tree Stem Down */}
              <div className="h-10 w-0.5 bg-primary/40 mt-0" />
            </div>

            {/* Direct Reports Row (Matching Dipendra, Abhiraj, Nitesh, Ritul, Anil cards in screenshot 1) */}
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
                    className="w-52 sm:w-56 p-4 rounded-2xl border border-border/70 bg-card shadow-lg hover:border-amber-500/50 hover:shadow-xl transition-all flex flex-col justify-between text-center relative group cursor-pointer"
                    onClick={() => setSelectedEmployee(report)}
                  >
                    <div>
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-muted/70 text-foreground border border-border/80 flex items-center justify-center font-bold text-sm mx-auto mb-2.5">
                        {report.avatar_initials}
                      </div>

                      <h5 className="font-heading font-bold text-sm text-foreground">{report.name}</h5>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{report.designation}</p>
                      <p className="text-[10px] text-muted-foreground">{report.department}</p>
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">Lead: {report.reporting_manager}</p>
                    </div>

                    {/* Bottom Location Bar (Matching orange bar in screenshot 1) */}
                    <div className="mt-3 py-1 px-2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-[11px] font-semibold">
                      {report.location}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 2: ORGANIZATION DIRECTORY (Exact match to screenshots 2 & 3) ─── */}
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
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Product Engineering">Product Engineering</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Growth & Marketing">Growth & Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search by Name */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Search</Label>
                  <div className="relative flex items-center">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3" />
                    <Input 
                      placeholder="Search by Name, designation…" 
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

          {/* Directory Data Table (Matching screenshot columns) */}
          <Card className="p-0 overflow-hidden border-border/70 shadow-sm bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Department & Location</th>
                    <th className="py-3.5 px-4">Designation & Reporting Manager</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDirectory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                        No employees found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDirectory.map((emp) => (
                      <tr key={emp.id} className="border-b border-border/40 last:border-0 hover:bg-muted/15 transition-colors">
                        
                        {/* Name & Designation Column */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted text-foreground border border-border/80 flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.avatar_initials}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">{emp.name}</p>
                              <p className="text-xs text-muted-foreground"><strong>Designation:</strong> {emp.designation}</p>
                              <p className="text-[11px] text-muted-foreground"><strong>Department:</strong> {emp.department}</p>
                            </div>
                          </div>
                        </td>

                        {/* Department & Location Column */}
                        <td className="py-4 px-4 text-xs space-y-1">
                          <p className="text-foreground"><strong>Reporting Manager:</strong> {emp.reporting_manager}</p>
                          <p className="text-muted-foreground"><strong>Work Email:</strong> <span className="text-primary font-mono">{emp.work_email}</span></p>
                          <p className="text-muted-foreground"><strong>Location:</strong> {emp.location}</p>
                        </td>

                        {/* Designation & Manager Summary Column */}
                        <td className="py-4 px-4 text-xs space-y-1">
                          <p className="text-muted-foreground"><strong>Work Email:</strong> <span className="font-mono text-foreground">{emp.work_email}</span></p>
                          <p className="text-muted-foreground"><strong>Joined:</strong> {emp.joined_date}</p>
                        </td>

                        {/* Actions Column (Matching buttons in screenshot 2 & 3) */}
                        <td className="py-4 px-4 text-right space-y-1.5">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEmployee(emp)}
                            className="h-8 w-28 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 justify-center block ml-auto"
                          >
                            <User className="h-3.5 w-3.5 inline" /> View Profile
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleJumpToOrgChart(emp)}
                            className="h-8 w-28 text-xs font-semibold gap-1.5 border-border/80 hover:border-primary/40 justify-center block ml-auto"
                          >
                            <GitBranch className="h-3.5 w-3.5 inline" /> Org Chart
                          </Button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 bg-muted/20 text-xs text-muted-foreground">
              <span>Showing {filteredDirectory.length} total employees</span>
              <span className="font-semibold text-foreground">RoleSync Directory Active</span>
            </div>
          </Card>

        </div>
      )}

      {/* ─── View Profile Modal Dialog ─── */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Employee Profile
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4 py-2 text-xs sm:text-sm">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-muted/30 border border-border/60">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary border-2 border-primary/30 flex items-center justify-center font-extrabold text-lg shrink-0">
                  {selectedEmployee.avatar_initials}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-base">{selectedEmployee.name}</h4>
                  <p className="text-xs text-primary font-medium">{selectedEmployee.designation}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedEmployee.department} · {selectedEmployee.location}</p>
                </div>
              </div>

              <div className="space-y-2.5 p-3 rounded-xl bg-card border border-border/50 text-xs">
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
                <Button 
                  onClick={() => {
                    setSelectedEmployee(null);
                    handleJumpToOrgChart(selectedEmployee);
                  }}
                  variant="outline" 
                  className="w-1/2 text-xs font-semibold gap-1.5"
                >
                  <Network className="h-3.5 w-3.5" /> View in Org Tree
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedEmployee(null);
                    navigate('/employee/chat');
                  }}
                  className="w-1/2 text-xs font-semibold bg-gradient-to-r from-primary to-indigo-600 gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
