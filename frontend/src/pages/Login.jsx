import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setFormError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setFormError(result.message || 'Invalid email or password');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {(error || formError) && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {formError || error}
        </div>
      )}

      {/* Email Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
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
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition duration-150"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
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
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl py-3 font-semibold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="h-4.5 w-4.5" />
          </>
        )}
      </button>

      <div className="pt-2 text-center border-t border-slate-800/40">
        <p className="text-[11px] text-slate-500 leading-normal">
          Demo emails: <code className="text-slate-400 bg-slate-850 px-1 py-0.5 rounded">admin@company.com</code>, <code className="text-slate-400 bg-slate-850 px-1 py-0.5 rounded">client@company.com</code> (pass: <code className="text-slate-400 bg-slate-850 px-1 py-0.5 rounded">password123</code>)
        </p>
      </div>
    </form>
  );
};

export default Login;
