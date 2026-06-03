import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  User, 
  Phone, 
  Building, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';

const Login = () => {
  const { login, register: registerClient, sendOtp, isLoading, error: authError, clearError } = useAuthStore();
  const navigate = useNavigate();
  
  const [isRegister, setIsRegister] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm();

  const watchEmail = watch('email');

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestOtp = async () => {
    if (!watchEmail || errors.email) {
      setFormError('Please enter a valid email address first to receive the verification code.');
      return;
    }

    setFormError('');
    setFormSuccess('');
    setOtpLoading(true);

    const result = await sendOtp(watchEmail);
    setOtpLoading(false);

    if (result.success) {
      setOtpSent(true);
      setCountdown(60); // 60 seconds throttle
      setFormSuccess('Verification code (OTP) sent to your email. Please check your inbox.');
    } else {
      setFormError(result.message || 'Failed to send OTP. Please try again.');
    }
  };

  const onSubmit = async (data) => {
    setFormError('');
    setFormSuccess('');
    clearError();
    
    if (isRegister) {
      // Validate Client Registration
      if (!otpSent) {
        setFormError('Please request and enter the verification code sent to your email.');
        return;
      }
      
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'Client',
        otp: data.otp,
        phone: data.phone,
        companyName: data.companyName,
        panNumber: data.panNumber,
        gstin: data.gstin
      };

      const result = await registerClient(payload);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setFormError(result.message || 'Registration failed');
      }
    } else {
      // Sign In Action
      const result = await login(data.email, data.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setFormError(result.message || 'Invalid email or password');
      }
    }
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setFormError('');
    setFormSuccess('');
    setOtpSent(false);
    clearError();
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Messages */}
      {(formError || authError) && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 leading-relaxed">
          {formError || authError}
        </div>
      )}

      {formSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 leading-relaxed">
          {formSuccess}
        </div>
      )}

      {isRegister ? (
        /* ================== CLIENT REGISTRATION FORM ================== */
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                {...register('name', { required: 'Full name is required' })}
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-[10px] text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email Address with Send OTP */}
          <div>
            <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <button
                type="button"
                disabled={otpLoading || countdown > 0}
                onClick={handleRequestOtp}
                className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-3 py-2 text-[10px] uppercase shadow disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 transition"
              >
                {otpLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : countdown > 0 ? (
                  `Resend (${countdown}s)`
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
            {errors.email && (
              <p className="mt-1 text-[10px] text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Verification Code (OTP) */}
          {otpSent && (
            <div className="animate-slide-in">
              <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
                Enter Verification Code (OTP)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  {...register('otp', { required: 'Verification code is required' })}
                  placeholder="6-digit OTP"
                  className="w-full bg-indigo-50/30 border border-indigo-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-center tracking-[4px] text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              {errors.otp && (
                <p className="mt-1 text-[10px] text-red-500">{errors.otp.message}</p>
              )}
            </div>
          )}

          {/* Mobile/Phone Number (Strictly Required) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
              Mobile / Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="tel"
                {...register('phone', { required: 'Phone number is required' })}
                placeholder="+91 99999 99999"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-[10px] text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Company / Business Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
              Business / Company Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Building className="h-4 w-4" />
              </span>
              <input
                type="text"
                {...register('companyName', { required: 'Business name is required' })}
                placeholder="Apex Advisory Services LLP"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            {errors.companyName && (
              <p className="mt-1 text-[10px] text-red-500">{errors.companyName.message}</p>
            )}
          </div>

          {/* PAN & GSTIN (Two Column Layout) */}
          <div className="grid grid-cols-2 gap-4">
            {/* PAN Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
                PAN Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <FileText className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  maxLength={10}
                  {...register('panNumber', {
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
                      message: 'Invalid PAN format',
                    }
                  })}
                  placeholder="ABCDE1234F"
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2 pl-10 pr-4 text-[11px] text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition uppercase"
                />
              </div>
              {errors.panNumber && (
                <p className="mt-1 text-[9px] text-red-500">{errors.panNumber.message}</p>
              )}
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
                GSTIN Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <FileText className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  maxLength={15}
                  {...register('gstin', {
                    pattern: {
                      value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
                      message: 'Invalid GSTIN format',
                    }
                  })}
                  placeholder="27ABCDE1234F1Z0"
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2 pl-10 pr-4 text-[11px] text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition uppercase"
                />
              </div>
              {errors.gstin && (
                <p className="mt-1 text-[9px] text-red-500">{errors.gstin.message}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
              Create Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-[10px] text-red-500">{errors.password.message}</p>
            )}
          </div>
        </div>
      ) : (
        /* ================== SIGN IN FORM ================== */
        <div className="space-y-4 animate-fade-in">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition duration-200"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-500 hover:text-indigo-605 hover:underline transition duration-150"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition duration-200"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            {isRegister ? 'Creating Account...' : 'Authenticating...'}
          </>
        ) : (
          <>
            {isRegister ? 'Register & Verify Business' : 'Sign In'}
            <ArrowRight className="h-4.5 w-4.5" />
          </>
        )}
      </button>

      {/* Mode Switcher */}
      <div className="text-center pt-2 border-t border-slate-150 mt-4">
        {isRegister ? (
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-xs text-indigo-500 hover:text-indigo-605 font-bold hover:underline transition cursor-pointer"
          >
            Already have an account? Sign In Here
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-xs text-indigo-500 hover:text-indigo-655 font-bold hover:underline transition cursor-pointer"
          >
            Are you a Client? Register Business Here
          </button>
        )}
      </div>


    </form>
  );
};

export default Login;
