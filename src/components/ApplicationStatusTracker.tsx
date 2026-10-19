import React, { useState } from 'react';
import { LumixoraApplication, ApplicationStatus } from '../types';
import { findApplicationByRefId } from '../lib/storage';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Mail,
  X
} from 'lucide-react';
import { generateConfirmationEmailHtml } from '../lib/emailService';

interface ApplicationStatusTrackerProps {
  onGoToApply: () => void;
  initialRefId?: string;
}

export const ApplicationStatusTracker: React.FC<ApplicationStatusTrackerProps> = ({
  onGoToApply,
  initialRefId = '',
}) => {
  const [refIdInput, setRefIdInput] = useState(initialRefId);
  const [emailInput, setEmailInput] = useState('');
  const [searched, setSearched] = useState(Boolean(initialRefId));
  const [application, setApplication] = useState<LumixoraApplication | null>(
    initialRefId ? findApplicationByRefId(initialRefId) : null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    if (!refIdInput.trim()) {
      setErrorMsg('Please enter your Application Reference ID (e.g. LMX-B01-4192)');
      return;
    }

    const found = findApplicationByRefId(refIdInput, emailInput.trim() || undefined);
    setSearched(true);
    if (!found) {
      setApplication(null);
      setErrorMsg(`No application found for reference "${refIdInput.trim().toUpperCase()}". Verify your code or try one of the sample candidate IDs below.`);
    } else {
      setApplication(found);
      setErrorMsg('');
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Application Received',
          desc: 'Your Batch 01 submission is queued for initial profile screening by the admissions committee.',
        };
      case 'under_review':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          label: 'Under Team Review',
          desc: 'Your skills, motivation, and portfolio are being reviewed by the respective role mentor.',
        };
      case 'shortlisted':
        return {
          bg: 'bg-violet-50 text-violet-800 border-violet-200',
          label: 'Shortlisted for Batch 01',
          desc: 'Great news! You have cleared initial screening and are in the shortlisted candidate pool.',
        };
      case 'interview_scheduled':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          label: 'Interview Scheduled',
          desc: 'A 1-on-1 discussion has been coordinated with the Lumixora / VYOMRA team.',
        };
      case 'accepted':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
          label: 'Selected for Batch 01 🎉',
          desc: 'Congratulations! You have been selected for the Lumixora 6-Week Remote Internship.',
        };
      case 'rejected':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'Not Selected for Batch 01',
          desc: 'Due to the strict 10-position batch cap, we could not offer placement for this cycle.',
        };
    }
  };

  const getTimelineSteps = (status: ApplicationStatus) => {
    const order: ApplicationStatus[] = [
      'pending',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'accepted',
    ];

    const currentIdx = order.indexOf(
      status === 'rejected' ? 'under_review' : status
    );

    const steps = [
      { title: 'Application Submitted', sub: 'Details logged into Batch 01' },
      { title: 'Resume & Skill Screening', sub: 'Evaluated by role mentors' },
      { title: 'Shortlist Selection', sub: 'Advanced to interview pool' },
      { title: 'Team Discussion', sub: 'Role fit and sprint expectations' },
      { title: 'Final Onboarding', sub: 'Batch 01 orientation & kickoff' },
    ];

    return steps.map((s, idx) => {
      let state: 'completed' | 'current' | 'upcoming' | 'rejected' = 'upcoming';
      if (status === 'rejected' && idx === currentIdx) {
        state = 'rejected';
      } else if (idx < currentIdx) {
        state = 'completed';
      } else if (idx === currentIdx) {
        state = 'current';
      }
      return { ...s, state };
    });
  };

  const sampleDemoRefs = [
    { label: 'Ananya Sharma (Software Testing)', ref: 'LMX-B01-4192' },
    { label: 'Rohan Mehra (Marketing)', ref: 'LMX-B01-7840' },
    { label: 'Priya Nambiar (Content Creation)', ref: 'LMX-B01-2915' },
    { label: 'Karthik Rao (Research)', ref: 'LMX-B01-9031' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Candidate Status Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Track Your Lumixora Application
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your Application Reference Code to view your real-time review progress for Batch 01.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Application Reference Code *
              </label>
              <input
                type="text"
                placeholder="e.g. LMX-B01-4192"
                value={refIdInput}
                onChange={(e) => setRefIdInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 font-mono text-sm tracking-wide focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Applicant Email (Optional)
              </label>
              <input
                type="email"
                placeholder="registered email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Reference codes follow format LMX-B01-XXXX</span>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Check Application Status</span>
            </button>
          </div>
        </form>

        {/* Demo Fast Fill Pill Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Lookup: Try a sample applicant code:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleDemoRefs.map((item) => (
              <button
                key={item.ref}
                type="button"
                onClick={() => {
                  setRefIdInput(item.ref);
                  setEmailInput('');
                  const found = findApplicationByRefId(item.ref);
                  setSearched(true);
                  setApplication(found);
                  setErrorMsg(found ? '' : 'Not found');
                }}
                className="text-xs bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="font-mono font-bold text-violet-700">{item.ref}</span>
                <span className="text-slate-500">({item.label.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-8 flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold text-rose-900">Application Not Found</div>
            <p className="mt-0.5 text-rose-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {searched && application && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                    {application.refId}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Batch 01 • Applied {new Date(application.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {application.fullName}
                </h2>
                <p className="text-sm font-semibold text-violet-700 mt-0.5">
                  Role: {application.preferredRoleTitle}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {application.collegeName} • {application.degreeAndBranch} ({application.currentYearOfStudy})
                </p>
              </div>

              {/* Status Badge */}
              <div className="sm:text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border uppercase tracking-wider ${getStatusBadge(application.status).bg}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  {getStatusBadge(application.status).label}
                </span>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs sm:ml-auto">
                  {getStatusBadge(application.status).desc}
                </p>
              </div>
            </div>

            {/* If interview scheduled */}
            {application.interviewDate && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-purple-900">
                <Calendar className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-purple-950 text-sm">Admissions Interview Scheduled</h3>
                  <p className="text-xs text-purple-800 mt-0.5">
                    Your 1-on-1 discussion is set for: <strong className="text-purple-950">{application.interviewDate}</strong>
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Check your registered email ({application.email}) for the calendar invitation and meeting link.
                  </p>
                </div>
              </div>
            )}

            {/* Visual Process Stepper */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Admissions Pipeline Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {getTimelineSteps(application.status).map((step, idx) => {
                  const isDone = step.state === 'completed';
                  const isCurrent = step.state === 'current';
                  const isRejected = step.state === 'rejected';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                          : isCurrent
                          ? 'bg-violet-50 border-violet-300 text-violet-900 shadow-xs ring-1 ring-violet-200'
                          : isRejected
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-slate-50/60 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">
                          Step 0{idx + 1}
                        </span>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <Clock className="w-4 h-4 text-violet-600 animate-spin" />
                        ) : isRejected ? (
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-800 line-clamp-1">{step.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{step.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile Overview */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Application Summary
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-900">{application.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-900">{application.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-900">{application.cityAndState}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Weekly Commitment:</span>
                  <span className="font-semibold text-slate-900">{application.hoursPerWeek}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">6-Week Commitment:</span>
                  <span className="font-semibold text-emerald-700">{application.canCommitSixWeeks ? 'Confirmed (Yes)' : 'No'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Skills &amp; Motivation
                </h4>
                <p className="text-slate-600 leading-relaxed mb-3 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                  &ldquo;{application.whyJoinLumixora}&rdquo;
                </p>
                <div className="text-slate-700">
                  <strong className="block text-slate-900 mb-1">Key Skills:</strong>
                  <p className="text-slate-600">{application.relevantSkills}</p>
                </div>
              </div>
            </div>

            {/* Automated Email Confirmation Status Card */}
            <div className="mt-6 p-4 rounded-2xl bg-violet-50/70 border border-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Automated Confirmation Email Dispatched</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">SENT</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Dispatched to <strong className="text-slate-900">{application.email}</strong> via Firebase Cloud Mail Trigger.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-violet-100 border border-violet-200 text-violet-700 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-violet-600" />
                <span>View Email Sent</span>
              </button>
            </div>

            {/* Email Preview Modal */}
            {showEmailModal && (
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
                      <h3 className="text-base font-bold text-slate-900">Official Confirmation Email</h3>
                      <p className="text-xs text-slate-500">Live transactional email triggered via Firebase Firestore Mail Queue</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs space-y-1">
                    <div><strong className="text-slate-700">From:</strong> Lumixora Admissions &lt;admissions@vyomra.com&gt;</div>
                    <div><strong className="text-slate-700">To:</strong> {application.email}</div>
                    <div><strong className="text-slate-700">Subject:</strong> {generateConfirmationEmailHtml(application).subject}</div>
                  </div>

                  {/* Email HTML Container */}
                  <div 
                    className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-2"
                    dangerouslySetInnerHTML={{ __html: generateConfirmationEmailHtml(application).html }}
                  />

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Close Email
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>LUMIXORA — A product of VYOMRA</span>
              <button
                onClick={onGoToApply}
                className="text-violet-700 hover:text-violet-900 font-bold hover:underline flex items-center gap-1"
              >
                <span>Submit another application</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
