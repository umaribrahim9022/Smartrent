const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const key = process.env.BREVO_API_KEY;
const targetEmail = process.env.TEST_EMAIL || 'nouraizashraf08@gmail.com';

async function sendTest() {
  console.log(`Sending Brevo test email to: ${targetEmail}`);

  const payload = {
    sender: { name: 'SmartRent.AI', email: 'umaribrahim220099@gmail.com' },
    to: [{ email: targetEmail }],
    subject: 'SmartRent OTP Verification (Live Brevo Test)',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0;">SmartRent.AI Verification</h2>
        <p style="color: #475569; font-size: 15px;">Your test verification code is below:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 28px; background: #eef2ff; color: #4338ca; border-radius: 8px; border: 1px dashed #6366f1;">849201</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This is a live test email sent via Brevo API without custom domain restrictions.</p>
      </div>
    `
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Network Error:', err);
  }
}

sendTest();
