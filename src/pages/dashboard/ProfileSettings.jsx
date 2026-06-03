import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  User,
  Key,
  Phone,
  MapPin,
  Mail,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const ProfileSettings = () => {
  const { user } = useAuthStore();

  // Profile fields state
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  // Password fields state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await api.put('/users/profile', { phone, address });
      if (response.data?.success) {
        setProfileSuccess('Profile contact details updated successfully.');
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSubmittingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const response = await api.put('/users/change-password', {
        oldPassword,
        newPassword,
      });

      if (response.data?.success) {
        setPasswordSuccess('Password changed successfully.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
          Profile Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal phone, address details, and update security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Contact Info Panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">Contact Details</h3>
          </div>
          <hr className="border-slate-100 dark:border-slate-900" />

          {profileSuccess && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              <p>{profileSuccess}</p>
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-rose-500">
              <AlertCircle className="h-4 w-4" />
              <p>{profileError}</p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full p-2.5 border border-slate-150 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-150 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">Office / Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  placeholder="Street, City, State..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingProfile}
              className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer text-xs"
            >
              {submittingProfile ? 'Saving Details...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Change Password Panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">Account Security</h3>
          </div>
          <hr className="border-slate-100 dark:border-slate-900" />

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              <p>{passwordSuccess}</p>
            </div>
          )}
          {passwordError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-rose-500">
              <AlertCircle className="h-4 w-4" />
              <p>{passwordError}</p>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                placeholder="••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                placeholder="••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer text-xs"
            >
              {submittingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ProfileSettings;
