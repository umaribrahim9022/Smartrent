import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('reset');
        setResendCooldown(60);
        setSuccessMsg(data.message || 'Verification code sent! Please check your email.');
      } else {
        setError(data.message || 'Failed to send verification code. Please check your email.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          password: newPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Password updated successfully! Redirecting to login…');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password. Please check your OTP.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (data.success) {
        setResendCooldown(60);
        setSuccessMsg('A new verification code has been sent to your email.');
      } else {
        setError(data.message || 'Could not resend code. Please try again.');
      }
    } catch (err) {
      setError('Server connection error while resending code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex items-center justify-center px-4 py-14 relative">
      <div className="grain-glow w-[420px] h-[420px] top-1/4 left-1/2 -translate-x-1/2" />

      <div className="surface relative z-10 w-full max-w-sm p-8 space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-xl" style={{ background: 'var(--brand-soft)' }}>
            {step === 'reset' ? (
              <Lock className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            ) : (
              <KeyRound className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            )}
          </div>
          <h1 className="text-2xl font-semibold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            {step === 'reset' ? 'Reset Password' : 'Forgot Password'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            {step === 'reset' ? (
              <span>
                Enter the code sent to <strong className="font-semibold text-primary">{email}</strong>
              </span>
            ) : (
              'Enter your email to receive a 6-digit reset code.'
            )}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs font-medium text-center" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-1.5" style={{ background: '#ecfdf5', color: '#047857' }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'email' ? (
          /* STEP 1: ENTER EMAIL */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label">Email address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input has-icon-left pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
              {loading ? 'Sending code…' : 'Send Reset Code'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
              </Link>
            </div>
          </form>
        ) : (
          /* STEP 2: ENTER OTP & NEW PASSWORD */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label text-center block">Verification Code (OTP)</label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-xl font-bold tracking-widest py-3"
                style={{ letterSpacing: '8px' }}
              />
              <p className="text-[11px] text-center" style={{ color: 'var(--ink-faint)' }}>
                Check inbox and Spam/Junk folder.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="field-label">New password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input has-icon-both pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 cursor-pointer"
                  style={{ color: 'var(--ink-faint)' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Confirm new password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input has-icon-both pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 cursor-pointer"
                  style={{ color: 'var(--ink-faint)' }}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
              {loading ? 'Updating password…' : 'Update Password'}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center gap-1 font-medium hover:underline"
                style={{ color: 'var(--ink-soft)' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change email
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending}
                className="inline-flex items-center gap-1 font-semibold disabled:opacity-50 hover:underline"
                style={{ color: 'var(--brand)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
