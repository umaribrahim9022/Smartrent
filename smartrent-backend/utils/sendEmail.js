const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const emailUser = process.env.SMTP_EMAIL || 'smartrent026@gmail.com';
    const emailPass = process.env.SMTP_PASSWORD || 'zjidpfiswijysacv';

    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL port 465 is faster and avoids STARTTLS handshake latency
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      pool: true, // Reuse existing connections
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 8000, // 8s connection timeout
      greetingTimeout: 5000,
      socketTimeout: 12000,
    });
  }
  return transporter;
};

const sendEmail = async (options) => {
  try {
    const t = getTransporter();
    const fromAddress = `"SmartRent Support" <${process.env.SMTP_EMAIL || 'smartrent026@gmail.com'}>`;

    const mailOptions = {
      from: fromAddress,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await t.sendMail(mailOptions);
    console.log(`[Email Sent] Message to ${options.email} delivered successfully. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${options.email}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
