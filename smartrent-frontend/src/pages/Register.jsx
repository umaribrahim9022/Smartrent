import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Eye, EyeOff, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { setStoredAuth } from '../utils/authStorage';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'renter' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP Step State
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Cooldown countdown effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms and Conditions.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        // Switch to OTP verification step
        setStep('otp');
        setResendCooldown(60);
        setSuccessMsg(data.message || 'OTP sent! Please check your email inbox (and spam folder).');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setOtpLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otp.trim(),
        }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        setStoredAuth(data.token, data.user);
        navigate('/');
      } else {
        setError(data.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please check your connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();

      if (data.success) {
        setResendCooldown(60);
        setSuccessMsg(data.message || 'A new OTP has been sent to your email.');
      } else {
        setError(data.message || 'Could not resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Failed to resend OTP. Server connection error.');
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
            {step === 'otp' ? (
              <KeyRound className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            ) : (
              <Building2 className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            )}
          </div>
          <h1 className="text-2xl font-semibold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            {step === 'otp' ? 'Verify Your Email' : 'Join SmartRent.AI'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            {step === 'otp' ? (
              <span>
                Enter the 6-digit code sent to <strong className="font-semibold text-primary">{formData.email}</strong>
              </span>
            ) : (
              'Unlock a smarter rental search.'
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

        {step === 'otp' ? (
          /* STEP 2: OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label text-center block">Verification Code (OTP)</label>
              <div className="relative flex items-center">
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
              </div>
              <p className="text-[11px] text-center" style={{ color: 'var(--ink-faint)' }}>
                Please check both your inbox and Spam/Junk folder.
              </p>
            </div>

            <button type="submit" disabled={otpLoading} className="btn btn-primary btn-block btn-lg">
              {otpLoading ? 'Verifying…' : 'Verify & Complete'}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center gap-1 font-medium hover:underline"
                style={{ color: 'var(--ink-soft)' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to edit
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
        ) : (
          /* STEP 1: REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label">Full name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input has-icon-left pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Email address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input has-icon-left pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input has-icon-both pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 cursor-pointer" style={{ color: 'var(--ink-faint)' }} aria-label={showPass ? 'Hide password' : 'Show password'}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="field-label">Confirm password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input has-icon-both pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 cursor-pointer" style={{ color: 'var(--ink-faint)' }} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {['renter', 'owner'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  className="py-2 rounded-xl text-xs font-semibold capitalize transition border"
                  style={
                    formData.role === r
                      ? { background: 'var(--brand-soft)', borderColor: 'var(--brand)', color: 'var(--brand-strong)' }
                      : { borderColor: 'var(--border)', color: 'var(--ink-faint)' }
                  }
                >
                  {r === 'renter' ? 'Renter' : 'Owner'}
                </button>
              ))}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: 'var(--brand)' }}
              />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                I agree to the{' '}
                <span className="font-medium" style={{ color: 'var(--brand)' }}>Terms and Conditions</span>{' '}
                and <span className="font-medium" style={{ color: 'var(--brand)' }}>Privacy Policy</span>.
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
              {loading ? 'Sending verification code…' : 'Create account'}
            </button>
          </form>
        )}

        <p className="text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--brand)' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
