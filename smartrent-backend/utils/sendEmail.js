const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Using Gmail as requested by the user
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Define email options
  const mailOptions = {
    from: `"SmartRent Support" <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML version
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
