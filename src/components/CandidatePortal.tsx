import React, { useState } from 'react';
import { UserSession, LumixoraApplication } from '../types';
import { findApplicationByEmail, findApplicationByRefId } from '../lib/storage';
import { 
  generateConfirmationEmailHtml, 
  getGmailComposeUrl, 
  downloadEmailAsEml 
} from '../lib/emailService';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  Send, 
  ShieldCheck, 
  FileText,
  X,
  Download
} from 'lucide-react';

interface CandidatePortalProps {
  session: UserSession;
  applications: LumixoraApplication[];
  onGoToApply: () => void;
  onLogout: () => void;
  onOpenAdminLogin?: () => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  session,
  applications,
  onGoToApply,
  onLogout,
  onOpenAdminLogin,
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Look up candidate application by email or stored refId
  const candidateApp = 
    (session.applicationRefId ? findApplicationByRefId(session.applicationRefId) : null) ||
    (session.email ? findApplicationByEmail(session.email) : null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Submitted & Pending', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'under_review':
        return { text: 'Under Mentor Review', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'shortlisted':
        return { text: 'Shortlisted for Batch 01', bg: 'bg-violet-50 text-violet-800 border-violet-200 font-bold' };
      case 'interview_scheduled':
        return { text: 'Interview Scheduled', bg: 'bg-purple-50 text-purple-800 border-purple-200 font-bold' };
      case 'accepted':
        return { text: 'Offer Issued / Accepted', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' };
      case 'rejected':
        return { text: 'Application Concluded', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
      default:
        return { text: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-xl font-extrabold text-violet-200 shadow-md">
              {session.name ? session.name.slice(0, 2).toUpperCase() : 'CA'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  Candidate Portal
                </span>
                <span className="text-xs text-slate-300">Lumixora Batch 01</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {session.name || 'Applicant'}!
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {session.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            >
              Sign Out
            </button>
            {onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-500/30 hover:bg-violet-500/50 text-violet-100 border border-violet-400/30 transition-all cursor-pointer"
              >
                Admin Login →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {candidateApp ? (
        <div className="space-y-6">
          {/* Active Application Status Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Reference ID
                </span>
                <div className="text-2xl font-mono font-extrabold text-violet-700 mt-0.5">
                  {candidateApp.refId}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Preferred Track: <strong className="text-slate-800">{candidateApp.preferredRoleTitle}</strong>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Current Stage
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${getStatusBadge(candidateApp.status).bg}`}>
                  <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"></span>
                  {getStatusBadge(candidateApp.status).text}
                </span>
              </div>
            </div>

            {/* If interview scheduled */}
            {candidateApp.interviewDate && (
              <div className="mt-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-900">
                    Interview Scheduled with Admissions Team
                  </h4>
                  <p className="text-xs text-purple-800 mt-0.5">
                    Date & Time: <strong>{candidateApp.interviewDate}</strong>
                  </p>
                  <p className="text-[11px] text-purple-700 mt-1">
                    Please ensure you have a working camera and microphone. The meeting link will be emailed to {candidateApp.email}.
                  </p>
                </div>
              </div>
            )}

            {/* Application Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">College & Branch</span>
                <div className="text-xs font-bold text-slate-800">{candidateApp.collegeName}</div>
                <div className="text-[11px] text-slate-500">{candidateApp.degreeAndBranch} ({candidateApp.currentYearOfStudy})</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Weekly Commitment</span>
                <div className="text-xs font-bold text-slate-800">{candidateApp.hoursPerWeek}</div>
                <div className="text-[11px] text-slate-500">Full 6-Week Duration: {candidateApp.canCommitSixWeeks ? 'Yes' : 'No'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Application Date</span>
                <div className="text-xs font-bold text-slate-800">
                  {new Date(candidateApp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Recorded in Firestore</span>
                </div>
              </div>
            </div>

            {/* Email Confirmation Inspection Card */}
            <div className="mt-6 p-5 rounded-2xl bg-violet-50/70 border border-violet-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Official Confirmation Letter
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Generated for {candidateApp.email} [Ref: {candidateApp.refId}]
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={getGmailComposeUrl(candidateApp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in Gmail</span>
                  </a>

                  <button
                    onClick={() => downloadEmailAsEml(candidateApp)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-violet-100/70 text-violet-700 text-xs font-bold border border-violet-200 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .eml</span>
                  </button>

                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View Letter</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Not yet applied */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-4">
            <Send className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">
            You Have Not Submitted an Application Yet
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Your candidate account is registered with {session.email}. Complete the 4-section application form to apply for Lumixora Batch 01 (10 remote positions).
          </p>
          <button
            onClick={onGoToApply}
            className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer active:scale-95 inline-flex items-center gap-2"
          >
            <span>Proceed to Batch 01 Application Form</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Email Preview Modal */}
      {showEmailModal && candidateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-200 my-8">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Official Admissions Confirmation Email</h3>
                <p className="text-xs text-slate-500">Delivered to: {candidateApp.email}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2 max-h-[65vh] overflow-y-auto mb-4">
              <div
                className="bg-white rounded-xl shadow-xs"
                dangerouslySetInnerHTML={{
                  __html: generateConfirmationEmailHtml(candidateApp).html,
                }}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={getGmailComposeUrl(candidateApp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to My Gmail</span>
                </a>

                <button
                  type="button"
                  onClick={() => downloadEmailAsEml(candidateApp)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download .eml</span>
                </button>
              </div>

              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
