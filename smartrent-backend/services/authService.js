const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// --- LOGIN SERVICE ---
exports.loginUser = async (email, password) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 400;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error('Please verify your email before logging in. If you just registered, check your email for the OTP.');
    error.statusCode = 403;
    error.needsVerification = true;
    error.email = user.email;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 400;
    throw error;
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'my_super_secret_jwt_key',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

// --- REGISTER SERVICE ---
exports.registerUser = async (name, email, password, role) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  // 1. Check if user already exists
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser && existingUser.isVerified) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Generate 6 digit OTP & 10 min expiration
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpire = Date.now() + 10 * 60 * 1000;

  let user;
  if (existingUser && !existingUser.isVerified) {
    // Reuse and update unverified account
    existingUser.name = name;
    existingUser.password = password; // Will be hashed by pre('save') hook
    if (role) existingUser.role = role;
    existingUser.verificationCode = otp;
    existingUser.verificationCodeExpire = otpExpire;
    user = await existingUser.save();
  } else {
    // Create new user (pre('save') hook handles password hashing)
    user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: role || 'renter',
      isVerified: false,
      verificationCode: otp,
      verificationCodeExpire: otpExpire
    });
  }

  // Always log OTP to server console for instant local development/debugging visibility
  console.log(`\n=========================================`);
  console.log(`[SmartRent OTP] Code for ${user.email}: [ ${otp} ]`);
  console.log(`=========================================\n`);

  // 3. Send OTP via email in background (instant non-blocking response)
  sendEmail({
    email: user.email,
    subject: 'SmartRent Email Verification OTP',
    message: `Your verification code is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0; font-size: 22px;">SmartRent.AI Verification</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Welcome to SmartRent! Please enter the 6-digit code below to verify your email address:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 28px; background: #eef2ff; color: #4338ca; border-radius: 8px; border: 1px dashed #6366f1;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.4;">This code is valid for 10 minutes. If you did not create an account with SmartRent, you can safely ignore this email.</p>
      </div>
    `
  }).catch((error) => {
    console.warn(`[OTP Email Warning] Could not send email immediately to ${user.email}:`, error.message);
  });

  return {
    message: 'OTP sent successfully. Please check your email.',
    email: user.email
  };
};

// --- RESEND OTP SERVICE ---
exports.resendOTP = async (email) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    const error = new Error('No account found with this email address.');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    const error = new Error('This account is already verified. Please log in.');
    error.statusCode = 400;
    throw error;
  }

  // Generate fresh 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = otp;
  user.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  console.log(`\n=========================================`);
  console.log(`[SmartRent OTP Resend] Code for ${user.email}: [ ${otp} ]`);
  console.log(`=========================================\n`);

  sendEmail({
    email: user.email,
    subject: 'SmartRent Verification OTP (Resend)',
    message: `Your new verification code is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0; font-size: 22px;">SmartRent.AI Verification</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Here is your requested new verification code:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 28px; background: #eef2ff; color: #4338ca; border-radius: 8px; border: 1px dashed #6366f1;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.4;">This code is valid for 10 minutes.</p>
      </div>
    `
  }).catch((error) => {
    console.warn(`[OTP Resend Email Warning] Could not send email immediately to ${user.email}:`, error.message);
  });

  return {
    message: 'A new verification code has been sent to your email.',
    email: user.email
  };
};

// --- VERIFY EMAIL SERVICE ---
exports.verifyEmail = async (email, otp) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanOtp = otp ? otp.toString().trim() : '';

  const user = await User.findOne({ 
    email: cleanEmail,
    verificationCode: cleanOtp,
    verificationCodeExpire: { $gt: Date.now() }
  });

  if (!user) {
    const error = new Error('Invalid or expired OTP. Please check the code or request a new one.');
    error.statusCode = 400;
    throw error;
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpire = undefined;
  await user.save();

  // Generate Token for auto-login after verification
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'my_super_secret_jwt_key',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

// --- FORGOT PASSWORD SERVICE ---
exports.forgotPassword = async (email) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ email: cleanEmail });
  
  if (!user) {
    const error = new Error('No account found with this email address');
    error.statusCode = 404;
    throw error;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expire (10 minutes)
  user.resetPasswordToken = otp;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  console.log(`\n=========================================`);
  console.log(`[SmartRent Password Reset OTP] Code for ${user.email}: [ ${otp} ]`);
  console.log(`=========================================\n`);

  // Send reset OTP non-blocking
  sendEmail({
    email: user.email,
    subject: 'SmartRent Password Reset OTP',
    message: `Your password reset code is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0; font-size: 22px;">SmartRent.AI Password Reset</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">You requested to reset your password. Use the 6-digit code below to set a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 28px; background: #eef2ff; color: #4338ca; border-radius: 8px; border: 1px dashed #6366f1;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.4;">This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `
  }).catch((err) => {
    console.warn(`[Forgot Password Email Warning] Could not send email immediately to ${user.email}:`, err.message);
  });

  return {
    message: 'Verification code sent successfully. Please check your email.',
    email: user.email
  };
};

// --- RESET PASSWORD WITH OTP SERVICE ---
exports.resetPasswordWithOtp = async (email, otp, newPassword) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanOtp = otp ? otp.toString().trim() : '';

  const user = await User.findOne({
    email: cleanEmail,
    resetPasswordToken: cleanOtp,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    const error = new Error('Invalid or expired verification code. Please check the code or request a new one.');
    error.statusCode = 400;
    throw error;
  }

  // Set new password (the pre-save hook will hash it automatically)
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return {
    message: 'Password updated successfully. You can now log in with your new password.'
  };
};

// --- RESET PASSWORD (LEGACY TOKEN) SERVICE ---
exports.resetPassword = async (resetToken, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
};
