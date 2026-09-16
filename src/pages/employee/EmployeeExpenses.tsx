import { useState, useMemo, useEffect } from 'react';
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
  Plane, Receipt, Wallet, Plus, HelpCircle, Filter, FileText, CheckCircle2, 
  Clock, XCircle, MoreVertical, Eye, Download, Upload, AlertCircle, Building2, 
  MapPin, Calendar as CalendarIcon, DollarSign, ArrowRight, UserCheck, Check,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ActiveTab = 'travel' | 'expenses' | 'advances';

type StatusType = 
  | 'pending' 
  | 'auto_approved' 
  | 'approved_by_admin' 
  | 'rejected_by_admin' 
  | 'approved_by_workflow' 
  | 'rejected_by_workflow';

interface TravelRequest {
  id: string;
  trip_title: string;
  purpose: string;
  from_city: string;
  to_city: string;
  departure_date: string;
  return_date: string;
  est_budget: number;
  mode: string;
  accommodation: boolean;
  status: StatusType;
  created_at: string;
  remarks?: string;
  document_name?: string | null;
}

interface ExpenseClaim {
  id: string;
  title: string;
  category: 'Food & Meals' | 'Travel & Commute' | 'Client Entertainment' | 'Hardware & Software' | 'Internet & Mobile' | 'Office Supplies' | 'Others';
  expense_date: string;
  amount: number;
  merchant: string;
  project_tag: string;
  status: StatusType;
  created_at: string;
  remarks?: string;
  receipt_name?: string | null;
}

interface AdvanceRequest {
  id: string;
  amount: number;
  purpose: string;
  requested_date: string;
  expected_disbursal: string;
  settlement_date: string;
  status: StatusType;
  remarks?: string;
}

export default function EmployeeExpenses() {
  const { user } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('travel');
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Data States (with local persistence)
  const [travelList, setTravelList] = useState<TravelRequest[]>(() => {
    const saved = localStorage.getItem('rolesync_travel_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [expenseList, setExpenseList] = useState<ExpenseClaim[]>(() => {
    const saved = localStorage.getItem('rolesync_expense_claims');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'EXP-1092',
        title: 'Client Lunch Meeting with Tech Corp',
        category: 'Client Entertainment',
        expense_date: '12-Mar-2026',
        amount: 2850,
        merchant: 'The Oberoi Restaurant',
        project_tag: 'Enterprise Pilot Project',
        status: 'approved_by_admin',
        created_at: '12-Mar-2026',
        remarks: 'Quarterly account review with senior directors',
        receipt_name: 'restaurant_bill_1092.pdf'
      },
      {
        id: 'EXP-1093',
        title: 'High-Speed Broadband Internet Reimbursement',
        category: 'Internet & Mobile',
        expense_date: '01-Mar-2026',
        amount: 1499,
        merchant: 'Airtel Fiber',
        project_tag: 'WFH Monthly Allowance',
        status: 'approved_by_workflow',
        created_at: '02-Mar-2026',
        remarks: 'March 2026 work-from-home fiber connection',
        receipt_name: 'airtel_bill_mar.pdf'
      },
      {
        id: 'EXP-1094',
        title: 'Airport Taxi Fare to Bengaluru HQ',
        category: 'Travel & Commute',
        expense_date: '08-Mar-2026',
        amount: 1250,
        merchant: 'Uber India',
        project_tag: 'Onsite Strategy Meeting',
        status: 'pending',
        created_at: '09-Mar-2026',
        remarks: 'Late evening cab after product sprint release',
        receipt_name: 'uber_receipt_441.pdf'
      }
    ];
  });

  const [advanceList, setAdvanceList] = useState<AdvanceRequest[]>(() => {
    const saved = localStorage.getItem('rolesync_advance_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'ADV-804',
        amount: 15000,
        purpose: 'Advance for Mumbai Client Onsite Architecture Workshop',
        requested_date: '05-Mar-2026',
        expected_disbursal: '15-Mar-2026',
        settlement_date: '30-Mar-2026',
        status: 'approved_by_admin',
        remarks: 'Hotel booking and local transit advance for 3-day workshop'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('rolesync_travel_requests', JSON.stringify(travelList));
  }, [travelList]);

  useEffect(() => {
    localStorage.setItem('rolesync_expense_claims', JSON.stringify(expenseList));
  }, [expenseList]);

  useEffect(() => {
    localStorage.setItem('rolesync_advance_requests', JSON.stringify(advanceList));
  }, [advanceList]);

  // Dialog States
  const [travelDialogOpen, setTravelDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  // Travel Form State
  const [tripTitle, setTripTitle] = useState('');
  const [tripPurpose, setTripPurpose] = useState('Client Meeting & Workshop');
  const [fromCity, setFromCity] = useState('Bengaluru');
  const [toCity, setToCity] = useState('Mumbai');
  const [depDate, setDepDate] = useState('2026-03-24');
  const [retDate, setRetDate] = useState('2026-03-27');
  const [estBudget, setEstBudget] = useState('18500');
  const [travelMode, setTravelMode] = useState('Flight');
  const [accNeeded, setAccNeeded] = useState(true);
  const [travelRemarks, setTravelRemarks] = useState('');

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseClaim['category']>('Food & Meals');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expAmount, setExpAmount] = useState('');
  const [expMerchant, setExpMerchant] = useState('');
  const [expProject, setExpProject] = useState('General Operations');
  const [expRemarks, setExpRemarks] = useState('');
  const [expReceipt, setExpReceipt] = useState<string | null>(null);

  // Advance Form State
  const [advAmount, setAdvAmount] = useState('');
  const [advPurpose, setAdvPurpose] = useState('');
  const [advDisbursal, setAdvDisbursal] = useState('2026-03-20');
  const [advSettlement, setAdvSettlement] = useState('2026-04-05');
  const [advRemarks, setAdvRemarks] = useState('');

  // Submit Travel Request
  const handleCreateTravel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripTitle.trim() || !estBudget) {
      toast.error('Please enter valid trip title and estimated budget');
      return;
    }
    const newReq: TravelRequest = {
      id: `TRV-${Math.floor(1000 + Math.random() * 9000)}`,
      trip_title: tripTitle.trim(),
      purpose: tripPurpose,
      from_city: fromCity,
      to_city: toCity,
      departure_date: new Date(depDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      return_date: new Date(retDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      est_budget: parseFloat(estBudget) || 0,
      mode: travelMode,
      accommodation: accNeeded,
      status: 'pending',
      created_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      remarks: travelRemarks.trim(),
      document_name: 'travel_itinerary.pdf'
    };

    setTravelList(prev => [newReq, ...prev]);
    toast.success('Travel request submitted for manager approval!');
    setTravelDialogOpen(false);
    setTripTitle('');
    setTravelRemarks('');
  };

  // Submit Expense Claim
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount) {
      toast.error('Please enter expense description and valid amount');
      return;
    }
    const newClaim: ExpenseClaim = {
      id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      title: expTitle.trim(),
      category: expCategory,
      expense_date: new Date(expDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: parseFloat(expAmount) || 0,
      merchant: expMerchant.trim() || 'Vendor Merchant',
      project_tag: expProject.trim() || 'General Operations',
      status: 'pending',
      created_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      remarks: expRemarks.trim(),
      receipt_name: expReceipt || 'tax_invoice_receipt.pdf'
    };

    setExpenseList(prev => [newClaim, ...prev]);
    toast.success('Expense claim submitted successfully!');
    setExpenseDialogOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpMerchant('');
    setExpRemarks('');
    setExpReceipt(null);
  };

  // Submit Advance Request
  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advAmount || !advPurpose.trim()) {
      toast.error('Please enter advance amount and purpose');
      return;
    }
    const newAdv: AdvanceRequest = {
      id: `ADV-${Math.floor(100 + Math.random() * 900)}`,
      amount: parseFloat(advAmount) || 0,
      purpose: advPurpose.trim(),
      requested_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expected_disbursal: new Date(advDisbursal).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      settlement_date: new Date(advSettlement).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'pending',
      remarks: advRemarks.trim()
    };

    setAdvanceList(prev => [newAdv, ...prev]);
    toast.success('Cash advance request submitted!');
    setAdvanceDialogOpen(false);
    setAdvAmount('');
    setAdvPurpose('');
    setAdvRemarks('');
  };

  // Filter logic
  const filteredTravel = useMemo(() => {
    return travelList.filter(t => statusFilter === 'all' || t.status === statusFilter);
  }, [travelList, statusFilter]);

  const filteredExpenses = useMemo(() => {
    return expenseList.filter(e => statusFilter === 'all' || e.status === statusFilter);
  }, [expenseList, statusFilter]);

  const filteredAdvances = useMemo(() => {
    return advanceList.filter(a => statusFilter === 'all' || a.status === statusFilter);
  }, [advanceList, statusFilter]);

  // Helper for Status Badge Rendering
  const renderStatusBadge = (status: StatusType) => {
    switch (status) {
      case 'approved_by_admin':
      case 'approved_by_workflow':
      case 'auto_approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Check className="h-3 w-3" />
            {status === 'auto_approved' ? 'Auto Approved' : status === 'approved_by_admin' ? 'Approved By Admin' : 'Approved By Workflow'}
          </span>
        );
      case 'rejected_by_admin':
      case 'rejected_by_workflow':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            {status === 'rejected_by_admin' ? 'Rejected By Admin' : 'Rejected By Workflow'}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Top Header with Help Button ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Expense Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit travel requests, claim business expenses, and manage advance reconciliations
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setHowToUseOpen(true)}
          className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5 self-start sm:self-auto font-medium text-xs sm:text-sm"
        >
          <HelpCircle className="h-4 w-4" />
          How to use this section?
        </Button>
      </div>

      {/* ─── 3 Main Tabs: TRAVEL, EXPENSES, ADVANCES ─── */}
      <div className="border-b border-border/70">
        <div className="flex gap-6 overflow-x-auto pb-1">
          {[
            { id: 'travel', label: 'TRAVEL', icon: Plane, count: travelList.length },
            { id: 'expenses', label: 'EXPENSES', icon: Receipt, count: expenseList.length },
            { id: 'advances', label: 'ADVANCES', icon: Wallet, count: advanceList.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`relative pb-3 pt-1 px-2 text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Subheader / Viewing-As Bar + Status Filter (Exact matching screenshot) ─── */}
      <Card className="p-4 border-border/70 shadow-sm bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Viewing As User Details */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Viewing as :</span>
                <span className="text-sm font-bold text-foreground">{user?.name || 'Anil Dhakar'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'employee' ? 'Frontend Developer Intern' : 'Staff Engineer'} · Product Engineering · Bengaluru
              </p>
            </div>
          </div>

          {/* Right: Status Filter Dropdown & Action Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {activeTab === 'travel' ? 'Travel Status' : activeTab === 'expenses' ? 'Expense Status' : 'Advance Status'} :
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[190px] text-xs">
                  <SelectValue placeholder="All Requests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="auto_approved">Auto Approved</SelectItem>
                  <SelectItem value="approved_by_admin">Approved By Admin</SelectItem>
                  <SelectItem value="rejected_by_admin">Rejected By Admin</SelectItem>
                  <SelectItem value="approved_by_workflow">Approved By Workflow</SelectItem>
                  <SelectItem value="rejected_by_workflow">Rejected By Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contextual Action Button */}
            {activeTab === 'travel' && (
              <Button 
                onClick={() => setTravelDialogOpen(true)}
                className="h-9 bg-gradient-to-r from-primary to-indigo-600 text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Travel Request
              </Button>
            )}

            {activeTab === 'expenses' && (
              <Button 
                onClick={() => setExpenseDialogOpen(true)}
                className="h-9 bg-gradient-to-r from-primary to-indigo-600 text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Expense Claim
              </Button>
            )}

            {activeTab === 'advances' && (
              <Button 
                onClick={() => setAdvanceDialogOpen(true)}
                className="h-9 bg-gradient-to-r from-primary to-indigo-600 text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Request Advance
              </Button>
            )}
          </div>

        </div>
      </Card>

      {/* ─── TAB 1: TRAVEL ─── */}
      {activeTab === 'travel' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {filteredTravel.length === 0 ? (
            <Card className="p-12 text-center border-border/70 shadow-sm">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Plane className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground mb-1">
                No Travel request has been added yet.
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
                Planning an upcoming client meeting or conference? Submit your travel itinerary for advance booking approval.
              </p>
              <Button 
                onClick={() => setTravelDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-indigo-600 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Create First Travel Request
              </Button>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border-border/70 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Trip Details</th>
                      <th className="py-3 px-4">Route</th>
                      <th className="py-3 px-4">Departure</th>
                      <th className="py-3 px-4">Return</th>
                      <th className="py-3 px-4">Est. Budget</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Docs</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTravel.map((req) => (
                      <tr key={req.id} className="border-b border-border/40 last:border-0 hover:bg-muted/15 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="font-semibold text-foreground text-xs sm:text-sm">{req.trip_title}</p>
                              <p className="text-[11px] text-muted-foreground">{req.purpose}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-medium">
                          {req.from_city} → {req.to_city}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{req.departure_date}</td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{req.return_date}</td>
                        <td className="py-3.5 px-4 font-bold text-foreground text-xs">₹{req.est_budget.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(req.status)}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {req.document_name ? (
                            <span className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer">
                              <FileText className="h-3.5 w-3.5" />
                              View
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setSelectedDetails(req)} className="gap-2 text-xs">
                                <Eye className="h-3.5 w-3.5" /> View Details
                              </DropdownMenuItem>
                              {req.status === 'pending' && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setTravelList(prev => prev.filter(p => p.id !== req.id));
                                    toast.success("Travel request cancelled");
                                  }} 
                                  className="gap-2 text-xs text-rose-500"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Cancel Request
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── TAB 2: EXPENSES ─── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Quick Metrics Bar for Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Total Claimed Amount</span>
              <p className="font-heading text-2xl font-extrabold text-foreground mt-1">
                ₹{expenseList.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Approved / Reimbursed</span>
              <p className="font-heading text-2xl font-extrabold text-emerald-500 mt-1">
                ₹{expenseList.filter(e => e.status.includes('approved')).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Pending Claims</span>
              <p className="font-heading text-2xl font-extrabold text-amber-500 mt-1">
                ₹{expenseList.filter(e => e.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <Card className="p-12 text-center border-border/70 shadow-sm">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground mb-1">
                No Expense claim has been added yet.
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
                Upload receipts for meals, travel, internet, software licenses, or client expenses to get reimbursed.
              </p>
              <Button 
                onClick={() => setExpenseDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-indigo-600 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Submit Expense Claim
              </Button>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border-border/70 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Claim ID & Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Merchant</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-border/40 last:border-0 hover:bg-muted/15 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground text-xs sm:text-sm">{exp.title}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{exp.id} · {exp.project_tag}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium bg-muted/70 px-2 py-0.5 rounded-md text-foreground">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{exp.expense_date}</td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-medium">{exp.merchant}</td>
                        <td className="py-3.5 px-4 font-bold text-foreground text-sm">₹{exp.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(exp.status)}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {exp.receipt_name ? (
                            <span className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer">
                              <FileText className="h-3.5 w-3.5" />
                              Receipt
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setSelectedDetails(exp)} className="gap-2 text-xs">
                                <Eye className="h-3.5 w-3.5" /> View Details
                              </DropdownMenuItem>
                              {exp.status === 'pending' && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setExpenseList(prev => prev.filter(p => p.id !== exp.id));
                                    toast.success("Expense claim cancelled");
                                  }} 
                                  className="gap-2 text-xs text-rose-500"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Cancel Claim
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── TAB 3: ADVANCES ─── */}
      {activeTab === 'advances' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {filteredAdvances.length === 0 ? (
            <Card className="p-12 text-center border-border/70 shadow-sm">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground mb-1">
                No Cash Advance request added yet.
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
                Need upfront funds for travel or business events? Submit an advance request for accounting approval.
              </p>
              <Button 
                onClick={() => setAdvanceDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-indigo-600 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Request Cash Advance
              </Button>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border-border/70 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Advance ID & Purpose</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Requested Date</th>
                      <th className="py-3 px-4">Expected Disbursal</th>
                      <th className="py-3 px-4">Settlement Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvances.map((adv) => (
                      <tr key={adv.id} className="border-b border-border/40 last:border-0 hover:bg-muted/15 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <p className="font-bold text-foreground text-xs sm:text-sm">{adv.purpose}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{adv.id}</p>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-foreground text-sm">₹{adv.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{adv.requested_date}</td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{adv.expected_disbursal}</td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs font-medium">{adv.settlement_date}</td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(adv.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setSelectedDetails(adv)} className="gap-2 text-xs">
                                <Eye className="h-3.5 w-3.5" /> View Remarks
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── Create Travel Request Dialog ─── */}
      <Dialog open={travelDialogOpen} onOpenChange={setTravelDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              New Travel Itinerary Request
            </DialogTitle>
            <DialogDescription>
              Submit upcoming business travel details for managerial & finance approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTravel} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Trip Title / Purpose</Label>
              <Input 
                required 
                placeholder="e.g. Q1 Enterprise Client Demo & Workshop" 
                value={tripTitle} 
                onChange={e => setTripTitle(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">From City</Label>
                <Input required value={fromCity} onChange={e => setFromCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">To Destination City</Label>
                <Input required value={toCity} onChange={e => setToCity(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Departure Date</Label>
                <Input type="date" required value={depDate} onChange={e => setDepDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Return Date</Label>
                <Input type="date" required value={retDate} onChange={e => setRetDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estimated Budget (₹ INR)</Label>
                <Input type="number" required value={estBudget} onChange={e => setEstBudget(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mode of Travel</Label>
                <Select value={travelMode} onValueChange={setTravelMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flight">✈️ Flight</SelectItem>
                    <SelectItem value="Train">🚆 Train / Railway</SelectItem>
                    <SelectItem value="Cab / Taxi">🚕 Cab / Taxi</SelectItem>
                    <SelectItem value="Personal Vehicle">🚗 Personal Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Business Justification</Label>
              <Textarea 
                rows={2}
                placeholder="Details of client meetings or company agenda…" 
                value={travelRemarks} 
                onChange={e => setTravelRemarks(e.target.value)} 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setTravelDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-indigo-600">
                Submit Travel Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Create Expense Claim Dialog ─── */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Add Business Expense Claim
            </DialogTitle>
            <DialogDescription>
              Submit an expense with tax invoice receipt for instant reimbursement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Expense Title / Description</Label>
              <Input 
                required 
                placeholder="e.g. Client Dinner at Oberoi / WFH Fiber Bill" 
                value={expTitle} 
                onChange={e => setExpTitle(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={expCategory} onValueChange={(val: any) => setExpCategory(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food & Meals">🍔 Food & Meals</SelectItem>
                    <SelectItem value="Travel & Commute">🚕 Travel & Commute</SelectItem>
                    <SelectItem value="Client Entertainment">👔 Client Entertainment</SelectItem>
                    <SelectItem value="Internet & Mobile">📶 Internet & Mobile</SelectItem>
                    <SelectItem value="Hardware & Software">💻 Hardware & Software</SelectItem>
                    <SelectItem value="Office Supplies">📦 Office Supplies</SelectItem>
                    <SelectItem value="Others">📋 Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Amount (₹ INR)</Label>
                <Input 
                  type="number" 
                  required 
                  placeholder="2500" 
                  value={expAmount} 
                  onChange={e => setExpAmount(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expense Date</Label>
                <Input type="date" required value={expDate} onChange={e => setExpDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Merchant / Vendor Name</Label>
                <Input placeholder="e.g. Uber / Amazon / Airtel" value={expMerchant} onChange={e => setExpMerchant(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project / Client Tag</Label>
              <Input placeholder="e.g. Project Alpha / Quarterly WFH Allowance" value={expProject} onChange={e => setExpProject(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Remarks & Notes</Label>
              <Textarea 
                rows={2} 
                placeholder="Additional details for finance review…" 
                value={expRemarks} 
                onChange={e => setExpRemarks(e.target.value)} 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-indigo-600">
                Submit Claim
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Request Advance Dialog ─── */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Request Cash Advance
            </DialogTitle>
            <DialogDescription>
              Request advance company funds prior to travel or major team procurement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAdvance} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Advance Amount (₹ INR)</Label>
              <Input 
                type="number" 
                required 
                placeholder="10000" 
                value={advAmount} 
                onChange={e => setAdvAmount(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Purpose of Advance</Label>
              <Textarea 
                required 
                rows={2} 
                placeholder="e.g. Hotel accommodation & taxi transit for 3-day onsite workshop" 
                value={advPurpose} 
                onChange={e => setAdvPurpose(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expected Disbursal Date</Label>
                <Input type="date" required value={advDisbursal} onChange={e => setAdvDisbursal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Settlement Deadline Date</Label>
                <Input type="date" required value={advSettlement} onChange={e => setAdvSettlement(e.target.value)} />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAdvanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-indigo-600">
                Submit Advance Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── View Details Modal ─── */}
      <Dialog open={!!selectedDetails} onOpenChange={() => setSelectedDetails(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Item Details & Audit
            </DialogTitle>
          </DialogHeader>
          {selectedDetails && (
            <div className="space-y-3 py-2 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">ID / Reference:</span>
                <span className="font-mono font-bold">{selectedDetails.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Status:</span>
                <div>{renderStatusBadge(selectedDetails.status)}</div>
              </div>
              {selectedDetails.remarks && (
                <div className="py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground block mb-1">Remarks & Notes:</span>
                  <p className="p-2.5 rounded-lg bg-muted/40 text-foreground text-xs leading-relaxed">
                    {selectedDetails.remarks}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedDetails(null)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── "How to use this section?" Modal ─── */}
      <Dialog open={howToUseOpen} onOpenChange={setHowToUseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Expense Management Guide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <p><strong>1. TRAVEL:</strong> Submit itineraries with origin, destination, estimated budgets, and travel modes. Requires manager sign-off prior to ticket booking.</p>
            <p><strong>2. EXPENSES:</strong> Submit post-facto reimbursement claims with receipt uploads across meals, commute, internet, and office tools.</p>
            <p><strong>3. ADVANCES:</strong> Request upfront company cash advances for upcoming company initiatives. Settled upon submission of actual expense bills.</p>
            <p><strong>4. Status Filtering:</strong> Use the top filter to track pending reviews, auto-approved items, and admin sign-offs.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setHowToUseOpen(false)} className="w-full">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
