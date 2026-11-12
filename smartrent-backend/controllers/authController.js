const authService = require('../services/authService');

// --- LOGIN CONTROLLER ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await authService.loginUser(email, password);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      needsVerification: error.needsVerification || false,
      email: error.email || undefined
    });
  }
};

// --- REGISTER CONTROLLER ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const result = await authService.registerUser(name, email, password, role);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error('Registration Error:', error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// --- RESEND OTP CONTROLLER ---
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to resend OTP' });
    }

    const result = await authService.resendOTP(email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// --- FORGOT PASSWORD CONTROLLER ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const result = await authService.forgotPassword(email);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// --- RESET PASSWORD CONTROLLER ---
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token || req.body.token || req.body.otp;
    const { email, password, newPassword } = req.body;
    const finalPassword = password || newPassword;

    if (!finalPassword) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    if (email && (req.body.otp || token)) {
      const result = await authService.resetPasswordWithOtp(email, req.body.otp || token, finalPassword);
      return res.status(200).json({ success: true, ...result });
    } else if (token) {
      await authService.resetPassword(token, finalPassword);
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Verification code or token is required' });
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// --- VERIFY EMAIL CONTROLLER ---
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await authService.verifyEmail(email, otp);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
