const Notification = require('../models/Notification');
const sendEmail = require('./sendEmail');

/**
 * Universal helper to send in-app notification + real-time socket + optional email
 * @param {Object} options
 * @param {string|ObjectId} options.userId - Recipient user ID
 * @param {string} options.userEmail - Recipient email (optional for email dispatch)
 * @param {string} options.userName - Recipient name (optional)
 * @param {string} options.text - In-app notification text
 * @param {string} options.type - 'booking' | 'message' | 'system'
 * @param {Object} [options.io] - Socket.io instance from req.io
 * @param {string} [options.emailSubject] - Subject line if sending email
 * @param {string} [options.emailHtml] - HTML content if sending email
 */
const notifyUser = async ({
  userId,
  userEmail,
  userName = 'User',
  text,
  type = 'booking',
  io,
  emailSubject,
  emailHtml
}) => {
  try {
    if (!userId) return null;

    // 1. In-app Notification document
    const notif = await Notification.create({
      user: userId,
      text,
      type,
      isRead: false
    });

    // 2. Real-time Socket.io dispatch to user room
    if (io) {
      io.to(userId.toString()).emit('newNotification', notif);
    }

    // 3. Email dispatch (non-blocking / asynchronous)
    if (userEmail && emailSubject && emailHtml) {
      sendEmail({
        email: userEmail,
        subject: emailSubject,
        html: emailHtml
      }).catch(err => {
        console.warn(`[notifyUser] Email failed to ${userEmail}:`, err.message);
      });
    }

    return notif;
  } catch (error) {
    console.error('[notifyUser] Error:', error.message);
    return null;
  }
};

/**
 * Reusable clean HTML template for SmartRent emails
 */
const generateEmailTemplate = ({ title, preheader, contentHtml, actionUrl, actionText }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
    .brand { font-size: 20px; font-weight: 800; color: #6366f1; margin-bottom: 24px; display: inline-block; letter-spacing: -0.5px; }
    .brand span { color: #f1f5f9; }
    h2 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
    .info-box { background-color: #1e293b; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #334155; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 16px; }
    .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">SmartRent<span>.AI</span></div>
    <h2>${title}</h2>
    ${contentHtml}
    ${actionUrl && actionText ? `<p><a href="${actionUrl}" class="btn">${actionText}</a></p>` : ''}
    <div class="footer">
      This is an automated notification from SmartRent AI Platform.<br/>
      Lahore, Pakistan · &copy; ${new Date().getFullYear()} SmartRent
    </div>
  </div>
</body>
</html>
`;
};

module.exports = {
  notifyUser,
  generateEmailTemplate
};
