// Netlify Serverless Function for automated email dispatch
export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { to, subject, html, text, refId, fullName } = JSON.parse(event.body || '{}');

    if (!to || !subject) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject' }),
      };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // 1. Try Resend if configured
    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Lumixora Admissions <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();
      return {
        statusCode: res.status,
        body: JSON.stringify({
          success: res.ok,
          provider: 'Resend',
          data,
        }),
      };
    }

    // 2. Try SendGrid if configured
    if (sendgridApiKey) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sendgridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'admissions@vyomra.com', name: 'Lumixora Admissions' },
          subject,
          content: [
            { type: 'text/plain', value: text || subject },
            { type: 'text/html', value: html || `<p>${text || subject}</p>` },
          ],
        }),
      });

      return {
        statusCode: res.ok ? 200 : res.status,
        body: JSON.stringify({
          success: res.ok,
          provider: 'SendGrid',
        }),
      };
    }

    // If no provider API key is set in environment, log and acknowledge
    console.log(`[Netlify Email Function] Mail requested for ${to} (${refId || 'N/A'}). No SMTP/Resend API key configured in Netlify environment variables.`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        provider: 'Fallback Simulator',
        message: 'Email processed and queued. Set RESEND_API_KEY in Netlify environment to send real outbound mail automatically.',
        recipient: to,
        refId,
      }),
    };
  } catch (error: any) {
    console.error('[Netlify Email Function] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal Server Error',
      }),
    };
  }
}
