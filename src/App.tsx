import { useState, useEffect } from 'react';
import { ActiveView, LumixoraApplication, UserSession } from './types';
import { 
  getStoredApplications, 
  getStoredApplicationsAsync,
  getStoredSession, 
  saveStoredSession, 
  clearStoredSession 
} from './lib/storage';
import { testFirebaseConnection } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { ApplicationForm } from './components/ApplicationForm';
import { ApplicationStatusTracker } from './components/ApplicationStatusTracker';
import { SubmissionsDashboard } from './components/SubmissionsDashboard';
import { InternshipTerms } from './components/InternshipTerms';
import { PrivacyNotice } from './components/PrivacyNotice';
import { LoginModal } from './components/LoginModal';
import { CandidateAuthModal } from './components/CandidateAuthModal';
import { CandidatePortal } from './components/CandidatePortal';
import { 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Heart, 
  Calendar,
  Globe,
  Users
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('apply');
  const [applications, setApplications] = useState<LumixoraApplication[]>([]);
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    userType: 'candidate',
    name: '',
    email: '',
    role: 'reviewer',
  });
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isCandidateAuthOpen, setIsCandidateAuthOpen] = useState(false);
  const [candidateAuthMode, setCandidateAuthMode] = useState<'login' | 'register'>('login');
  const [trackerRefId, setTrackerRefId] = useState('');
  const [dbConnected, setDbConnected] = useState(true);

  // Initial load
  useEffect(() => {
    // 1. Instant local render
    const localApps = getStoredApplications();
    setApplications(localApps);

    const savedSession = getStoredSession();
    if (savedSession.isLoggedIn) {
      setSession(savedSession);
    }

    // 2. Test Firebase and query remote Firestore
    testFirebaseConnection().then((connected) => {
      setDbConnected(connected);
      if (connected) {
        getStoredApplicationsAsync().then((remoteApps) => {
          setApplications(remoteApps);
        }).catch((err) => {
          console.warn('Firestore initial sync notice:', err);
        });
      }
    });
  }, []);

  const refreshApplications = () => {
    getStoredApplicationsAsync()
      .then((remoteApps) => {
        setApplications(remoteApps);
      })
      .catch(() => {
        setApplications(getStoredApplications());
      });
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    saveStoredSession(newSession);
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession({
      isLoggedIn: false,
      userType: 'candidate',
      name: '',
      email: '',
      role: 'reviewer',
    });
    if (activeView === 'submissions' || activeView === 'candidate_portal') {
      setActiveView('apply');
    }
  };

  const handleOpenCandidateAuth = (mode: 'login' | 'register' = 'login') => {
    setCandidateAuthMode(mode);
    setIsCandidateAuthOpen(true);
  };

  const handleApplicationSubmitted = (refId: string) => {
    refreshApplications();
    setTrackerRefId(refId);
    setActiveView('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingCount={pendingCount}
        session={session}
        onOpenAdminLogin={() => setIsAdminAuthOpen(true)}
        onOpenCandidateAuth={(mode) => handleOpenCandidateAuth(mode || 'login')}
        onLogout={handleLogout}
        dbConnected={dbConnected}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {activeView === 'apply' && (
          <ApplicationForm
            session={session}
            onOpenCandidateAuth={(mode) => handleOpenCandidateAuth(mode || 'login')}
            onLoginSuccess={handleLoginSuccess}
            onSuccessSubmitted={handleApplicationSubmitted}
            onViewTerms={() => {
              setActiveView('terms');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewPrivacy={() => {
              setActiveView('privacy');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'candidate_portal' && (
          <CandidatePortal
            session={session}
            applications={applications}
            onGoToApply={() => {
              setActiveView('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={handleLogout}
            onOpenAdminLogin={() => setIsAdminAuthOpen(true)}
          />
        )}

        {activeView === 'tracker' && (
          <ApplicationStatusTracker
            initialRefId={trackerRefId}
            onGoToApply={() => {
              setActiveView('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'submissions' && (
          <SubmissionsDashboard
            applications={applications}
            onRefresh={refreshApplications}
            session={session}
            onOpenLogin={() => setIsAdminAuthOpen(true)}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onOpenCandidateAuth={() => handleOpenCandidateAuth('login')}
            onGoToCandidatePortal={() => {
              setActiveView('candidate_portal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'terms' && (
          <InternshipTerms
            onBackToApply={() => {
              setActiveView('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'privacy' && (
          <PrivacyNotice
            onBackToApply={() => {
              setActiveView('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Candidate Register & Login Modal */}
      <CandidateAuthModal
        isOpen={isCandidateAuthOpen}
        initialMode={candidateAuthMode}
        onClose={() => setIsCandidateAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onNavigateToApply={() => {
          setActiveView('apply');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToTracker={(refId) => {
          setTrackerRefId(refId);
          setActiveView('tracker');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Separate Admin Login Modal */}
      <LoginModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onLoginSuccess={(s) => {
          handleLoginSuccess(s);
          setActiveView('submissions');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCandidateAuth={() => handleOpenCandidateAuth('login')}
      />

      {/* Modern Startup Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-violet-700 flex items-center justify-center text-white font-bold">
                  <Sparkles className="w-4 h-4 text-violet-200" />
                </div>
                <span className="font-extrabold text-slate-900 text-base">LUMIXORA</span>
                <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                  Batch 01
                </span>
              </div>
              <p className="text-violet-700 font-semibold italic text-xs mb-2">
                Connecting the Future.
              </p>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm mb-4">
                Lumixora is an innovative technology product of <strong className="text-slate-700">VYOMRA</strong>.
                Our 6-week remote internship provides practical learning, teamwork, and exposure to real-world startup activities.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-600" />
                  <span>Duration: 6 Weeks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mode: 100% Remote</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>10 Cohort Positions</span>
                </div>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="text-slate-900 font-bold uppercase tracking-wider text-[11px] mb-3">
                Admissions Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      setActiveView('apply');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-violet-700 transition-colors cursor-pointer"
                  >
                    Application Form (Batch 01)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveView('tracker');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-violet-700 transition-colors cursor-pointer"
                  >
                    Track Application Status
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveView('submissions');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-violet-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Submissions Review Portal</span>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOpenCandidateAuth('register')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Candidate Register
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsAdminAuthOpen(true)}
                    className="hover:text-violet-700 transition-colors font-semibold text-violet-600 cursor-pointer"
                  >
                    Admin Admissions Sign-in
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Disclaimer */}
            <div>
              <h4 className="text-slate-900 font-bold uppercase tracking-wider text-[11px] mb-3">
                Legal &amp; Transparency
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      setActiveView('terms');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-violet-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Terms &amp; Compensation</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveView('privacy');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-violet-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Candidate Privacy Notice</span>
                  </button>
                </li>
                <li className="pt-2 text-[10px] text-slate-400 leading-normal">
                  Disclaimer: This program is for educational training, practical startup exposure, and portfolio building. Submitting an application does not promise or guarantee selection or future employment.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} LUMIXORA — A product of VYOMRA. All rights reserved.
            </div>
            <div className="flex items-center gap-1">
              <span>Connecting the Future</span>
              <Heart className="w-3 h-3 text-violet-500 fill-current ml-1" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
