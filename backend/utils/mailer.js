import nodemailer from 'nodemailer';

export const sendMail = async ({ to, subject, html }) => {
  try {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport(smtpConfig);
      const mailOptions = {
        from: process.env.SMTP_FROM || '"CA Office ERP" <noreply@caoffice.com>',
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent] Message ID: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`
============================================================
[SIMULATED EMAIL SENT]
To: ${to}
Subject: ${subject}
Content:
${html.replace(/<[^>]*>/g, ' ').trim()}
============================================================
      `);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('[Mailer Error] Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};
