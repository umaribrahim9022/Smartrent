require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function testEmail() {
  const target = process.env.TEST_EMAIL || 'nouraizashraf08@gmail.com';
  console.log(`[Test] Sending OTP email to ${target} via sendEmail utility...`);

  try {
    const result = await sendEmail({
      email: target,
      subject: 'SmartRent OTP Test',
      message: 'Your verification OTP is 654321',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5;">SmartRent Verification Code</h2>
          <p>Your code is: <strong style="font-size: 26px; color: #4338ca;">654321</strong></p>
        </div>
      `
    });
    console.log('[Test Success] Result:', result);
  } catch (err) {
    console.error('[Test Failed] Error:', err);
  }
}

testEmail();
