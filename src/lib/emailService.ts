import { LumixoraApplication } from '../types';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface AutomatedEmailRecord {
  id: string;
  to: string;
  subject: string;
  refId: string;
  candidateName: string;
  roleTitle: string;
  status: 'SENT' | 'PENDING' | 'QUEUED';
  html: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY_SENT_EMAILS = 'lumixora_automated_emails_v1';

export function getCachedSentEmails(): AutomatedEmailRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENT_EMAILS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedEmail(email: AutomatedEmailRecord) {
  try {
    const current = getCachedSentEmails();
    localStorage.setItem(STORAGE_KEY_SENT_EMAILS, JSON.stringify([email, ...current]));
  } catch (e) {
    console.error('Failed to cache email record', e);
  }
}

/**
 * Generates the official HTML email confirmation template for Lumixora Batch 01
 */
export function generateConfirmationEmailHtml(app: LumixoraApplication): { html: string; text: string; subject: string } {
  const subject = `Application Received: Lumixora Internship Program — Batch 01 [Ref: ${app.refId}]`;

  const text = `
Dear ${app.fullName},

Thank you for applying to the Lumixora Internship Program — Batch 01.

Your application has been received and logged into our admissions database.

APPLICATION SUMMARY:
- Reference Code: ${app.refId}
- Preferred Role: ${app.preferredRoleTitle}
- College/University: ${app.collegeName}
- Degree & Branch: ${app.degreeAndBranch}
- Current Year of Study: ${app.currentYearOfStudy}
- Program Duration: 6 Weeks (Remote)
- Total Batch Openings: 10 Positions

WHAT HAPPENS NEXT:
1. Application Screening: Our team is evaluating your portfolio, motivation, and skills against the 10 available slots.
2. Shortlisting & Interviews: Shortlisted candidates will receive a calendar invite for a 1-on-1 team discussion.
3. Final Cohort Kickoff: Selected candidates will receive official onboarding materials before Day 1.

You can monitor your application status anytime using your Reference Code: ${app.refId}

Best regards,
Admissions Committee
LUMIXORA — A product of VYOMRA
Connecting the Future.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #581c87 100%); padding: 36px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 12px; padding: 8px 12px; margin-bottom: 12px;">
                      <span style="color: #e9d5ff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Official Admissions Confirmation</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">LUMIXORA</h1>
                    <p style="color: #cbd5e1; font-size: 13px; margin: 0; font-weight: 500;">
                      A product of <strong style="color: #ffffff;">VYOMRA</strong> &bull; <span style="color: #c084fc; font-style: italic;">Connecting the Future.</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0;">Application Received — Batch 01</h2>
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
                Dear <strong>${app.fullName}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                Thank you for applying to the <strong>Lumixora Internship Program — Batch 01</strong>. We have successfully received your submission.
                Our team is reviewing your background and motivation for the <strong>${app.preferredRoleTitle}</strong> track.
              </p>

              <!-- Reference ID Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7c3aed; letter-spacing: 1px; margin-bottom: 6px;">
                      Your Unique Reference Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 2px;">
                      ${app.refId}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                      Keep this code safe to track your screening and interview milestones.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Application Details Grid -->
              <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 12px 0;">Submitted Information</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px; font-size: 13px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 16px; color: #64748b; width: 40%;">Preferred Role:</td>
                  <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${app.preferredRoleTitle}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                  <td style="padding: 10px 16px; color: #64748b;">University / College:</td>
                  <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${app.collegeName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 16px; color: #64748b;">Degree & Branch:</td>
                  <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${app.degreeAndBranch} (${app.currentYearOfStudy})</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                  <td style="padding: 10px 16px; color: #64748b;">Weekly Commitment:</td>
                  <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${app.hoursPerWeek} (6 Weeks Remote)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; color: #64748b;">Registered Email:</td>
                  <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${app.email}</td>
                </tr>
              </table>

              <!-- Next Steps Timeline -->
              <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 12px 0;">Next Steps in Review Process</h3>
              <ol style="margin: 0 0 28px 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
                <li><strong>Profile Evaluation:</strong> Our technical and marketing mentors will review your written statement and skills.</li>
                <li><strong>Interview Notification:</strong> Shortlisted applicants will be invited for a virtual 1-on-1 discussion.</li>
                <li><strong>Batch 01 Selection:</strong> Offers will be extended to 10 selected candidates prior to program kickoff.</li>
              </ol>

              <!-- Compensation & Educational Transparency Note -->
              <div style="background-color: #f8fafc; border-left: 4px solid #7c3aed; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #475569; margin: 0; line-height: 1.5;">
                  <strong>Program Reminder:</strong> Lumixora Batch 01 is a 6-week educational startup internship providing Certificate of Completion, Letter of Recommendation for top contributors, and milestone-based grants upon capstone delivery.
                </p>
              </div>

              <!-- Sign-off -->
              <p style="font-size: 13px; color: #64748b; margin: 0;">
                Warm regards,<br>
                <strong style="color: #0f172a;">Admissions Committee</strong><br>
                LUMIXORA &bull; VYOMRA
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">
                &copy; ${new Date().getFullYear()} LUMIXORA — A product of VYOMRA. All rights reserved.
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                This is an automated confirmation email regarding your internship application.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { html, text, subject };
}

/**
 * Triggers automated confirmation email delivery.
 * 1. Writes to Firestore `/mail/{mailId}` collection (which triggers Firebase Trigger Email Extension / Cloud Function)
 * 2. Saves record to local cache for instant candidate UI preview and delivery verification
 */
export async function sendApplicationConfirmationEmail(app: LumixoraApplication): Promise<AutomatedEmailRecord> {
  const { html, text, subject } = generateConfirmationEmailHtml(app);
  const emailId = `mail-${app.refId}-${Date.now()}`;

  const emailRecord: AutomatedEmailRecord = {
    id: emailId,
    to: app.email,
    subject,
    refId: app.refId,
    candidateName: app.fullName,
    roleTitle: app.preferredRoleTitle,
    status: 'SENT',
    html,
    text,
    createdAt: new Date().toISOString(),
  };

  // 1. Cache locally for instant preview
  saveCachedEmail(emailRecord);

  // 2. Queue in Firestore `/mail/{mailId}` collection for live Firebase Extension or Cloud Function delivery
  try {
    const mailDocRef = doc(db, 'mail', emailId);
    setDoc(mailDocRef, {
      to: [app.email],
      subject,
      text,
      html,
      message: {
        subject,
        text,
        html,
      },
      refId: app.refId,
      candidateName: app.fullName,
      roleTitle: app.preferredRoleTitle,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      metadata: {
        batch: 'Batch 01',
        collegeName: app.collegeName || '',
      },
    }).catch((err) => {
      console.warn('[Firebase Mail Service] Notice while writing to Firestore mail queue:', err);
    });
    console.log(`[Firebase Mail Service] Automated confirmation email queued for ${app.email} with Ref: ${app.refId}`);
  } catch (error) {
    console.warn('[Firebase Mail Service] Notice while queuing mail:', error);
  }

  return emailRecord;
}
