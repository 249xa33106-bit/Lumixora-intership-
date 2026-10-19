import React from 'react';
import { 
  ShieldCheck, 
  Database, 
  Lock, 
  UserCheck, 
  Printer, 
  ArrowRight,
  Eye
} from 'lucide-react';

interface PrivacyNoticeProps {
  onBackToApply: () => void;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ onBackToApply }) => {
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                Applicant Data Protection
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Lumixora Candidate Privacy Notice
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                LUMIXORA — A product of VYOMRA • <span className="italic text-violet-600">Connecting the Future.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
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
          This Privacy Notice outlines how <strong>VYOMRA</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;the Organization&quot;) collects, uses,
          and protects personal information submitted by applicants for the <strong>Lumixora Internship Program — Batch 01</strong>.
          We are committed to candidate data privacy and transparent recruitment practices.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
        {/* Section 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <Database className="w-4 h-4 text-violet-600" />
            <h2>1. Information We Collect</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-2">
            When you submit an application through the Lumixora Admissions portal, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
            <li><strong>Contact Details:</strong> Full Name, Email Address, Phone Number, City and State.</li>
            <li><strong>Educational Background:</strong> College/University Name, Degree, Branch, and Current Year of Study.</li>
            <li><strong>Application Responses:</strong> Preferred Role, Statement of Purpose (&quot;Why join Lumixora&quot;), skills summary, weekly availability, and learning objectives.</li>
            <li><strong>Portfolios &amp; External Links:</strong> Optional links to LinkedIn, GitHub, Framer, Substack, or personal work samples.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <Eye className="w-4 h-4 text-violet-600" />
            <h2>2. Purpose of Data Processing</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
            Your candidate data is processed solely for recruitment and evaluation purposes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <strong className="text-slate-900 block mb-1">Admissions Screening</strong>
              <span className="text-slate-600">Reviewing qualifications and skills against the 10 open positions in Batch 01.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <strong className="text-slate-900 block mb-1">Candidate Communication</strong>
              <span className="text-slate-600">Sending application acknowledgements, interview invites, and admissions status notifications.</span>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <Lock className="w-4 h-4 text-violet-600" />
            <h2>3. Storage, Confidentiality &amp; Retention</h2>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
            <li>Candidate information is stored securely in encrypted cloud infrastructure and is accessible only to the Lumixora / VYOMRA recruitment committee.</li>
            <li>We do not sell, license, or market your personal information to third-party advertisers.</li>
            <li>Unselected application records for Batch 01 are retained for six (6) months for consideration in subsequent batches, after which they are securely archived or purged upon request.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold mb-3">
            <UserCheck className="w-4 h-4 text-violet-600" />
            <h2>4. Your Rights as an Applicant</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            You may request an update, correction, or deletion of your application record at any time by contacting{' '}
            <span className="font-semibold text-slate-800">privacy@vyomra.com</span> with your Full Name and Application Reference Code.
          </p>
        </div>
      </div>

      {/* Footer Return */}
      <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          Data Protection Officer: <span className="font-semibold text-slate-700">dpo@vyomra.com</span>
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
