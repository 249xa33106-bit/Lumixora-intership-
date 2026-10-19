import React, { useState } from 'react';
import { ActiveView, UserSession } from '../types';
import { 
  Sparkles, 
  Search, 
  Send, 
  Users, 
  FileText, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Menu, 
  X,
  Database,
  User,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  pendingCount: number;
  session: UserSession;
  onOpenAdminLogin: () => void;
  onOpenCandidateAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  dbConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  pendingCount,
  session,
  onOpenAdminLogin,
  onOpenCandidateAuth,
  onLogout,
  dbConnected = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = session.isLoggedIn && session.userType === 'admin';
  const isCandidate = session.isLoggedIn && session.userType === 'candidate';

  let navItems: { id: ActiveView; label: string; icon: any; badge?: number }[] = [
    { id: 'apply', label: 'Application Form', icon: Send },
    { id: 'tracker', label: 'Track Status', icon: Search },
    { id: 'terms', label: 'Terms & Compensation', icon: FileText },
    { id: 'privacy', label: 'Privacy Notice', icon: ShieldCheck },
  ];

  if (isAdmin) {
    navItems = [
      { 
        id: 'submissions', 
        label: 'Batch 01 Submissions', 
        icon: Users,
        badge: pendingCount > 0 ? pendingCount : undefined 
      },
      ...navItems,
    ];
  } else if (isCandidate) {
    navItems = [
      { id: 'candidate_portal', label: 'My Application', icon: UserCheck },
      ...navItems,
    ];
  } else {
    navItems = [
      ...navItems,
      { id: 'submissions', label: 'Admin Portal', icon: Lock },
    ];
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Tagline */}
          <div 
            onClick={() => {
              setActiveView('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Lumixora Violet & Navy Symbol */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-700 flex items-center justify-center text-white shadow-md shadow-violet-500/10 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-violet-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  LUMIXORA
                </span>
                <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Batch 01
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                A product of <strong className="text-slate-700">VYOMRA</strong> • <span className="text-violet-600 font-semibold italic">Connecting the Future.</span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-violet-50 text-violet-700 border border-violet-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action & Reviewer Section */}
          <div className="hidden sm:flex items-center gap-2.5">
            {dbConnected && (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200" title="Connected to Google Cloud Firestore">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Firestore</span>
              </span>
            )}

            {/* Authenticated User */}
            {session.isLoggedIn ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pr-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white uppercase shadow-xs ${
                  isAdmin ? 'bg-gradient-to-tr from-slate-900 to-violet-700' : 'bg-gradient-to-tr from-violet-600 to-indigo-600'
                }`}>
                  {session.name ? session.name.slice(0, 2) : 'US'}
                </div>
                <div 
                  onClick={() => {
                    if (isCandidate) {
                      setActiveView('candidate_portal');
                    } else if (isAdmin) {
                      setActiveView('submissions');
                    }
                  }}
                  className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">{session.name}</div>
                  <div className="text-[10px] text-violet-600 font-medium">
                    {isAdmin 
                      ? (session.role === 'lead_manager' ? '👑 Admissions Lead' : '🔍 Evaluator') 
                      : '🎓 Candidate Account'}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="ml-2 p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Guest Actions: Candidate Login & Separate Admin Login */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCandidateAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                >
                  <User className="w-3.5 h-3.5 text-violet-600" />
                  <span>Candidate Login</span>
                </button>

                <button
                  onClick={onOpenAdminLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-violet-600" />
                  <span>Admin Login</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setActiveView('apply');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 transition-all active:scale-95 cursor-pointer"
            >
              <span>Apply for Batch 01</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-5 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-violet-600" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-slate-200 space-y-2">
            {session.isLoggedIn ? (
              <div className="flex items-center justify-between w-full p-2 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-700">
                  Signed in as <strong className="text-slate-900">{session.name}</strong> ({session.userType === 'admin' ? 'Admin' : 'Candidate'})
                </span>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenCandidateAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="text-center py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Candidate Login
                </button>
                <button
                  onClick={() => {
                    onOpenAdminLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="text-center py-2 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl"
                >
                  Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

