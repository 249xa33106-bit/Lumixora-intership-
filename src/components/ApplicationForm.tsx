import React, { useState } from 'react';
import { LumixoraRole, LumixoraApplication, UserSession } from '../types';
import { LUMIXORA_ROLES } from '../data/mockData';
import { submitApplication, registerCandidateAccount, saveStoredSession } from '../lib/storage';
import { sendApplicationConfirmationEmail, generateConfirmationEmailHtml } from '../lib/emailService';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  Info, 
  Calendar, 
  Globe, 
  Users, 
  Award,
  Mail,
  X,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface ApplicationFormProps {
  onSuccessSubmitted: (refId: string) => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
  session?: UserSession;
  onOpenCandidateAuth?: (mode?: 'login' | 'register') => void;
  onLoginSuccess?: (session: UserSession) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  onSuccessSubmitted,
  onViewTerms,
  onViewPrivacy,
  session,
  onOpenCandidateAuth,
  onLoginSuccess,
}) => {
  // Section 1: Personal Details
  const [fullName, setFullName] = useState(session?.candidateProfile?.fullName || session?.name || '');
  const [email, setEmail] = useState(session?.candidateProfile?.email || session?.email || '');
  const [phone, setPhone] = useState(session?.candidateProfile?.phone || '');
  const [collegeName, setCollegeName] = useState(session?.candidateProfile?.collegeName || '');
  const [degreeAndBranch, setDegreeAndBranch] = useState(session?.candidateProfile?.degreeAndBranch || '');
  const [currentYearOfStudy, setCurrentYearOfStudy] = useState(session?.candidateProfile?.currentYearOfStudy || '');
  const [cityAndState, setCityAndState] = useState(session?.candidateProfile?.cityAndState || '');

  React.useEffect(() => {
    if (session?.isLoggedIn && session.userType === 'candidate') {
      if (session.candidateProfile?.fullName || session.name) {
        setFullName(session.candidateProfile?.fullName || session.name);
      }
      if (session.candidateProfile?.email || session.email) {
        setEmail(session.candidateProfile?.email || session.email);
      }
      if (session.candidateProfile?.phone) {
        setPhone(session.candidateProfile.phone);
      }
      if (session.candidateProfile?.collegeName) {
        setCollegeName(session.candidateProfile.collegeName);
      }
      if (session.candidateProfile?.degreeAndBranch) {
        setDegreeAndBranch(session.candidateProfile.degreeAndBranch);
      }
      if (session.candidateProfile?.currentYearOfStudy) {
        setCurrentYearOfStudy(session.candidateProfile.currentYearOfStudy);
      }
      if (session.candidateProfile?.cityAndState) {
        setCityAndState(session.candidateProfile.cityAndState);
      }
    }
  }, [session]);

  // Section 2: Role Selection
  const [preferredRole, setPreferredRole] = useState<LumixoraRole>('marketing');
  const [whyJoinLumixora, setWhyJoinLumixora] = useState('');
  const [relevantSkills, setRelevantSkills] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('15–20 hours/week');
  const [canCommitSixWeeks, setCanCommitSixWeeks] = useState<string>('yes');

  // Section 3: Experience and Portfolio
  const [previousExperience, setPreviousExperience] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioOrWorkUrl, setPortfolioOrWorkUrl] = useState('');
  const [hopeToLearn, setHopeToLearn] = useState('');

  // Section 4: Declaration
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [reviewedTerms, setReviewedTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  // Account creation while applying
  const [createAccount, setCreateAccount] = useState(!session?.isLoggedIn);
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<LumixoraApplication | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const selectedRoleDef = LUMIXORA_ROLES.find((r) => r.id === preferredRole) || LUMIXORA_ROLES[0];

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    // Section 1
    if (!fullName.trim()) errs.fullName = 'Full Name is required';
    if (!email.trim()) {
      errs.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!phone.trim()) errs.phone = 'Phone Number is required';
    if (!collegeName.trim()) errs.collegeName = 'College/University Name is required';
    if (!degreeAndBranch.trim()) errs.degreeAndBranch = 'Degree and Branch are required';
    if (!currentYearOfStudy.trim()) errs.currentYearOfStudy = 'Current Year of Study is required';
    if (!cityAndState.trim()) errs.cityAndState = 'City and State are required';

    // Section 2
    if (!preferredRole) errs.preferredRole = 'Preferred Internship Role is required';
    if (!whyJoinLumixora.trim()) errs.whyJoinLumixora = 'Please tell us why you want to join Lumixora';
    if (!relevantSkills.trim()) errs.relevantSkills = 'Please list relevant skills you can contribute';
    if (!hoursPerWeek.trim()) errs.hoursPerWeek = 'Weekly hours commitment is required';
    if (!canCommitSixWeeks) errs.canCommitSixWeeks = 'Please specify if you can commit to the 6-week program';

    // Section 3
    if (!hopeToLearn.trim()) errs.hopeToLearn = 'Please state what you hope to learn from this internship';

    // Account creation validation
    if (createAccount && !session?.isLoggedIn && accountPassword.trim().length > 0 && accountPassword.trim().length < 4) {
      errs.accountPassword = 'Password must be at least 4 characters';
    }

    // Section 4: Declarations
    if (!confirmedAccurate) errs.confirmedAccurate = 'You must confirm that the information provided is accurate';
    if (!reviewedTerms) errs.reviewedTerms = 'You must review and accept the internship terms and compensation details';
    if (!agreedToPrivacy) errs.agreedToPrivacy = 'You must consent to the privacy notice for recruitment processing';

    setErrors(errs);
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newApp = submitApplication({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        collegeName: collegeName.trim(),
        degreeAndBranch: degreeAndBranch.trim(),
        currentYearOfStudy: currentYearOfStudy.trim(),
        cityAndState: cityAndState.trim(),
        preferredRole,
        preferredRoleTitle: selectedRoleDef.title,
        whyJoinLumixora: whyJoinLumixora.trim(),
        relevantSkills: relevantSkills.trim(),
        hoursPerWeek: hoursPerWeek.trim(),
        canCommitSixWeeks: canCommitSixWeeks === 'yes',
        previousExperience: previousExperience.trim() || '',
        linkedinUrl: linkedinUrl.trim() || '',
        portfolioOrWorkUrl: portfolioOrWorkUrl.trim() || '',
        hopeToLearn: hopeToLearn.trim(),
        confirmedAccurate,
        reviewedTerms,
        agreedToPrivacy,
      });

      // Automatically create candidate user account if chosen or if password is provided
      if (createAccount || (!session?.isLoggedIn && accountPassword.trim())) {
        const candidate = registerCandidateAccount({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: accountPassword.trim() || undefined,
          phone: phone.trim(),
          collegeName: collegeName.trim(),
          degreeAndBranch: degreeAndBranch.trim(),
          currentYearOfStudy: currentYearOfStudy.trim(),
          cityAndState: cityAndState.trim(),
        });

        const candSession: UserSession = {
          isLoggedIn: true,
          userType: 'candidate',
          name: candidate.fullName,
          email: candidate.email,
          candidateProfile: candidate,
          applicationRefId: newApp.refId,
        };

        saveStoredSession(candSession);
        if (onLoginSuccess) {
          onLoginSuccess(candSession);
        }
      }

      // Automatically send transactional confirmation email & queue in Firestore /mail
      sendApplicationConfirmationEmail(newApp).catch((err) => {
        console.warn('Email dispatch notice:', err);
      });

      setSubmittedApp(newApp);
    } catch (err) {
      console.error('Submission caught error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (submittedApp) {
      navigator.clipboard.writeText(submittedApp.refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Demo auto-fill for testing ease
  const handlePreFillDemo = () => {
    setFullName('Aditya Verma');
    setEmail('aditya.verma@vit.ac.in');
    setPhone('+91 98765 43210');
    setCollegeName('Vellore Institute of Technology (VIT)');
    setDegreeAndBranch('B.Tech in Computer Science and Engineering');
    setCurrentYearOfStudy('3rd Year');
    setCityAndState('Bengaluru, Karnataka');
    setPreferredRole('software_testing');
    setWhyJoinLumixora(
      'I am inspired by how Lumixora connects users to future digital capabilities. I want to contribute to the software QA pipeline for Batch 01, ensure seamless user journeys, and gain startup execution discipline.'
    );
    setRelevantSkills(
      'Manual testing, writing boundary value test suites, Postman API collections, Jira bug tracking, and basic Cypress test scripts.'
    );
    setHoursPerWeek('20–25 hours/week');
    setCanCommitSixWeeks('yes');
    setPreviousExperience(
      'Led quality testing for our college club portal with 1,200 active users, filing 25 critical UI and data validation issues.'
    );
    setLinkedinUrl('https://linkedin.com/in/adityaverma-cs');
    setPortfolioOrWorkUrl('https://github.com/adityaverma-qa');
    setHopeToLearn(
      'I want to learn real-world startup QA workflows, cross-functional engineering collaboration, and performance benchmarking under senior mentorship.'
    );
    setConfirmedAccurate(true);
    setReviewedTerms(true);
    setAgreedToPrivacy(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Title & Subtitle Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-violet-100/60 via-indigo-50/40 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Admissions • Batch 01</span>
            </div>
            <button
              type="button"
              onClick={handlePreFillDemo}
              className="text-xs text-violet-600 hover:text-violet-800 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-fill Sample Application</span>
            </button>
          </div>

          <div className="text-xs font-extrabold tracking-wider text-slate-500 uppercase mb-1">
            LUMIXORA — A PRODUCT OF VYOMRA
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Lumixora Internship Application — Batch 01
          </h1>
          <p className="mt-2 text-lg font-medium text-violet-700 italic">
            Connecting the Future.
          </p>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
            Lumixora is inviting motivated students and aspiring professionals to apply for its first internship batch.
            This six-week remote program is designed to provide practical learning, teamwork, and exposure to real-world startup activities.
          </p>

          {/* Key Program Highlights Pill Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Duration</span>
                <span className="text-xs font-bold text-slate-900">6 Weeks</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Mode</span>
                <span className="text-xs font-bold text-slate-900">100% Remote</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Openings</span>
                <span className="text-xs font-bold text-slate-900">10 Positions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Roles Display */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Available Roles (Batch 01)</h2>
          <span className="text-xs text-slate-500">10 total cohort slots</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LUMIXORA_ROLES.map((role) => {
            const isSelected = preferredRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setPreferredRole(role.id)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-violet-50/70 border-violet-500 ring-1 ring-violet-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100/60 px-2 py-0.5 rounded-full">
                    {role.positions} positions
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{role.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{role.summary}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Program & Compensation Disclosure */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
            <div className="font-bold text-slate-900 text-sm">
              Program Type &amp; Compensation Disclosure
            </div>
            <p>
              This six-week remote program is structured as an <strong>educational and practical skill-building internship</strong>.
              Participants will work in teams on real startup problem statements, receive weekly founder feedback, and build verified portfolio deliverables.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>Program Benefits:</strong> Official Certificate of Internship Completion by VYOMRA, LinkedIn credential verification, and verified Letter of Recommendation for top contributors.</li>
              <li><strong>Stipend Policy:</strong> Includes performance-based milestone grants upon successful capstone submission.</li>
              <li><strong>No Employment Guarantee:</strong> This program is exclusively for training, practical startup exposure, and learning. It does not guarantee or promise permanent employment or selection.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Interactive Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        {/* Section 1: Personal Details */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 block">Step 01 of 04</span>
            <h2 className="text-lg font-bold text-slate-900">Section 1: Personal Details</h2>
            <p className="text-xs text-slate-500">Provide accurate contact and educational information.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.fullName ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.fullName && <p className="text-xs text-rose-600 mt-1">{errors.fullName}</p>}
            </div>

            {/* 2. Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Email Address *
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
            </div>

            {/* 3. Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
            </div>

            {/* 4. College/University Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                4. College/University Name *
              </label>
              <input
                id="collegeName"
                type="text"
                placeholder="e.g. Delhi Technological University"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.collegeName ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.collegeName && <p className="text-xs text-rose-600 mt-1">{errors.collegeName}</p>}
            </div>

            {/* 5. Degree and Branch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                5. Degree and Branch *
              </label>
              <input
                id="degreeAndBranch"
                type="text"
                placeholder="e.g. B.Tech in CSE / BBA Marketing / BCA"
                value={degreeAndBranch}
                onChange={(e) => setDegreeAndBranch(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.degreeAndBranch ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.degreeAndBranch && <p className="text-xs text-rose-600 mt-1">{errors.degreeAndBranch}</p>}
            </div>

            {/* 6. Current Year of Study */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                6. Current Year of Study *
              </label>
              <select
                id="currentYearOfStudy"
                value={currentYearOfStudy}
                onChange={(e) => setCurrentYearOfStudy(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.currentYearOfStudy ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              >
                <option value="">Select your year of study</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year / Final Year</option>
                <option value="Postgraduate (Masters)">Postgraduate (Masters)</option>
                <option value="Recent Graduate">Recent Graduate</option>
              </select>
              {errors.currentYearOfStudy && <p className="text-xs text-rose-600 mt-1">{errors.currentYearOfStudy}</p>}
            </div>

            {/* 7. City and State */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                7. City and State *
              </label>
              <input
                id="cityAndState"
                type="text"
                placeholder="e.g. Pune, Maharashtra"
                value={cityAndState}
                onChange={(e) => setCityAndState(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.cityAndState ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.cityAndState && <p className="text-xs text-rose-600 mt-1">{errors.cityAndState}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Role Selection */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 block">Step 02 of 04</span>
            <h2 className="text-lg font-bold text-slate-900">Section 2: Role Selection &amp; Commitment</h2>
            <p className="text-xs text-slate-500">Pick your primary area of focus and state your weekly availability.</p>
          </div>

          <div className="space-y-4">
            {/* 8. Choose Your Preferred Internship Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                8. Choose Your Preferred Internship Role *
              </label>
              <select
                id="preferredRole"
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value as LumixoraRole)}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="marketing">Marketing Intern — 3 positions</option>
                <option value="software_testing">Software Testing Intern — 3 positions</option>
                <option value="content_creation">Content Creation Intern — 2 positions</option>
                <option value="research">Research Intern — 2 positions</option>
              </select>
            </div>

            {/* 9. Why do you want to join Lumixora? */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                9. Why do you want to join Lumixora? *
              </label>
              <textarea
                id="whyJoinLumixora"
                rows={3}
                placeholder="What excites you about Lumixora and Connecting the Future? Why this program?"
                value={whyJoinLumixora}
                onChange={(e) => setWhyJoinLumixora(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.whyJoinLumixora ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.whyJoinLumixora && <p className="text-xs text-rose-600 mt-1">{errors.whyJoinLumixora}</p>}
            </div>

            {/* 10. What relevant skills can you contribute? */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                10. What relevant skills can you contribute? *
              </label>
              <textarea
                id="relevantSkills"
                rows={3}
                placeholder="Highlight tools, technologies, methodologies, or communication strengths relevant to your role..."
                value={relevantSkills}
                onChange={(e) => setRelevantSkills(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.relevantSkills ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.relevantSkills && <p className="text-xs text-rose-600 mt-1">{errors.relevantSkills}</p>}
            </div>

            {/* 11 & 12 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 11. Hours per week */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  11. How many hours per week can you commit? *
                </label>
                <select
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="15–20 hours/week">15–20 hours/week (Part-time student friendly)</option>
                  <option value="20–25 hours/week">20–25 hours/week (Recommended standard)</option>
                  <option value="25–30 hours/week">25–30 hours/week (Intensive track)</option>
                  <option value="30+ hours/week">30+ hours/week (Full immersion)</option>
                </select>
              </div>

              {/* 12. Can you commit to the full six-week program? */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  12. Can you commit to the full six-week program? *
                </label>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="sixWeeks"
                      value="yes"
                      checked={canCommitSixWeeks === 'yes'}
                      onChange={() => setCanCommitSixWeeks('yes')}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span>Yes, I can commit fully</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="sixWeeks"
                      value="no"
                      checked={canCommitSixWeeks === 'no'}
                      onChange={() => setCanCommitSixWeeks('no')}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span>No</span>
                  </label>
                </div>
                {errors.canCommitSixWeeks && <p className="text-xs text-rose-600 mt-1">{errors.canCommitSixWeeks}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Experience and Portfolio */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 block">Step 03 of 04</span>
            <h2 className="text-lg font-bold text-slate-900">Section 3: Experience and Portfolio</h2>
            <p className="text-xs text-slate-500">Share previous work, social profiles, and learning goals.</p>
          </div>

          <div className="space-y-4">
            {/* 13. Previous experience or projects */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                13. Previous experience or projects <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Mention college projects, prior internships, freelance gigs, or student club responsibilities..."
                value={previousExperience}
                onChange={(e) => setPreviousExperience(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 14. LinkedIn Profile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  14. LinkedIn Profile <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              {/* 15. GitHub, portfolio, or work sample link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  15. GitHub, portfolio, or work sample link <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/... or portfolio link"
                  value={portfolioOrWorkUrl}
                  onChange={(e) => setPortfolioOrWorkUrl(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* 16. What do you hope to learn from this internship? */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                16. What do you hope to learn from this internship? *
              </label>
              <textarea
                id="hopeToLearn"
                rows={3}
                placeholder="Tell us what capabilities, experiences, or mentorship insights you aim to develop during these 6 weeks..."
                value={hopeToLearn}
                onChange={(e) => setHopeToLearn(e.target.value)}
                className={`w-full bg-slate-50/50 border rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.hopeToLearn ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                }`}
              />
              {errors.hopeToLearn && <p className="text-xs text-rose-600 mt-1">{errors.hopeToLearn}</p>}
            </div>
          </div>
        </section>

        {/* Candidate Account Creation while applying */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 block">Candidate Account</span>
              <h2 className="text-lg font-bold text-slate-900">Track &amp; Manage Your Application</h2>
              <p className="text-xs text-slate-500">Create your own login account while applying so you can check review updates and interview invites.</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Applicant Account</span>
            </div>
          </div>

          {session?.isLoggedIn && session.userType === 'candidate' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900">
                  Signed in as {session.name} ({session.email})
                </div>
                <div className="text-[11px] text-emerald-700">
                  This application will automatically link to your candidate profile and dashboard.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-violet-50/60 to-indigo-50/30 border border-violet-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-violet-600 border-violet-300 focus:ring-violet-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block group-hover:text-violet-700 transition-colors">
                    Create my candidate account with this application (Recommended)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Your account username will be <strong className="text-slate-700">{email || 'your email from Section 1'}</strong>. You will be able to log in anytime to view your status, evaluator scorecard, and interview schedule.
                  </span>
                </div>
              </label>

              {createAccount && (
                <div className="pt-2 border-t border-violet-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-violet-600" />
                      <span>Choose Account Password *</span>
                    </label>
                    <div className="relative max-w-md">
                      <input
                        id="accountPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="Create a password for your candidate login..."
                        className={`w-full bg-white border rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                          errors.accountPassword ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-violet-600 focus:ring-violet-500/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.accountPassword && (
                      <p className="text-xs text-rose-600 mt-1">{errors.accountPassword}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      Min. 4 characters. Keep this safe so you can log into the Applicant Portal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section 4: Declaration */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 block">Step 04 of 04</span>
            <h2 className="text-lg font-bold text-slate-900">Section 4: Declaration</h2>
            <p className="text-xs text-slate-500">Please review and acknowledge the program terms and privacy statements.</p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
            {/* 17. Checkbox 1 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                id="confirmedAccurate"
                type="checkbox"
                checked={confirmedAccurate}
                onChange={(e) => setConfirmedAccurate(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                17. I confirm that the information provided is accurate.
              </span>
            </label>
            {errors.confirmedAccurate && <p className="text-xs text-rose-600 pl-7">{errors.confirmedAccurate}</p>}

            {/* 18. Checkbox 2 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                id="reviewedTerms"
                type="checkbox"
                checked={reviewedTerms}
                onChange={(e) => setReviewedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                18. I have reviewed the{' '}
                <button
                  type="button"
                  onClick={onViewTerms}
                  className="text-violet-700 hover:text-violet-900 underline font-bold inline-flex items-center gap-0.5"
                >
                  <span>internship terms and compensation details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                .
              </span>
            </label>
            {errors.reviewedTerms && <p className="text-xs text-rose-600 pl-7">{errors.reviewedTerms}</p>}

            {/* 19. Checkbox 3 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                id="agreedToPrivacy"
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                19. I have read the{' '}
                <button
                  type="button"
                  onClick={onViewPrivacy}
                  className="text-violet-700 hover:text-violet-900 underline font-bold inline-flex items-center gap-0.5"
                >
                  <span>privacy notice</span>
                  <ExternalLink className="w-3 h-3" />
                </button>{' '}
                and consent to the use of my information for recruitment purposes.
              </span>
            </label>
            {errors.agreedToPrivacy && <p className="text-xs text-rose-600 pl-7">{errors.agreedToPrivacy}</p>}
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            All 10 positions for Batch 01 are reviewed on rolling admissions.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/15 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Application</span>
                <ArrowRight className="w-4 h-4 text-violet-300" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal matching the exact prompt copy */}
      {submittedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-center">
            {/* Green Check Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            {/* Exactly requested text */}
            <div className="space-y-4 text-slate-800 text-sm leading-relaxed text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
              <p className="font-medium text-slate-800">
                &ldquo;Thank you for applying to the Lumixora Internship Program — Batch 01. Your application has been submitted successfully and will be reviewed by our team. Shortlisted applicants will be contacted using the details provided.
              </p>
              <div className="pt-2 border-t border-slate-200 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <div>LUMIXORA — A product of VYOMRA</div>
                <div className="text-violet-700 italic font-medium lowercase capitalize">Connecting the Future.&rdquo;</div>
              </div>
            </div>

            {/* Reference ID Pill */}
            <div className="bg-violet-50/70 border border-violet-200 rounded-2xl p-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 block mb-1">
                Your Application Reference Code
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-wider">
                  {submittedApp.refId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-1.5 rounded-lg bg-white hover:bg-violet-100 text-slate-700 border border-violet-200 transition-colors cursor-pointer"
                  title="Copy Reference ID"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Applied for <strong className="text-slate-800">{submittedApp.preferredRoleTitle}</strong>
              </p>
            </div>

            {/* Email Dispatch Status Pill */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 text-left flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">Automated Confirmation Email Queued</span>
                <span className="text-emerald-700">
                  Confirmation sent to <strong className="text-emerald-950">{submittedApp.email}</strong> via Firebase Mail Service.
                </span>
              </div>
            </div>

            {/* Candidate Account Created Confirmation */}
            <div className="bg-violet-50/70 border border-violet-200 rounded-2xl p-3 mb-6 text-left flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-violet-900 block">Candidate Account Active</span>
                <span className="text-violet-700">
                  Your candidate account is linked. Log in anytime with <strong className="text-violet-950">{submittedApp.email}</strong> to monitor live updates.
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShowEmailPreview(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <Mail className="w-3.5 h-3.5 text-violet-600" />
                <span>View Sent Email Confirmation Preview</span>
              </button>

              <button
                type="button"
                onClick={() => onSuccessSubmitted(submittedApp.refId)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Application Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSubmittedApp(null)}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Email Preview Modal */}
      {showEmailPreview && submittedApp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEmailPreview(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-violet-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Automated Confirmation Email Preview</h3>
                <p className="text-xs text-slate-500">Live transactional email triggered via Firebase Firestore Queue</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs space-y-1">
              <div><strong className="text-slate-700">From:</strong> Lumixora Admissions &lt;admissions@vyomra.com&gt;</div>
              <div><strong className="text-slate-700">To:</strong> {submittedApp.email}</div>
              <div><strong className="text-slate-700">Subject:</strong> {generateConfirmationEmailHtml(submittedApp).subject}</div>
            </div>

            {/* Email HTML Container */}
            <div 
              className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-2"
              dangerouslySetInnerHTML={{ __html: generateConfirmationEmailHtml(submittedApp).html }}
            />

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Email Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
