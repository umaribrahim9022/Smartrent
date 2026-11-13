require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function testEmail() {
  console.log('Testing Email Configuration:');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Configured (' + process.env.RESEND_API_KEY.slice(0, 7) + '...)' : 'Not set');
  console.log('RESEND_FROM:', process.env.RESEND_FROM || 'SmartRent <onboarding@resend.dev>');
  console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL || 'Not set');

  const testRecipient = process.env.TEST_EMAIL || process.env.SMTP_EMAIL || 'delivered@resend.dev';

  try {
    const result = await sendEmail({
      email: testRecipient,
      subject: 'SmartRent Resend Test OTP',
      message: 'Your test OTP code is: 123456',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4f46e5;">SmartRent.AI Test</h2>
          <p>Your test OTP is: <strong style="font-size: 24px; color: #4338ca;">123456</strong></p>
        </div>
      `
    });
    console.log('\nResult:', result);
  } catch (err) {
    console.error('\nTest failed:', err.message);
  }
}

testEmail();
