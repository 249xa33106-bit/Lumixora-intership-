import React, { useState } from 'react';
import { 
  LumixoraApplication, 
  ApplicationStatus, 
  UserSession 
} from '../types';
import { LUMIXORA_ROLES } from '../data/mockData';
import { 
  updateApplicationStatus, 
  addReviewerNote, 
  deleteApplication, 
  resetApplicationsToDefault,
  authenticateAdmin,
  ADMIN_CREDENTIALS
} from '../lib/storage';
import { 
  Users, 
  Search, 
  Download, 
  Star, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Trash2, 
  RefreshCw, 
  MessageSquare, 
  Lock, 
  Eye,
  Award,
  Mail,
  Database,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sparkles,
  LogIn,
  LogOut,
  User,
  Settings,
  Send,
  Check
} from 'lucide-react';
import { auth, githubAuthProvider, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { 
  generateConfirmationEmailHtml, 
  getGmailComposeUrl, 
  getMailtoUrl, 
  downloadEmailAsEml,
  getEmailSettings,
  saveEmailSettings,
  testSendEmail,
  EmailSettings
} from '../lib/emailService';

interface SubmissionsDashboardProps {
  applications: LumixoraApplication[];
  onRefresh: () => void;
  session: UserSession;
  onOpenLogin: () => void;
  onLoginSuccess?: (session: UserSession) => void;
  onLogout?: () => void;
  onOpenCandidateAuth?: () => void;
  onGoToCandidatePortal?: () => void;
}

export const SubmissionsDashboard: React.FC<SubmissionsDashboardProps> = ({
  applications,
  onRefresh,
  session,
  onOpenLogin,
  onLoginSuccess,
  onLogout,
  onOpenCandidateAuth,
  onGoToCandidatePortal,
}) => {
  // Admin login gate state
  const [adminEmail, setAdminEmail] = useState('Sowban');
  const [adminPassword, setAdminPassword] = useState('shaik@2006');
  const [adminRole, setAdminRole] = useState<'lead_manager' | 'reviewer'>('lead_manager');
  const [adminName, setAdminName] = useState('Sowban');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'rating_desc'>('date_desc');
  const [activeCandidate, setActiveCandidate] = useState<LumixoraApplication | null>(null);

  // Reviewer form state
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteRating, setNewNoteRating] = useState<number>(5);
  const [interviewDateInput, setInterviewDateInput] = useState('2025-03-01 at 4:00 PM IST');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(getEmailSettings());
  const [testEmailRecipient, setTestEmailRecipient] = useState(session.email || '249xa33106@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRunEmailTest = async () => {
    if (!testEmailRecipient.trim()) return;
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await testSendEmail(testEmailRecipient.trim());
      setTestResult(res);
      if (res.success) {
        showToast('Email test completed');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailSettings(emailSettings);
    showToast('Email dispatch settings saved');
    setShowSettingsModal(false);
  };

  // Metrics
  const totalCount = applications.length;
  const marketingCount = applications.filter((a) => a.preferredRole === 'marketing').length;
  const testingCount = applications.filter((a) => a.preferredRole === 'software_testing').length;
  const contentCount = applications.filter((a) => a.preferredRole === 'content_creation').length;
  const researchCount = applications.filter((a) => a.preferredRole === 'research').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  // Filter
  const filteredApps = applications
    .filter((app) => {
      if (selectedRole !== 'all' && app.preferredRole !== selectedRole) return false;
      if (selectedStatus !== 'all' && app.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = app.fullName.toLowerCase().includes(q);
        const matchesEmail = app.email.toLowerCase().includes(q);
        const matchesCollege = app.collegeName.toLowerCase().includes(q);
        const matchesRef = app.refId.toLowerCase().includes(q);
        const matchesSkills = app.relevantSkills.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesCollege && !matchesRef && !matchesSkills) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const handleStatusChange = (status: ApplicationStatus, interviewDate?: string) => {
    if (!activeCandidate) return;
    const updated = updateApplicationStatus(activeCandidate.id, status, interviewDate);
    if (updated) {
      setActiveCandidate(updated);
      onRefresh();
      showToast(`Status updated to "${status.replace('_', ' ').toUpperCase()}"`);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate || !newNoteText.trim()) return;

    const authorName = session.isLoggedIn ? session.name : 'Reviewer';
    const authorRole = session.isLoggedIn
      ? session.role === 'lead_manager'
        ? 'Hiring Lead'
        : 'Team Reviewer'
      : 'Guest Reviewer';

    const updated = addReviewerNote(activeCandidate.id, newNoteText.trim(), authorName, authorRole, newNoteRating);
    if (updated) {
      setActiveCandidate(updated);
      setNewNoteText('');
      onRefresh();
      showToast('Evaluation note added');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this applicant submission?')) {
      deleteApplication(id);
      setActiveCandidate(null);
      onRefresh();
      showToast('Application deleted');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset applications to sample Batch 01 cohort?')) {
      resetApplicationsToDefault();
      onRefresh();
      showToast('Reset to sample dataset');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Reference ID',
      'Full Name',
      'Email',
      'Phone',
      'Preferred Role',
      'College',
      'Degree & Branch',
      'Year of Study',
      'City & State',
      'Hours Per Week',
      '6-Week Commitment',
      'Status',
      'Rating',
      'Created At',
    ];

    const rows = filteredApps.map((a) => [
      a.refId,
      `"${a.fullName.replace(/"/g, '""')}"`,
      a.email,
      a.phone,
      `"${a.preferredRoleTitle}"`,
      `"${a.collegeName.replace(/"/g, '""')}"`,
      `"${a.degreeAndBranch.replace(/"/g, '""')}"`,
      a.currentYearOfStudy,
      `"${a.cityAndState.replace(/"/g, '""')}"`,
      `"${a.hoursPerWeek}"`,
      a.canCommitSixWeeks ? 'Yes' : 'No',
      a.status,
      a.rating || 'N/A',
      new Date(a.createdAt).toISOString().split('T')[0],
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lumixora_batch01_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file');
  };

  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'under_review':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'shortlisted':
        return 'bg-violet-50 text-violet-800 border-violet-200 font-semibold';
      case 'interview_scheduled':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'accepted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  // Check if current session has Admin privileges
  const isAdmin = session.isLoggedIn && session.userType === 'admin';

  const handleQuickAdminLogin = (role: 'lead_manager' | 'reviewer') => {
    const s: UserSession = role === 'lead_manager'
      ? { isLoggedIn: true, userType: 'admin', name: 'Aakash Sen', email: 'aakash.sen@vyomra.com', role: 'lead_manager' }
      : { isLoggedIn: true, userType: 'admin', name: 'Meera Iyer', email: 'meera.iyer@vyomra.com', role: 'reviewer' };
    if (onLoginSuccess) {
      onLoginSuccess(s);
      showToast(`Signed in as ${s.name}`);
    }
  };

  const handleLoginAsSowban = () => {
    const result = authenticateAdmin(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
    if (result.session && onLoginSuccess) {
      onLoginSuccess(result.session);
      showToast('Signed in as Sowban (Admin)');
    }
  };

  const handleCustomAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    const result = authenticateAdmin(adminEmail, adminPassword);
    if (!result.success || !result.session) {
      setAdminAuthError(result.error || 'Authentication failed.');
      return;
    }
    if (onLoginSuccess) {
      onLoginSuccess(result.session);
      showToast(`Welcome back, ${result.session.name}`);
    }
  };

  const handleSocialAdminLogin = async (providerType: 'github' | 'google') => {
    setIsAuthenticating(true);
    setAdminAuthError('');
    try {
      const provider = providerType === 'github' ? githubAuthProvider : googleAuthProvider;
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const s: UserSession = {
        isLoggedIn: true,
        userType: 'admin',
        name: u.displayName || u.email?.split('@')[0] || 'Staff Admin',
        email: u.email || 'admissions@vyomra.com',
        role: 'lead_manager',
      };
      if (onLoginSuccess) {
        onLoginSuccess(s);
        showToast(`Signed in as ${s.name}`);
      }
    } catch (err: any) {
      console.warn('Social admin auth notice:', err);
      setAdminAuthError('Authentication window closed. You can use 1-Click Fast Admin Sign-In below.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // If user is not logged in as Admin, show dedicated Admin Gate
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-900 relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-violet-300 flex items-center justify-center mx-auto mb-3 shadow-md shadow-slate-900/10">
              <Lock className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-3 py-0.5 rounded-full inline-block mb-1.5">
              LUMIXORA • VYOMRA ADMISSIONS
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Admin &amp; Admissions Sign-In
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
              Candidate submissions and evaluation scorecards for Batch 01 are protected. Please authenticate as an authorized administrator to access candidate data.
            </p>
          </div>

          {/* Candidate Notice if currently signed in as candidate */}
          {session.isLoggedIn && session.userType === 'candidate' && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <User className="w-4 h-4 text-amber-700" />
                <span>Currently Signed in as Candidate ({session.name})</span>
              </div>
              <p className="text-amber-800 text-[11px] mb-3">
                Candidate submissions are restricted to admissions staff. If you are an applicant, view your status in the Candidate Portal.
              </p>
              {onGoToCandidatePortal && (
                <button
                  onClick={onGoToCandidatePortal}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
                >
                  Go to Candidate Portal →
                </button>
              )}
            </div>
          )}

          {adminAuthError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {adminAuthError}
            </div>
          )}

          {/* Official Admin Account Box */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Official Admin Account</span>
              </span>
              <span className="text-[10px] bg-violet-500/20 text-violet-200 border border-violet-400/30 px-2 py-0.5 rounded-full font-semibold">
                Lead Manager
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans uppercase">Username</span>
                <strong className="text-white">Sowban</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans uppercase">Password</span>
                <strong className="text-violet-300">shaik@2006</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoginAsSowban}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/30 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>1-Click Sign In as Sowban (Admin)</span>
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleCustomAdminLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Username or Work Email
              </label>
              <input
                type="text"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Sowban or sowban@lumixora.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="shaik@2006"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Password: <code className="text-violet-700 font-mono">shaik@2006</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4 text-violet-400" />
              <span>Enter Submissions Dashboard</span>
            </button>
          </form>

          {/* Social Sign In */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => handleSocialAdminLogin('google')}
              disabled={isAuthenticating}
              className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google Staff</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialAdminLogin('github')}
              disabled={isAuthenticating}
              className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Staff</span>
            </button>
          </div>

          {/* Switch to Candidate Login & Register */}
          {onOpenCandidateAuth && (
            <div className="mt-6 p-4 rounded-2xl bg-violet-50/70 border border-violet-200 text-center">
              <span className="text-xs text-slate-600 block mb-1 font-medium">
                Are you an applicant applying for Lumixora Batch 01?
              </span>
              <button
                type="button"
                onClick={onOpenCandidateAuth}
                className="text-xs font-bold text-violet-700 hover:text-violet-900 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Candidate Register &amp; Student Login →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Admin Status Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md shadow-slate-900/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-white shadow-xs">
            {session.name ? session.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{session.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/30 text-violet-300 border border-violet-400/30 uppercase">
                {session.role === 'lead_manager' ? 'Admissions Lead (Super Admin)' : 'Technical Reviewer'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{session.email} • Authenticated Admin Access</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-300" />
              <span>Sign Out Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              LUMIXORA • VYOMRA
            </span>
            <span className="text-xs text-slate-500 font-semibold">Admissions &amp; Review Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Batch 01 Submissions Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate applicants across the 4 internship tracks (10 total cohort positions).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://console.firebase.google.com/project/gen-lang-client-0259867406/firestore/databases/ai-studio-internshipapplic-0e39c329-1f8d-4dad-860c-99676d3dbce3/data"
            target="_blank"
            rel="noopener noreferrer"
            title="Open live Firestore Database in Firebase Console"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-colors shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-violet-600" />
            <span>Firestore Console</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Configure automated email dispatch or test send"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <span>Email Dispatch</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleResetData}
            title="Reset to sample dataset"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Applicants</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Batch 01 pool</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Marketing (3)</span>
          <div className="text-2xl font-extrabold text-violet-900 mt-1">{marketingCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Growth &amp; Social</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Software QA (3)</span>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{testingCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Testing &amp; Audits</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Content (2)</span>
          <div className="text-2xl font-extrabold text-indigo-900 mt-1">{contentCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Copy &amp; Media</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Research (2)</span>
          <div className="text-2xl font-extrabold text-purple-900 mt-1">{researchCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Market Intelligence</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Selected / Offers</span>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{acceptedCount} / 10</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cohort capacity</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate name, college, email, ref code, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-violet-600"
            >
              <option value="all">All Statuses ({applications.length})</option>
              <option value="pending">Pending Queue</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="accepted">Selected / Accepted</option>
              <option value="rejected">Not Selected</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-violet-600"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="rating_desc">Highest Rating</option>
            </select>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              selectedRole === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Roles ({applications.length})
          </button>
          {LUMIXORA_ROLES.map((role) => {
            const count = applications.filter((a) => a.preferredRole === role.id).length;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{role.title}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No applications match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">College &amp; Year</th>
                  <th className="py-3.5 px-4">Commitment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setActiveCandidate(app)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {app.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                            {app.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {app.refId} • {app.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {app.preferredRoleTitle}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 line-clamp-1">{app.collegeName}</div>
                      <div className="text-[11px] text-slate-400">
                        {app.degreeAndBranch} ({app.currentYearOfStudy})
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{app.hoursPerWeek}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        {app.canCommitSixWeeks ? '6-Week: Yes' : '6-Week: No'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${getStatusBadgeStyle(app.status)}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {app.rating ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{app.rating}.0</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unrated</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCandidate(app);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white transition-colors cursor-pointer font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Inspection Drawer / Modal */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 text-slate-900">
            {/* Close */}
            <button
              onClick={() => setActiveCandidate(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Candidate Header */}
            <div className="flex items-start gap-4 border-b border-slate-100 pb-5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-violet-700 text-white font-bold flex items-center justify-center text-xl shadow-md">
                {activeCandidate.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                    {activeCandidate.refId}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(activeCandidate.status)}`}>
                    {activeCandidate.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{activeCandidate.fullName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Role: <strong className="text-violet-700">{activeCandidate.preferredRoleTitle}</strong> • {activeCandidate.cityAndState}
                </p>
                <p className="text-xs text-slate-500">
                  {activeCandidate.email} • {activeCandidate.phone}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={getGmailComposeUrl(activeCandidate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                    title="Send official email to candidate via Gmail"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via Gmail</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-violet-600" />
                    <span>Preview Letter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadEmailAsEml(activeCandidate)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download .eml</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status Change Buttons */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Admissions Status Workflow
                </span>
                <span className="text-xs text-slate-500">
                  Current: <strong className="text-slate-800 uppercase">{activeCandidate.status.replace('_', ' ')}</strong>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('under_review')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-600 hover:text-white border border-blue-200 transition-colors"
                >
                  Mark Under Review
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('shortlisted')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 text-violet-800 hover:bg-violet-600 hover:text-white border border-violet-200 transition-colors"
                >
                  Shortlist for Batch 01
                </button>
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-800 hover:bg-purple-600 hover:text-white border border-purple-200 transition-colors flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Interview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('accepted')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Select for Batch 01</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('rejected')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors"
                >
                  Reject
                </button>
              </div>

              {showInterviewModal && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={interviewDateInput}
                    onChange={(e) => setInterviewDateInput(e.target.value)}
                    placeholder="e.g. 2025-03-01 at 4:00 PM IST"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                  <button
                    onClick={() => {
                      handleStatusChange('interview_scheduled', interviewDateInput);
                      setShowInterviewModal(false);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowInterviewModal(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Questions & Candidate Responses */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Academic &amp; Commitment Details
                </h4>
                <div><span className="text-slate-500">College / University:</span> <strong className="text-slate-800">{activeCandidate.collegeName}</strong></div>
                <div><span className="text-slate-500">Degree &amp; Branch:</span> <span className="text-slate-800">{activeCandidate.degreeAndBranch}</span></div>
                <div><span className="text-slate-500">Current Year of Study:</span> <span className="text-slate-800">{activeCandidate.currentYearOfStudy}</span></div>
                <div><span className="text-slate-500">Hours per week commitment:</span> <strong className="text-violet-700">{activeCandidate.hoursPerWeek}</strong></div>
                <div><span className="text-slate-500">Full 6-week program commitment:</span> <strong className="text-emerald-700">{activeCandidate.canCommitSixWeeks ? 'Yes' : 'No'}</strong></div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
                  9. Why do you want to join Lumixora?
                </h4>
                <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200">
                  &ldquo;{activeCandidate.whyJoinLumixora}&rdquo;
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
                  10. What relevant skills can you contribute?
                </h4>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {activeCandidate.relevantSkills}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
                  16. What do you hope to learn from this internship?
                </h4>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {activeCandidate.hopeToLearn}
                </p>
              </div>

              {activeCandidate.previousExperience && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
                    13. Previous Experience &amp; Projects
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {activeCandidate.previousExperience}
                  </p>
                </div>
              )}

              {/* Links */}
              {(activeCandidate.linkedinUrl || activeCandidate.portfolioOrWorkUrl) && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Portfolio &amp; External Profiles
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {activeCandidate.linkedinUrl && (
                      <a
                        href={activeCandidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-700 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>LinkedIn: {activeCandidate.linkedinUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {activeCandidate.portfolioOrWorkUrl && (
                      <a
                        href={activeCandidate.portfolioOrWorkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-700 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Portfolio / Work Samples: {activeCandidate.portfolioOrWorkUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Internal Reviewer Feedback */}
            <div className="border-t border-slate-200 pt-5 mt-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-violet-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Internal Evaluator Notes ({activeCandidate.reviewerNotes.length})
                </h4>
              </div>

              <form onSubmit={handleAddNote} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Leave candidate note &amp; score:</span>
                  <div className="flex items-center gap-1 text-xs text-amber-500">
                    <span className="text-slate-500 mr-1">Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewNoteRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            star <= newNoteRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record interview notes or portfolio remarks..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Save Evaluator Note
                  </button>
                </div>
              </form>

              {activeCandidate.reviewerNotes.length > 0 && (
                <div className="space-y-2">
                  {activeCandidate.reviewerNotes.map((note) => (
                    <div key={note.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900">{note.author}</strong>
                          <span className="text-[10px] text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-200">
                            {note.authorRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {note.rating && (
                            <span className="text-amber-600 font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-current" /> {note.rating}.0
                            </span>
                          )}
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleDelete(activeCandidate.id)}
                className="text-rose-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Submission</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCandidate(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Email Preview Modal */}
      {showEmailModal && activeCandidate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto text-left">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-violet-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Automated Confirmation Email Log</h3>
                <p className="text-xs text-slate-500">
                  Dispatched to applicant upon submission via Firebase Mail Service
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs space-y-1">
              <div><strong className="text-slate-700">From:</strong> Lumixora Admissions &lt;admissions@vyomra.com&gt;</div>
              <div><strong className="text-slate-700">To:</strong> {activeCandidate.email}</div>
              <div><strong className="text-slate-700">Subject:</strong> {generateConfirmationEmailHtml(activeCandidate).subject}</div>
              <div><strong className="text-slate-700">Batch:</strong> Batch 01 (6 Weeks Remote)</div>
            </div>

            {/* Email HTML Container */}
            <div 
              className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-2"
              dangerouslySetInnerHTML={{ __html: generateConfirmationEmailHtml(activeCandidate).html }}
            />

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={getGmailComposeUrl(activeCandidate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Gmail</span>
                </a>

                <button
                  type="button"
                  onClick={() => downloadEmailAsEml(activeCandidate)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .eml</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Email Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Dispatch Configuration & Test Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto text-left">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Email Delivery &amp; Dispatch Settings</h3>
                <p className="text-xs text-slate-500">Configure how confirmation and interview emails reach applicants</p>
              </div>
            </div>

            <form onSubmit={handleSaveEmailConfig} className="space-y-4 mt-5">
              {/* Delivery Mode Info Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>1-Click Gmail &amp; .eml Delivery are Always Active</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Every applicant sees an instant &ldquo;Open &amp; Send in Gmail&rdquo; and &ldquo;Download .eml&rdquo; button immediately upon submitting. You can also send directly to them from the reviewer drawer.
                </p>
              </div>

              {/* Automated Provider Option */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Automated Background Dispatch Provider
                </label>
                <select
                  value={emailSettings.provider}
                  onChange={(e) => setEmailSettings({ ...emailSettings, provider: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-600"
                >
                  <option value="auto">Auto-detect (Netlify Functions / Fallback)</option>
                  <option value="resend">Resend API (Recommended for 100% automated delivery)</option>
                  <option value="webhook">Custom Webhook (Zapier / Make / n8n / Netlify)</option>
                  <option value="gmail_direct">Direct Gmail 1-Click (No API key needed)</option>
                </select>
              </div>

              {emailSettings.provider === 'resend' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Resend API Key
                  </label>
                  <input
                    type="password"
                    value={emailSettings.resendApiKey || ''}
                    onChange={(e) => setEmailSettings({ ...emailSettings, resendApiKey: e.target.value })}
                    placeholder="re_123456789..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Free keys from <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-violet-600 underline">resend.com</a> send up to 3,000 emails/month free.
                  </p>
                </div>
              )}

              {emailSettings.provider === 'webhook' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Custom Webhook URL
                  </label>
                  <input
                    type="url"
                    value={emailSettings.webhookUrl || ''}
                    onChange={(e) => setEmailSettings({ ...emailSettings, webhookUrl: e.target.value })}
                    placeholder="https://hooks.zapier.com/... or https://maker.ifttt.com/..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={emailSettings.senderName || 'Lumixora Admissions'}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Official Admissions Email
                  </label>
                  <input
                    type="email"
                    value={emailSettings.senderEmail || 'admissions@vyomra.com'}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Test Email Section */}
              <div className="mt-5 pt-4 border-t border-slate-200">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Test Email Dispatcher
                </span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="Enter email to test (e.g. 249xa33106@gmail.com)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleRunEmailTest}
                    disabled={isSendingTest || !testEmailRecipient.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSendingTest ? 'Testing...' : 'Send Test'}
                  </button>
                </div>

                {testResult && (
                  <div className={`mt-2.5 p-3 rounded-xl text-xs border ${testResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
                    <div className="font-bold">{testResult.success ? 'Test Successful' : 'Notice / Error'}</div>
                    <div className="text-[11px] mt-0.5">{testResult.message}</div>
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm"
                >
                  Save Dispatch Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
