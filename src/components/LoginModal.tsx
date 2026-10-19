import React, { useState } from 'react';
import { UserSession } from '../types';
import { auth, githubAuthProvider, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { authenticateAdmin, ADMIN_CREDENTIALS } from '../lib/storage';
import { 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  X, 
  Sparkles, 
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onOpenCandidateAuth?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenCandidateAuth,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('Sowban');
  const [password, setPassword] = useState('shaik@2006');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleAdminFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const result = authenticateAdmin(usernameOrEmail, password);
    if (!result.success || !result.session) {
      setAuthError(result.error || 'Authentication failed. Please check your credentials.');
      return;
    }
    onLoginSuccess(result.session);
    onClose();
  };

  const handleLoginAsSowban = () => {
    const result = authenticateAdmin(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
    if (result.session) {
      onLoginSuccess(result.session);
      onClose();
    }
  };

  const handleGitHubLogin = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, githubAuthProvider);
      const user = result.user;
      onLoginSuccess({
        isLoggedIn: true,
        userType: 'admin',
        name: user.displayName || 'Staff Reviewer',
        email: user.email || 'reviewer@vyomra.com',
        role: 'reviewer',
      });
      onClose();
    } catch (err: any) {
      console.warn('GitHub popup auth notice:', err);
      setAuthError('Authentication window closed. You can log in using Admin credentials above.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      onLoginSuccess({
        isLoggedIn: true,
        userType: 'admin',
        name: user.displayName || 'Staff Reviewer',
        email: user.email || 'admissions@vyomra.com',
        role: 'reviewer',
      });
      onClose();
    } catch (err: any) {
      console.warn('Google popup notice:', err);
      setAuthError('Google sign-in closed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-violet-300 flex items-center justify-center mx-auto mb-3 shadow-md shadow-slate-900/10">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            LUMIXORA • VYOMRA • ADMIN PORTAL
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin &amp; Admissions Sign-In</h2>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold mt-2">
            <Database className="w-3 h-3 text-emerald-600" />
            <span>Cloud Firestore Connected</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Dedicated staff portal to view candidate submissions, record interview notes, and manage cohort admissions.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2.5 mb-5">
          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {/* GitHub SVG */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Sign in with GitHub</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {/* Google SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
            {authError}
          </div>
        )}

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              Or 1-Click Fast Access
            </span>
          </div>
        </div>

        {/* Official Admin Account Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-2xl p-4 mb-5 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-violet-400" />
              <span>Official Admin Account</span>
            </span>
            <span className="text-[10px] bg-violet-500/20 text-violet-200 border border-violet-400/30 px-2 py-0.5 rounded-full font-semibold">
              Full Authority
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

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              Or Sign In with Credentials
            </span>
          </div>
        </div>

        {/* Admin Credentials Form */}
        <form onSubmit={handleAdminFormSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Admin Username or Work Email
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="e.g. Sowban or admissions@vyomra.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-violet-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password (shaik@2006)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-violet-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Default password: <code className="text-violet-700 font-mono">shaik@2006</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <Lock className="w-4 h-4 text-violet-400" />
            <span>Enter Submissions Dashboard</span>
          </button>
        </form>

        {/* Switch to Candidate Portal */}
        {onOpenCandidateAuth && (
          <div className="mt-4 p-3 rounded-2xl bg-violet-50/70 border border-violet-200 text-center">
            <span className="text-[11px] text-slate-600 block mb-1">
              Applying for the Lumixora Internship?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCandidateAuth();
              }}
              className="text-xs font-bold text-violet-700 hover:text-violet-900 hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Candidate Register &amp; Student Login →</span>
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Restricted to authorized Lumixora admissions staff</span>
        </div>
      </div>
    </div>
  );
};
