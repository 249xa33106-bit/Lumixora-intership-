import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Transporter configuration (e.g. Gmail, SendGrid, Resend, or standard SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "admissions@vyomra.com",
    pass: process.env.SMTP_PASS || "sample_smtp_password",
  },
});

/**
 * Cloud Function: Send Automated Confirmation Email on Application Submission
 * Trigger: Firestore onDocumentCreated at path 'applications/{applicationId}'
 */
export const sendApplicationConfirmationEmail = onDocumentCreated(
  {
    document: "applications/{applicationId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("No data associated with application event");
      return;
    }

    const application = snapshot.data();
    const candidateEmail = application.email;
    const candidateName = application.fullName;
    const refId = application.refId;
    const roleTitle = application.preferredRoleTitle || "Internship Track";
    const collegeName = application.collegeName || "University";

    logger.info(`Processing automated confirmation email for ${candidateEmail} [Ref: ${refId}]`);

    const subject = `Application Received: Lumixora Internship Program — Batch 01 [Ref: ${refId}]`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 8px; text-align: left;">
          <h2 style="margin: 0; color: #ffffff;">LUMIXORA — A product of VYOMRA</h2>
          <p style="margin: 4px 0 0 0; color: #c084fc; font-style: italic;">Connecting the Future.</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Dear <strong>${candidateName}</strong>,</p>
          <p>Thank you for applying to the <strong>Lumixora Internship Program — Batch 01</strong>. Your application has been logged into our admissions database.</p>
          <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #7c3aed; font-weight: bold;">Application Reference Code</p>
            <p style="margin: 6px 0 0 0; font-size: 22px; font-weight: bold; color: #0f172a; font-family: monospace;">${refId}</p>
          </div>
          <p><strong>Role Applied:</strong> ${roleTitle}</p>
          <p><strong>Institution:</strong> ${collegeName}</p>
          <p><strong>Program Duration:</strong> 6 Weeks (Remote)</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 13px; color: #64748b;">
            Our review committee is actively assessing submissions. Shortlisted applicants will be invited for a virtual 1-on-1 interview.
          </p>
          <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
            Best regards,<br>
            <strong>Admissions Team</strong><br>
            LUMIXORA &bull; VYOMRA
          </p>
        </div>
      </div>
    `;

    try {
      // Dispatch email
      const info = await transporter.sendMail({
        from: '"Lumixora Admissions" <admissions@vyomra.com>',
        to: candidateEmail,
        subject: subject,
        html: htmlBody,
      });

      logger.info(`Email successfully dispatched to ${candidateEmail}: messageId=${info.messageId}`);

      // Log delivery status back into application document
      await snapshot.ref.update({
        emailNotification: {
          status: "DELIVERED",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          messageId: info.messageId,
          recipient: candidateEmail,
        },
      });
    } catch (error: any) {
      logger.error(`Failed to send email to ${candidateEmail}:`, error);

      // Record failure for retry or manual review
      await snapshot.ref.update({
        emailNotification: {
          status: "FAILED",
          error: error.message || String(error),
          attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }
  }
);
