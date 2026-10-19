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
  status: 'SENT' | 'PENDING' | 'QUEUED' | 'DELIVERED' | 'FAILED';
  html: string;
  text: string;
  createdAt: string;
  deliveryMethod?: string;
  error?: string;
}

export interface EmailSettings {
  provider: 'auto' | 'resend' | 'webhook' | 'emailjs' | 'gmail_direct';
  resendApiKey?: string;
  webhookUrl?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  senderEmail?: string;
  senderName?: string;
}

const STORAGE_KEY_SENT_EMAILS = 'lumixora_automated_emails_v1';
const STORAGE_KEY_EMAIL_SETTINGS = 'lumixora_email_dispatch_settings_v1';

export function getEmailSettings(): EmailSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAIL_SETTINGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading email settings:', e);
  }
  return {
    provider: 'auto',
    senderEmail: 'admissions@vyomra.com',
    senderName: 'Lumixora Admissions',
  };
}

export function saveEmailSettings(settings: EmailSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMAIL_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving email settings:', e);
  }
}

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
    const filtered = current.filter((item) => item.id !== email.id);
    localStorage.setItem(STORAGE_KEY_SENT_EMAILS, JSON.stringify([email, ...filtered]));
  } catch (e) {
    console.error('Failed to cache email record', e);
  }
}

/**
 * Generates the official HTML and Plain Text confirmation template for Lumixora Batch 01
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
- University / College: ${app.collegeName}
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
 * Returns a 1-click URL to open Gmail Web compose pre-filled with the official confirmation email
 */
export function getGmailComposeUrl(app: LumixoraApplication, customSubject?: string, customBody?: string): string {
  const { subject, text } = generateConfirmationEmailHtml(app);
  const finalSubject = customSubject || subject;
  const finalBody = customBody || text;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.email)}&su=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
}

/**
 * Returns a standard mailto link
 */
export function getMailtoUrl(app: LumixoraApplication, customSubject?: string, customBody?: string): string {
  const { subject, text } = generateConfirmationEmailHtml(app);
  const finalSubject = customSubject || subject;
  const finalBody = customBody || text;
  return `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
}

/**
 * Triggers a download of an RFC-822 formatted .eml file.
 * Opening this file places the complete confirmation email directly inside Apple Mail, Outlook, or Thunderbird.
 */
export function downloadEmailAsEml(app: LumixoraApplication): void {
  const { html, text, subject } = generateConfirmationEmailHtml(app);
  const boundary = `----=_Part_${Date.now()}`;

  const emlContent = [
    `From: Lumixora Admissions <admissions@vyomra.com>`,
    `To: ${app.fullName} <${app.email}>`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lumixora_Application_${app.refId}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Dispatches automated confirmation email delivery across available channels:
 * 1. Pings Netlify / Serverless Function / Webhook / Resend if configured
 * 2. Writes to Firestore `/mail/{mailId}` collection (for Firebase Trigger Email Extension)
 * 3. Saves record to local cache for instant candidate UI preview and delivery verification
 */
export async function sendApplicationConfirmationEmail(app: LumixoraApplication): Promise<AutomatedEmailRecord> {
  const { html, text, subject } = generateConfirmationEmailHtml(app);
  const emailId = `mail-${app.refId}-${Date.now()}`;
  const settings = getEmailSettings();

  const emailRecord: AutomatedEmailRecord = {
    id: emailId,
    to: app.email,
    subject,
    refId: app.refId,
    candidateName: app.fullName,
    roleTitle: app.preferredRoleTitle,
    status: 'QUEUED',
    html,
    text,
    createdAt: new Date().toISOString(),
    deliveryMethod: 'Browser / Firebase Queue',
  };

  // 1. Cache locally for instant preview and offline resiliency
  saveCachedEmail(emailRecord);

  // 2. Queue in Firestore `/mail/{mailId}` collection
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
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
      metadata: {
        batch: 'Batch 01',
        collegeName: app.collegeName || '',
      },
    }).catch((err) => {
      console.warn('[Firebase Mail Service] Notice while writing to Firestore mail queue:', err);
    });
  } catch (error) {
    console.warn('[Firebase Mail Service] Notice while queuing mail:', error);
  }

  // 3. Attempt direct external dispatch if Resend / Webhook or Serverless endpoint is available
  try {
    if (settings.resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${settings.senderName || 'Lumixora Admissions'} <onboarding@resend.dev>`,
          to: [app.email],
          subject,
          html,
          text,
        }),
      });
      if (res.ok) {
        emailRecord.status = 'DELIVERED';
        emailRecord.deliveryMethod = 'Resend API';
        saveCachedEmail(emailRecord);
      }
    } else if (settings.webhookUrl) {
      await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: app.email,
          subject,
          html,
          text,
          refId: app.refId,
          fullName: app.fullName,
          role: app.preferredRoleTitle,
        }),
      });
      emailRecord.status = 'DELIVERED';
      emailRecord.deliveryMethod = 'Custom Webhook';
      saveCachedEmail(emailRecord);
    } else {
      // Attempt local Netlify function if running on Netlify
      try {
        const netlifyRes = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: app.email,
            subject,
            html,
            text,
            refId: app.refId,
            fullName: app.fullName,
          }),
        });
        if (netlifyRes.ok) {
          emailRecord.status = 'DELIVERED';
          emailRecord.deliveryMethod = 'Netlify Serverless Function';
          saveCachedEmail(emailRecord);
        }
      } catch {
        // Fallback to client delivery options
      }
    }
  } catch (e: any) {
    console.warn('[Email Dispatch] Background delivery attempt notice:', e);
    emailRecord.error = e.message || String(e);
  }

  return emailRecord;
}

/**
 * Sends a test email to verify configured email providers
 */
export async function testSendEmail(targetEmail: string): Promise<{ success: boolean; message: string }> {
  const settings = getEmailSettings();
  const testSubject = `Test Email: Lumixora Admissions System [${new Date().toLocaleTimeString()}]`;
  const testHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #7c3aed;">LUMIXORA Admissions Email Test</h2>
      <p>This is a verification test email sent from the Lumixora Internship Portal.</p>
      <p><strong>Configured Provider:</strong> ${settings.provider}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>
  `;

  if (settings.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Lumixora <onboarding@resend.dev>',
          to: [targetEmail],
          subject: testSubject,
          html: testHtml,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Resend API returned an error');
      }
      return { success: true, message: `Successfully sent test email to ${targetEmail} via Resend!` };
    } catch (err: any) {
      return { success: false, message: `Resend error: ${err.message}` };
    }
  }

  if (settings.webhookUrl) {
    try {
      const res = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          subject: testSubject,
          html: testHtml,
          test: true,
        }),
      });
      if (!res.ok) throw new Error(`Webhook returned status ${res.status}`);
      return { success: true, message: `Successfully triggered Webhook for ${targetEmail}!` };
    } catch (err: any) {
      return { success: false, message: `Webhook error: ${err.message}` };
    }
  }

  return {
    success: true,
    message: 'Direct Gmail / Webmail trigger is active. You can send directly using Gmail 1-Click Dispatch.',
  };
}
