import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, Mail, Building2, Phone, Briefcase, Loader2, MapPin, Calendar, 
  ShieldAlert, IdCard, FileText, Download, Upload, History, Camera, 
  CreditCard, CheckCircle2, FileCheck2, UserCheck, Heart, AlertCircle,
  GraduationCap, Clock, Award, Eye, Maximize2
} from 'lucide-react';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { toast } from 'sonner';

type ProfileData = {
  full_name: string;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  emergency_contact: string | null;
  address: string | null;
  date_of_birth: string | null;
  id_card_url: string | null;
  avatar_url: string | null;
  employee_internal_id: string | null;
};

type Doc = { id: string; document_type: string; file_name: string; storage_path: string; created_at: string; size?: string };

const PROFILE_TABS = [
  { id: 'personal', label: 'Personal Profile' },
  { id: 'professional', label: 'Professional Profile' },
  { id: 'contact', label: 'Contact Details' },
  { id: 'emergency', label: 'Emergency Details' },
  { id: 'financial', label: 'Financial Details' },
  { id: 'work', label: 'Work Profile' },
  { id: 'documents', label: 'Forms, Documents & Letters' },
];

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, department, job_title, emergency_contact, address, date_of_birth, id_card_url, avatar_url, employee_internal_id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data as ProfileData);
      if (data.id_card_url) {
        if (data.id_card_url.startsWith('http://') || data.id_card_url.startsWith('https://')) {
          setIdCardPreview(data.id_card_url);
        } else {
          const { data: pubData } = supabase.storage.from('id-cards').getPublicUrl(data.id_card_url);
          if (pubData?.publicUrl) setIdCardPreview(pubData.publicUrl);
          supabase.storage.from('id-cards').createSignedUrl(data.id_card_url, 3600)
            .then(({ data: signed }) => { if (signed?.signedUrl) setIdCardPreview(signed.signedUrl); })
            .catch(() => {});
        }
      }
      if (data.avatar_url) {
        if (data.avatar_url.startsWith('http://') || data.avatar_url.startsWith('https://')) {
          setAvatarPreview(data.avatar_url);
        } else {
          const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
          if (pubData?.publicUrl) setAvatarPreview(pubData.publicUrl);
          supabase.storage.from('avatars').createSignedUrl(data.avatar_url, 3600)
            .then(({ data: signed }) => { if (signed?.signedUrl) setAvatarPreview(signed.signedUrl); })
            .catch(() => {});
        }
      }
    }
    
    // Load documents
    const { data: docData } = await supabase
      .from('employee_documents' as any)
      .select('id, document_type, file_name, storage_path, created_at')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false });
    
    setDocs((docData as any) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function downloadDoc(doc: Doc) {
    try {
      const { data } = await supabase.storage.from('employee-documents').createSignedUrl(doc.storage_path, 300);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast.info(`Simulated download for: ${doc.file_name}`);
      }
    } catch (e) {
      toast.info(`Downloading ${doc.file_name}...`);
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 2MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id);
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
      setAvatarPreview(signed?.signedUrl ?? null);
      toast.success('Profile photo updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const p = profile;
  const fullName = p?.full_name || user?.name || 'Employee';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Anil';
  const lastName = nameParts.slice(1).join(' ') || 'Dhakar';
  const empId = p?.employee_internal_id || 'EMP1092';
  const department = p?.department || 'Product Engineering';
  const designation = p?.job_title || 'Frontend Developer Intern';
  const location = 'Bengaluru';

  // Sample static letters & forms for demonstration matching screenshots
  const sampleForms = [
    { name: 'Form 11 (EPF Declaration)', size: '1.2 MB', date: '01-Apr-2026', type: 'Form' },
    { name: 'Form 2 (Nomination Form)', size: '850 KB', date: '01-Apr-2026', type: 'Form' },
    { name: 'Gratuity Form F', size: '620 KB', date: '01-Apr-2026', type: 'Form' },
  ];

  const sampleLetters = [
    { name: 'Internship_Offer_Letter.pdf', size: '420 KB', date: '15-Mar-2026', type: 'Offer Letter' },
    { name: 'Appointment_Letter_RoleSync.pdf', size: '580 KB', date: '01-Apr-2026', type: 'Appointment' },
    { name: 'NDA_Confidentiality_Agreement.pdf', size: '310 KB', date: '01-Apr-2026', type: 'NDA' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl pb-12">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-foreground">Profile</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setHistoryOpen(true)}
              className="text-xs font-semibold gap-1.5 border-border/80"
            >
              <History className="h-3.5 w-3.5 text-primary" /> View History
            </Button>
            <ChangePasswordDialog />
          </div>
        </div>

        {/* Hero Profile Summary Card */}
        <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-2xl overflow-hidden shadow-inner">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{firstName.charAt(0)}</span>
                  )}
                </div>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform"
                  title="Upload profile photo"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-heading font-bold text-foreground">{fullName}</h2>
                  <Badge variant="secondary" className="font-mono text-xs text-primary font-semibold">
                    {empId}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {designation} · {department}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" /> {location}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto justify-between sm:justify-start border-t sm:border-t-0 pt-4 sm:pt-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Employee
              </span>
              <span className="text-[11px] text-muted-foreground">
                General Shift 1120 (11:00 AM – 08:00 PM)
              </span>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="border-t border-border/60 bg-muted/20 px-4 overflow-x-auto scrollbar-none">
            <div className="flex gap-1 min-w-max">
              {PROFILE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 text-xs font-semibold transition-all duration-150 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-bold bg-card shadow-sm rounded-t-lg'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Tab 1: Personal Profile */}
        {activeTab === 'personal' && (
          <Card className="rounded-2xl border p-6 space-y-6">
            <h3 className="text-base font-heading font-bold text-foreground border-b pb-3">Personal Profile</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">First Name</span>
                <p className="text-sm font-semibold text-foreground">{firstName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Nick Name</span>
                <p className="text-sm text-foreground">—</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Middle Name</span>
                <p className="text-sm text-foreground">—</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Full Name</span>
                <p className="text-sm font-semibold text-foreground">{fullName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Last Name</span>
                <p className="text-sm font-semibold text-foreground">{lastName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Gender</span>
                <p className="text-sm text-foreground">Male</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Birthday</span>
                <p className="text-sm text-foreground">{p?.date_of_birth || '15-Aug-2001'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Father's Name</span>
                <p className="text-sm text-foreground">—</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Age</span>
                <p className="text-sm text-foreground">25</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Marital Status</span>
                <p className="text-sm text-foreground">Single</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Wedding Anniversary</span>
                <p className="text-sm text-foreground">—</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Family Details</h4>
              <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
                <p><strong className="text-foreground">Name:</strong> —</p>
                <p><strong className="text-foreground">Relationship:</strong> —</p>
                <p><strong className="text-foreground">Date Of Birth:</strong> —</p>
                <p><strong className="text-foreground">Contact Details:</strong> —</p>
                <p><strong className="text-foreground">Address:</strong> —</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 2: Professional Profile */}
        {activeTab === 'professional' && (
          <Card className="rounded-2xl border p-6 space-y-6">
            <h3 className="text-base font-heading font-bold text-foreground border-b pb-3">Professional Profile</h3>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Highest Education Qualification</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border bg-muted/20 text-xs">
                <div>
                  <span className="text-muted-foreground">Degree</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">B.Tech / B.E.</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Specialization</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">Computer Science & Engineering</p>
                </div>
                <div>
                  <span className="text-muted-foreground">College / University</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">VTU Technological Institute</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Graduation Year</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">2024</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Past Work Experience</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border bg-muted/20 text-xs">
                <div>
                  <span className="text-muted-foreground">Title</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">Frontend Developer Trainee</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">Bengaluru, India</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">6 Months (2025)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Description</span>
                  <p className="text-foreground text-xs mt-0.5">React & UI component architecture</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Employee Code</span>
                <p className="text-sm font-mono font-bold text-primary">{empId}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Corporate Email</span>
                <p className="text-sm font-semibold text-foreground">{user?.email}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 3: Contact Details */}
        {activeTab === 'contact' && (
          <Card className="rounded-2xl border p-6 space-y-6">
            <h3 className="text-base font-heading font-bold text-foreground border-b pb-3">Contact Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Personal Email ID</span>
                <p className="text-sm font-semibold text-foreground">{user?.email || 'anildhakar2001@gmail.com'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Country Code</span>
                <p className="text-sm font-semibold text-foreground">+91 (India)</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Phone Number</span>
                <p className="text-sm font-semibold text-foreground">{p?.phone || '8821817885'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Home Phone Number</span>
                <p className="text-sm text-foreground">—</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Blood Group</span>
                <p className="text-sm font-semibold text-rose-500">O+ Positive</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-1 p-4 rounded-xl border bg-muted/20">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" /> Permanent Address
                </span>
                <p className="text-xs sm:text-sm text-foreground mt-1 leading-relaxed">
                  {p?.address || '#42, 4th Cross, Indiranagar, Bengaluru, Karnataka - 560038'}
                </p>
              </div>

              <div className="space-y-1 p-4 rounded-xl border bg-muted/20">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" /> Correspondence Address
                </span>
                <p className="text-xs sm:text-sm text-foreground mt-1 leading-relaxed">
                  {p?.address || '#42, 4th Cross, Indiranagar, Bengaluru, Karnataka - 560038'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 4: Emergency Details */}
        {activeTab === 'emergency' && (
          <Card className="rounded-2xl border p-6 space-y-6">
            <h3 className="text-base font-heading font-bold text-foreground border-b pb-3">Emergency Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Allergies / Medical Warnings</span>
                <p className="text-sm text-foreground">None reported</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Emergency Contact Person & Phone</span>
                <p className="text-sm font-semibold text-foreground">{p?.emergency_contact || '+91 98765 43210 (Father)'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Nominee (in case of eventuality)</span>
                <p className="text-sm font-semibold text-foreground">Primary Guardian / Next of Kin</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 5: Financial Details */}
        {activeTab === 'financial' && (
          <Card className="rounded-2xl border p-6 space-y-6">
            <h3 className="text-base font-heading font-bold text-foreground border-b pb-3">Financial & Banking Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Bank Account Number</span>
                <p className="text-sm font-mono font-bold text-foreground">•••• •••• 4912</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Bank Name</span>
                <p className="text-sm font-semibold text-foreground">HDFC Bank Ltd.</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">IFSC Code</span>
                <p className="text-sm font-mono font-semibold text-foreground">HDFC0001234</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Permanent Account Number (PAN)</span>
                <p className="text-sm font-mono font-bold text-foreground">ABCDE1234F</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Universal Account Number (UAN / EPF)</span>
                <p className="text-sm font-mono font-bold text-foreground">101234567890</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Tax Regime Preference</span>
                <p className="text-sm font-semibold text-foreground">New Tax Regime (FY 2026-27)</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 6: Work Profile */}
        {activeTab === 'work' && (
          <Card className="rounded-2xl border p-6 space-y-6">
            <h3 className="text-base font-heading font-bold text-foreground border-b pb-3">Work Profile & Hierarchy</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Reporting Manager</span>
                <p className="text-sm font-semibold text-foreground">Sachin Shetty (Technical Lead - EMP203)</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Shift Code & Hours</span>
                <p className="text-sm font-semibold text-foreground">General Shift 1120 (11:00 AM – 08:00 PM)</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Date of Joining</span>
                <p className="text-sm font-semibold text-foreground">01-Apr-2026</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Work Location</span>
                <p className="text-sm font-semibold text-foreground">Bengaluru Technology Hub</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Employment Type</span>
                <p className="text-sm font-semibold text-foreground">Full-Time / Intern</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Probation Status</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                  Confirmed Employee
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 7: Forms, Documents & Letters */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Forms Section */}
            <Card className="rounded-2xl border p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-heading font-bold text-foreground">Forms</h3>
                  <p className="text-xs text-rose-500 font-medium">Note: File size must be less than or equal to 2MB</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info('Form upload dialog')}>
                  <Upload className="h-3.5 w-3.5" /> Upload Form
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {sampleForms.map(f => (
                  <div key={f.name} className="p-4 rounded-xl border bg-muted/20 flex flex-col justify-between space-y-3">
                    <div className="flex items-start gap-2.5">
                      <FileCheck2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{f.size} · {f.date}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => toast.success(`Downloaded ${f.name}`)}>
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Document Vault Section */}
            <Card className="rounded-2xl border p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-heading font-bold text-foreground">Document</h3>
                  <p className="text-xs text-rose-500 font-medium">Note: File size must be less than or equal to 2MB</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info('Document upload dialog')}>
                  <Upload className="h-3.5 w-3.5" /> Upload Document
                </Button>
              </div>

              {docs.length === 0 ? (
                <div className="p-8 text-center border rounded-xl bg-muted/10">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No custom documents uploaded yet</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="p-3.5 rounded-xl border bg-muted/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">{doc.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.document_type} · {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => downloadDoc(doc)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Letters Section */}
            <Card className="rounded-2xl border p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-heading font-bold text-foreground">Letters</h3>
                  <p className="text-xs text-rose-500 font-medium">Note: File size must be less than or equal to 2MB</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {sampleLetters.map(l => (
                  <div key={l.name} className="p-4 rounded-xl border bg-muted/20 flex flex-col justify-between space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Award className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">{l.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{l.size} · {l.date}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => toast.success(`Downloaded ${l.name}`)}>
                      <Download className="h-3 w-3 mr-1" /> View & Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* View History / Audit Log Modal */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Profile Audit History
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-3 border-y">
              {[
                { event: 'Profile photo updated', date: 'Today at 11:45 AM', user: 'Self' },
                { event: 'Emergency contact verified', date: '10-Aug-2026', user: 'Self' },
                { event: 'PAN & Bank details validated', date: '01-Apr-2026', user: 'Admin (Sachin Shetty)' },
                { event: 'Account provisioned & approved', date: '01-Apr-2026', user: 'HR Desk' },
              ].map((h, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{h.event}</p>
                    <p className="text-[10px] text-muted-foreground">Modified by: {h.user}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{h.date}</span>
                </div>
              ))}
            </div>
            <Button size="sm" className="w-full text-xs" onClick={() => setHistoryOpen(false)}>
              Close
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
