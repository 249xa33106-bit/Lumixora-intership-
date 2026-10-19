import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  Award, 
  Printer, 
  ArrowRight,
  AlertTriangle,
  Laptop
} from 'lucide-react';

interface InternshipTermsProps {
  onBackToApply: () => void;
}

export const InternshipTerms: React.FC<InternshipTermsProps> = ({ onBackToApply }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                Official Program Guidelines
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Lumixora Internship Terms &amp; Compensation
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Batch 01 • LUMIXORA — a product of VYOMRA • <span className="italic text-violet-600">Connecting the Future.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onBackToApply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              <span>Back to Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          These Terms and Conditions govern candidate participation in the <strong>Lumixora Internship Program — Batch 01</strong>,
          organized by <strong>VYOMRA</strong>. Please review these provisions regarding program duration, remote guidelines,
          deliverables, compensation structure, and intellectual property.
        </p>
      </div>

      {/* Critical Non-Guarantee / Selection Disclosure Card */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xs text-amber-900 leading-relaxed space-y-1">
            <div className="font-bold text-amber-950 text-sm">
              Important Program Disclaimer: No Selection or Employment Guarantee
            </div>
            <p>
              Submitting an application does not guarantee selection, admission, or subsequent employment with Lumixora or VYOMRA.
              Applications are evaluated strictly on merit, portfolio submissions, and batch capacity (10 total slots).
              Participation in this internship does not constitute an offer of permanent employment.
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
        {/* 1. Program Structure */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <Clock className="w-4 h-4 text-violet-600" />
            <h2>1. Program Structure &amp; Remote Modality</h2>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
            <li><strong>Duration:</strong> Exactly six (6) weeks from the designated cohort kickoff date.</li>
            <li><strong>Mode:</strong> 100% remote. All sync meetings, daily standups, and task handoffs are conducted asynchronously and via Google Meet / Discord / Slack.</li>
            <li><strong>Total Positions:</strong> Batch 01 is strictly limited to ten (10) positions across four tracks: Marketing (3), Software Testing (3), Content Creation (2), and Research (2).</li>
            <li><strong>Weekly Commitment:</strong> Interns are expected to commit their agreed hours (typically 15 to 25 hours per week) and attend weekly sprint check-ins.</li>
          </ul>
        </div>

        {/* 2. Compensation & Benefits */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <Award className="w-4 h-4 text-violet-600" />
            <h2>2. Compensation, Recognition &amp; Learning Benefits</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-3">
            This internship is primarily an educational, work-integrated startup exposure program designed to help students bridge
            academic learning with hands-on startup execution:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
            <li><strong>Certificate of Completion:</strong> Awarded to all interns who fulfill their capstone deliverables and maintain satisfactory attendance throughout the 6 weeks.</li>
            <li><strong>Letter of Recommendation:</strong> Verified corporate recommendation provided to top contributors by Lumixora / VYOMRA leadership.</li>
            <li><strong>Performance Grants:</strong> Discretionary performance grants and project stipends are disbursed to participants upon successful delivery of key sprint milestones.</li>
            <li><strong>Mentorship &amp; Networking:</strong> Direct access to product architects, marketing leads, and founder Q&amp;A sessions.</li>
          </ul>
        </div>

        {/* 3. Intellectual Property */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <h2>3. Intellectual Property &amp; Confidentiality</h2>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
            <li>All product designs, test scripts, source code, research syntheses, and marketing copy created during the internship remain the proprietary property of VYOMRA.</li>
            <li>Interns agree not to disclose confidential feature roadmaps, unreleased product screenshots, or internal metrics to external third parties.</li>
            <li>Interns may reference their role title, duration, and general non-confidential project contributions on their resumes, portfolios, and LinkedIn profiles.</li>
          </ul>
        </div>

        {/* 4. Equipment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <Laptop className="w-4 h-4 text-violet-600" />
            <h2>4. Hardware, Connectivity &amp; Code of Conduct</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            As a remote program, participants must have access to a personal laptop/computer and stable broadband internet.
            Lumixora fosters an inclusive, supportive, and harassment-free working environment. Professional communication and academic integrity are strictly enforced.
          </p>
        </div>
      </div>

      {/* Footer Return */}
      <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          Admissions queries: <span className="font-semibold text-slate-700">internships@vyomra.com</span>
        </p>
        <button
          onClick={onBackToApply}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
        >
          Return to Application Form
        </button>
      </div>
    </div>
  );
};
