import React, { useState } from 'react';
import { UserSession, CandidateUser } from '../types';
import { auth, githubAuthProvider, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { 
  registerCandidateAccount, 
  authenticateCandidateAccount,
  findApplicationByEmail 
} from '../lib/storage';
import { 
  User, 
  Mail, 
  Lock, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface CandidateAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  initialMode?: 'login' | 'register';
  onNavigateToApply?: () => void;
  onNavigateToTracker?: (refId: string) => void;
}

export const CandidateAuthModal: React.FC<CandidateAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  onNavigateToApply,
  onNavigateToTracker,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCollege, setRegCollege] = useState('');
  const [regDegree, setRegDegree] = useState('');
  const [regYear, setRegYear] = useState('3rd Year');
  const [regCityState, setRegCityState] = useState('');

  if (!isOpen) return null;

  const handleCandidateLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    setAuthError('');
    const authRes = authenticateCandidateAccount(loginEmail, loginPassword);
    if (!authRes.success || !authRes.candidate) {
      setAuthError(authRes.error || 'Invalid candidate credentials.');
      return;
    }
    const candidate = authRes.candidate;
    const existingApp = findApplicationByEmail(loginEmail);

    const session: UserSession = {
      isLoggedIn: true,
      userType: 'candidate',
      name: candidate.fullName,
      email: candidate.email,
      candidateProfile: candidate,
      applicationRefId: existingApp ? existingApp.refId : candidate.applicationRefId,
    };

    onLoginSuccess(session);
    onClose();

    if (existingApp && onNavigateToTracker) {
      onNavigateToTracker(existingApp.refId);
    } else if (onNavigateToApply) {
      onNavigateToApply();
    }
  };

  const handleCandidateRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim()) {
      setAuthError('Full Name and Email are required.');
      return;
    }
    setAuthError('');

    const candidate = registerCandidateAccount({
      fullName: regFullName,
      email: regEmail,
      password: regPassword || undefined,
      phone: regPhone,
      collegeName: regCollege,
      degreeAndBranch: regDegree,
      currentYearOfStudy: regYear,
      cityAndState: regCityState,
    });

    const session: UserSession = {
      isLoggedIn: true,
      userType: 'candidate',
      name: candidate.fullName,
      email: candidate.email,
      candidateProfile: candidate,
      applicationRefId: candidate.applicationRefId,
    };

    onLoginSuccess(session);
    onClose();

    if (onNavigateToApply) {
      onNavigateToApply();
    }
  };

  const handleQuickCandidateSelect = (email: string) => {
    const res = authenticateCandidateAccount(email);
    const candidate = res.candidate;
    if (!candidate) return;
    const existingApp = findApplicationByEmail(email);

    const session: UserSession = {
      isLoggedIn: true,
      userType: 'candidate',
      name: candidate.fullName,
      email: candidate.email,
      candidateProfile: candidate,
      applicationRefId: existingApp ? existingApp.refId : candidate.applicationRefId,
    };

    onLoginSuccess(session);
    onClose();

    if (existingApp && onNavigateToTracker) {
      onNavigateToTracker(existingApp.refId);
    } else if (onNavigateToApply) {
      onNavigateToApply();
    }
  };

  const handleSocialCandidateLogin = async (providerType: 'github' | 'google') => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const provider = providerType === 'github' ? githubAuthProvider : googleAuthProvider;
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const email = u.email || `${providerType}-user@lumixora.app`;
      const name = u.displayName || email.split('@')[0];

      const candidate = registerCandidateAccount({
        fullName: name,
        email,
      });

      const existingApp = findApplicationByEmail(email);

      const session: UserSession = {
        isLoggedIn: true,
        userType: 'candidate',
        name: candidate.fullName,
        email: candidate.email,
        candidateProfile: candidate,
        applicationRefId: existingApp ? existingApp.refId : candidate.applicationRefId,
      };

      onLoginSuccess(session);
      onClose();

      if (existingApp && onNavigateToTracker) {
        onNavigateToTracker(existingApp.refId);
      } else if (onNavigateToApply) {
        onNavigateToApply();
      }
    } catch (err: any) {
      console.warn('Social candidate auth notice:', err);
      setAuthError('Sign-in cancelled or closed. You can use 1-click candidate login below.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-slate-900 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            Applicant Portal • Batch 01
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {tab === 'login' ? 'Candidate Sign In' : 'Create Candidate Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {tab === 'login' 
              ? 'Access your Lumixora internship application, check live review status, and view confirmation records.' 
              : 'Register to pre-fill your internship application, track evaluation progress, and receive email updates.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setAuthError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'login' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Candidate Login
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setAuthError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'register' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register / Sign Up
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <span>{authError}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <div>
            {/* 1-Click Fast Candidate Access */}
            <div className="mb-5 p-4 rounded-2xl bg-violet-50/70 border border-violet-200">
              <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-violet-900">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>1-Click Candidate Accounts (Existing Applicants)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickCandidateSelect('ananya.sharma@du.ac.in')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-violet-100/60 border border-violet-200/80 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-violet-700">Ananya Sharma</div>
                    <div className="text-[10px] text-slate-500">QA Testing • Shortlisted</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickCandidateSelect('rohan.mehra@nmims.edu')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-violet-100/60 border border-violet-200/80 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-violet-700">Rohan Mehra</div>
                    <div className="text-[10px] text-slate-500">Marketing • Interview</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleCandidateLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@college.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Demo: any password</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/10 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Sign In to Candidate Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                <span className="bg-white px-2">or social sign-in</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSocialCandidateLogin('google')}
                disabled={isAuthenticating}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialCandidateLogin('github')}
                disabled={isAuthenticating}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER */}
        {tab === 'register' && (
          <form onSubmit={handleCandidateRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Year of Study
                </label>
                <select
                  value={regYear}
                  onChange={(e) => setRegYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-800"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year / Final</option>
                  <option value="Recent Graduate">Recent Graduate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College / University
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. IIT Delhi"
                    value={regCollege}
                    onChange={(e) => setRegCollege(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Degree & Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={regDegree}
                  onChange={(e) => setRegDegree(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City and State
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka"
                  value={regCityState}
                  onChange={(e) => setRegCityState(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/10 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Complete Registration & Continue to Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Student Data Storage</span>
          </div>
          <span>Batch 01 • VYOMRA</span>
        </div>
      </div>
    </div>
  );
};
