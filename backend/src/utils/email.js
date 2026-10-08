const nodemailer = require('nodemailer');

// Nodemailer SMTP credentials live in .env (see the "Nodemailer" section).
// Until they are configured, sendEmail() resolves { sent: false } without
// throwing, so creating a user still works and the manager can hand over
// the generated credentials manually.

const isConfigured = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return false;
  // Treat the shipped placeholder values as "not configured yet"
  if (user === 'your_email@gmail.com' || pass === 'your_app_password') return false;
  return true;
};

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
};

// @desc    Send an email via nodemailer (SMTP settings from .env)
// @returns { sent: boolean, reason?: string }
const sendEmail = async ({ to, subject, text, html }) => {
  if (!isConfigured()) {
    return { sent: false, reason: 'SMTP not configured — fill the Nodemailer section in .env' };
  }
  try {
    await getTransporter().sendMail({
      from: `"${process.env.FROM_NAME || 'Crefto CRM'}" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error('Nodemailer send failed:', error.message);
    return { sent: false, reason: error.message };
  }
};

// @desc    Email a newly created user their login credentials
const sendCredentialsEmail = async ({ to, firstName, password }) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const subject = 'Your Crefto CRM login credentials';
  const text = [
    `Hi ${firstName},`,
    '',
    'A manager has created your Crefto CRM account. Here are your login credentials:',
    '',
    `Email: ${to}`,
    `Password: ${password}`,
    '',
    `Log in here: ${loginUrl}`,
    '',
    'For security, please change your password after your first login (Settings).',
  ].join('\n');
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="color:#4f46e5;margin:0 0 16px">Your Crefto CRM account</h2>
      <p style="color:#334155">Hi ${firstName},</p>
      <p style="color:#334155">A manager has created your account. Your login credentials:</p>
      <table style="background:#f8fafc;border-radius:8px;padding:12px;width:100%">
        <tr><td style="color:#64748b;padding:4px 8px">Email</td><td style="color:#0f172a;padding:4px 8px"><strong>${to}</strong></td></tr>
        <tr><td style="color:#64748b;padding:4px 8px">Password</td><td style="color:#0f172a;padding:4px 8px"><strong>${password}</strong></td></tr>
      </table>
      <p style="margin-top:16px"><a href="${loginUrl}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Log in to Crefto CRM</a></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:16px">For security, please change your password after your first login.</p>
    </div>`;
  return sendEmail({ to, subject, text, html });
};

module.exports = { sendEmail, sendCredentialsEmail };
