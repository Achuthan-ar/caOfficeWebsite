import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Users,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Clock,
  Mail,
} from 'lucide-react';

const UsersList = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores user ID during updates
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      if (response.data?.success) {
        setUsers(response.data.data);
      } else {
        setError('Failed to load user list');
      }
    } catch (err) {
      console.error('Error fetching users:', err.message);
      setError(err.response?.data?.message || 'Error connecting to user service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      if (response.data?.success) {
        setSuccess(response.data.message || `Role updated successfully to ${newRole}`);
        // Update user locally
        setUsers(users.map((u) => (u._id === userId ? { ...u, role: response.data.data.role } : u)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
      return;
    }

    setActionLoading(userId);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.data?.success) {
        setSuccess(response.data.message || 'User deleted successfully');
        // Remove user locally
        setUsers(users.filter((u) => u._id !== userId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  const roleOptions = ['Admin', 'Manager', 'TL', 'Employee', 'Intern', 'Client'];

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              User Accounts Registry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Administrators only. Change user permissions or terminate sessions.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
          Total Users: {users.length}
        </span>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
              <th className="py-3 px-4 font-bold uppercase">Name</th>
              <th className="py-3 px-4 font-bold uppercase">Email</th>
              <th className="py-3 px-4 font-bold uppercase">Current Role</th>
              <th className="py-3 px-4 font-bold uppercase">Created On</th>
              <th className="py-3 px-4 font-bold uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
            {users.map((item) => {
              const isSelf = item._id === currentUser?.id;
              const isUpdating = actionLoading === item._id;

              return (
                <tr
                  key={item._id}
                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${
                    isSelf ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01]' : ''
                  }`}
                >
                  {/* Name */}
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-[10px]">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <span>
                        {item.name} {isSelf && <span className="text-[10px] text-indigo-500 font-semibold">(You)</span>}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-4 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.email}</span>
                    </div>
                  </td>

                  {/* Role Selector */}
                  <td className="py-4 px-4">
                    {isSelf ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                        <Shield className="h-3.5 w-3.5" />
                        {item.role?.name || 'Admin'}
                      </span>
                    ) : (
                      <div className="relative inline-block w-36">
                        <select
                          disabled={isUpdating}
                          value={item.role?.name || ''}
                          onChange={(e) => handleRoleChange(item._id, e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>

                  {/* Created On */}
                  <td className="py-4 px-4 font-medium text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Terminate Action */}
                  <td className="py-4 px-4 text-right">
                    {isSelf ? (
                      <span className="text-[10px] font-semibold text-slate-400">Protected</span>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(item._id)}
                        disabled={isUpdating}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 active:scale-[0.95] disabled:opacity-50 cursor-pointer transition-all duration-200"
                        title="Delete User Account"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
