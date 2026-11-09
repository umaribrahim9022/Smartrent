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
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Create new user (Password hash automatically hoga User model pre-save hook se)
  const user = await User.create({
    name,
    email: cleanEmail,
    password,
    role: role || 'renter',
    isVerified: false,
    verificationCode: otp,
    verificationCodeExpire: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  // 3. Send OTP via email
  try {
    await sendEmail({
      email: user.email,
      subject: 'SmartRent Email Verification OTP',
      message: `Your verification code is ${otp}. It will expire in 10 minutes.`,
      html: `
        <h3>Welcome to SmartRent!</h3>
        <p>Please use the following OTP to verify your email address. It will expire in 10 minutes.</p>
        <h2 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 2px;">${otp}</h2>
        <p>If you did not request this, please ignore this email.</p>
      `
    });
  } catch (error) {
    console.error('Email error: ', error);
    // Even if email fails, user is created, but we can return an error
    const emailError = new Error('Registration successful but OTP email could not be sent. Please contact support.');
    emailError.statusCode = 500;
    throw emailError;
  }

  // Do NOT return a token yet. The user must verify the OTP first.
  return {
    message: 'OTP sent successfully. Please check your email.',
    email: user.email
  };
};

// --- VERIFY EMAIL SERVICE ---
exports.verifyEmail = async (email, otp) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ 
    email: cleanEmail,
    verificationCode: otp,
    verificationCodeExpire: { $gt: Date.now() }
  });

  if (!user) {
    const error = new Error('Invalid or expired OTP');
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
exports.forgotPassword = async (email, origin) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const user = await User.findOne({ email: cleanEmail });
  
  if (!user) {
    const error = new Error('User not found with this email');
    error.statusCode = 404;
    throw error;
  }

  // Create reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expire (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  await user.save();

  // Create reset URL
  const resetUrl = `${origin}/reset-password/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT/POST request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'SmartRent Password Reset',
      message: message,
      html: `
        <h3>SmartRent Password Reset</h3>
        <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    console.error('Email error: ', error);
    const emailError = new Error('Email could not be sent. Check SMTP configuration.');
    emailError.statusCode = 500;
    throw emailError;
  }
};

// --- RESET PASSWORD SERVICE ---
exports.resetPassword = async (resetToken, newPassword) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 400;
    throw error;
  }

  // Set new password
  user.password = newPassword; // the pre-save hook will hash it
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
};