const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let resendClient = null;
let nodemailerTransporter = null;

const getResendClient = () => {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const getNodemailerTransporter = () => {
  if (!nodemailerTransporter) {
    const emailUser = process.env.SMTP_EMAIL || 'smartrent026@gmail.com';
    const emailPass = process.env.SMTP_PASSWORD;

    nodemailerTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 12000,
    });
  }
  return nodemailerTransporter;
};

/**
 * Universal sendEmail helper:
 * 1. Primary: Uses Resend API (HTTP-based, instant, zero SMTP blocks) when RESEND_API_KEY is configured.
 * 2. Fallback: Uses Nodemailer SMTP if RESEND_API_KEY is not configured or fails.
 */
const sendEmail = async (options) => {
  const toEmail = options.email;
  const subject = options.subject || 'SmartRent Notification';
  const text = options.message || '';
  const html = options.html || `<p>${text}</p>`;

  // 1. Try Resend if API key is provided
  if (process.env.RESEND_API_KEY) {
    try {
      const client = getResendClient();
      const fromSender = process.env.RESEND_FROM || 'SmartRent <onboarding@resend.dev>';

      const { data, error } = await client.emails.send({
        from: fromSender,
        to: [toEmail],
        subject: subject,
        text: text,
        html: html,
      });

      if (error) {
        if (error.statusCode === 403 || error.message?.includes('testing emails')) {
          console.warn(`\n⚠️  [Resend Testing Notice] Free Resend (onboarding@resend.dev) can only deliver to your Resend account email (umaribrahim220099@gmail.com).`);
          console.warn(`👉 To send emails to any recipient, add and verify your custom domain at https://resend.com/domains\n`);
        }
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      console.log(`[Resend Sent] Email to ${toEmail} delivered successfully. ID: ${data?.id}`);
      return { success: true, provider: 'resend', id: data?.id };
    } catch (resendError) {
      console.error(`[Resend Error] Failed to send email to ${toEmail}:`, resendError.message);
      // Fall through to try Nodemailer fallback if available
    }
  }

  // 2. Fallback to Nodemailer if configured
  if (process.env.SMTP_PASSWORD && process.env.SMTP_EMAIL) {
    try {
      const transporter = getNodemailerTransporter();
      const fromAddress = `"SmartRent Support" <${process.env.SMTP_EMAIL}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: subject,
        text: text,
        html: html,
      });

      console.log(`[Nodemailer Sent] Email to ${toEmail} delivered successfully. ID: ${info.messageId}`);
      return { success: true, provider: 'nodemailer', id: info.messageId };
    } catch (smtpError) {
      console.error(`[Nodemailer Error] Failed to send email to ${toEmail}:`, smtpError.message);
      throw smtpError;
    }
  }

  console.warn(`[sendEmail Warning] Neither valid RESEND_API_KEY nor working SMTP_PASSWORD configured. Simulated delivery for ${toEmail}`);
  return { success: false, message: 'No active email provider configured' };
};

module.exports = sendEmail;
