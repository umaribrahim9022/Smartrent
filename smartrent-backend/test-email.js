require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email with:');
  console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'undefined');

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.SMTP_EMAIL}>`,
      to: process.env.SMTP_EMAIL,
      subject: 'Test Email',
      text: 'This is a test email.',
    });
    console.log('Success! Message ID:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

testEmail();
