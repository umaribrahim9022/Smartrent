const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Universal sendEmail helper:
 * 1. Primary: Brevo API (No custom domain needed, works from any IP/Railway, 300 free/day)
 * 2. Secondary: Resend API (if configured)
 * 3. Fallback: Nodemailer SMTP
 */
const sendEmail = async (options) => {
  const toEmail = options.email;
  const subject = options.subject || 'SmartRent Notification';
  const text = options.message || '';
  const html = options.html || `<p>${text}</p>`;

  // 1. PRIMARY: Brevo REST API
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'umaribrahim220099@gmail.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'SmartRent.AI';

      const payload = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: html,
        textContent: text || undefined
      };

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.messageId) {
        console.log(`[Brevo Sent] Email to ${toEmail} delivered successfully. ID: ${data.messageId}`);
        return { success: true, provider: 'brevo', messageId: data.messageId };
      } else {
        console.error(`[Brevo API Error] Failed for ${toEmail}:`, data);
        // Fall through to other providers if available
      }
    } catch (brevoErr) {
      console.error(`[Brevo Network Error] ${brevoErr.message}`);
    }
  }

  // 2. SECONDARY: Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromSender = process.env.RESEND_FROM || 'SmartRent <onboarding@resend.dev>';

      const { data, error } = await resend.emails.send({
        from: fromSender,
        to: [toEmail],
        subject: subject,
        text: text,
        html: html,
      });

      if (!error && data?.id) {
        console.log(`[Resend Sent] Email to ${toEmail} delivered. ID: ${data.id}`);
        return { success: true, provider: 'resend', id: data.id };
      }
    } catch (resendErr) {
      console.warn(`[Resend Error] ${resendErr.message}`);
    }
  }

  // 3. FALLBACK: Nodemailer (if configured)
  if (process.env.SMTP_PASSWORD && process.env.SMTP_EMAIL) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
        connectionTimeout: 8000
      });

      const info = await transporter.sendMail({
        from: `"SmartRent Support" <${process.env.SMTP_EMAIL}>`,
        to: toEmail,
        subject: subject,
        text: text,
        html: html,
      });

      console.log(`[Nodemailer Sent] Email to ${toEmail} delivered. ID: ${info.messageId}`);
      return { success: true, provider: 'nodemailer', id: info.messageId };
    } catch (smtpErr) {
      console.error(`[Nodemailer Error] ${smtpErr.message}`);
      throw smtpErr;
    }
  }

  console.warn(`[sendEmail] No active email provider succeeded for ${toEmail}`);
  return { success: false, message: 'Delivery simulated' };
};

module.exports = sendEmail;
