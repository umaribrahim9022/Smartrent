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
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
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

// --- FORGOT PASSWORD CONTROLLER ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    // Determine the frontend origin (could be from env or referer)
    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';

    await authService.forgotPassword(email, origin);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// --- RESET PASSWORD CONTROLLER ---
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    await authService.resetPassword(token, password);
    return res.status(200).json({ success: true, message: 'Password updated successfully' });
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