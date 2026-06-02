import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import {
  Users,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Mail,
  Plus,
  Search,
  Building,
  Calendar,
  IndianRupee,
  Phone,
  Briefcase,
  UserCheck,
  X,
  Key
} from 'lucide-react';

const UsersList = () => {
  const { user: currentUser } = useAuthStore();
  
  // Data States
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores user ID during updates
  
  // UI States
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'intern' | 'client'
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showInternModal, setShowInternModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Form Hooks
  const { register: regStaff, handleSubmit: submitStaff, reset: resetStaff, formState: { errors: errorsStaff } } = useForm();
  const { register: regIntern, handleSubmit: submitIntern, reset: resetIntern, formState: { errors: errorsIntern } } = useForm();
  const { register: regClient, handleSubmit: submitClient, reset: resetClient, formState: { errors: errorsClient } } = useForm();

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

  const fetchClients = async () => {
    setClientsLoading(true);
    try {
      const response = await api.get('/clients');
      if (response.data?.success) {
        setClients(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err.message);
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      if (response.data?.success) {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClients();
    fetchDepartments();
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const response = await api.put(`/users/${selectedUserForPassword._id}/password`, { password: newPassword });
      if (response.data?.success) {
        setSuccess(response.data.message || 'Password updated successfully!');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update user password');
    } finally {
      setPasswordSubmitting(false);
    }
  };


  const handleDeleteUser = async (userId, userType = 'User') => {
    if (!window.confirm(`Are you sure you want to delete this ${userType}? This action is irreversible.`)) {
      return;
    }

    setActionLoading(userId);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.data?.success) {
        setSuccess(response.data.message || 'User deleted successfully');
        // Remove locally
        setUsers(users.filter((u) => u._id !== userId));
        setClients(clients.filter((c) => c.user?._id !== userId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  // Form Submissions
  const onAddStaff = async (data) => {
    setActionLoading('creating-staff');
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department || null,
        joiningDate: data.joiningDate || new Date(),
        salary: Number(data.salary) || 0,
        phone: data.phone || ''
      };
      
      const response = await api.post('/employees', payload);

      if (response.data?.success) {
        setSuccess('Staff account created successfully & welcome credentials emailed!');
        setShowStaffModal(false);
        resetStaff();
        fetchUsers(); // Refresh users list
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff member');
    } finally {
      setActionLoading(null);
    }
  };

  const onAddIntern = async (data) => {
    setActionLoading('creating-intern');
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'Intern',
        department: data.department || null,
        joiningDate: data.joiningDate || new Date(),
        salary: Number(data.salary) || 0,
        phone: data.phone || ''
      };
      
      const response = await api.post('/employees', payload);

      if (response.data?.success) {
        setSuccess('Intern account created successfully & welcome credentials emailed!');
        setShowInternModal(false);
        resetIntern();
        fetchUsers(); // Refresh
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create intern member');
    } finally {
      setActionLoading(null);
    }
  };

  const onAddClient = async (data) => {
    setActionLoading('creating-client');
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        companyName: data.companyName,
        panNumber: data.panNumber,
        gstin: data.gstin
      };

      const response = await api.post('/clients', payload);
      if (response.data?.success) {
        setSuccess('Client account & business profile created successfully!');
        setShowClientModal(false);
        resetClient();
        fetchClients(); // Refresh clients list
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client profile');
    } finally {
      setActionLoading(null);
    }
  };

  // Lists filtering by active tab & search query
  const filteredStaff = users.filter((u) => {
    const isStaff = ['Admin', 'Manager', 'TL', 'Employee'].includes(u.role?.name);
    if (!isStaff) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.employeeId?.toLowerCase().includes(q)
    );
  });

  const filteredInterns = users.filter((u) => {
    const isIntern = u.role?.name === 'Intern';
    if (!isIntern) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.employeeId?.toLowerCase().includes(q)
    );
  });

  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.clientId?.toLowerCase().includes(q)
    );
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const roleOptions = ['Manager', 'TL', 'Employee'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              Secure User Registry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Administrators only. Change user permissions, register staff or clients, and terminate sessions.
            </p>
          </div>
        </div>

        {/* Dynamic creation button based on active tab */}
        {activeTab === 'staff' && (
          <button
            onClick={() => { setShowStaffModal(true); setError(''); setSuccess(''); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 text-sm font-semibold transition shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Staff
          </button>
        )}
        {activeTab === 'intern' && (
          <button
            onClick={() => { setShowInternModal(true); setError(''); setSuccess(''); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 text-sm font-semibold transition shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Intern
          </button>
        )}
        {activeTab === 'client' && (
          <button
            onClick={() => { setShowClientModal(true); setError(''); setSuccess(''); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 text-sm font-semibold transition shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Client
          </button>
        )}

      </div>

      {/* Tabs Layout */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4">
        <button
          onClick={() => { setActiveTab('staff'); setSearchQuery(''); }}
          className={`py-3 px-4 text-sm font-bold border-b-2 uppercase tracking-wide transition select-none cursor-pointer ${
            activeTab === 'staff'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Staff Directory
        </button>
        <button
          onClick={() => { setActiveTab('intern'); setSearchQuery(''); }}
          className={`py-3 px-4 text-sm font-bold border-b-2 uppercase tracking-wide transition select-none cursor-pointer ${
            activeTab === 'intern'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Intern Registry
        </button>
        <button
          onClick={() => { setActiveTab('client'); setSearchQuery(''); }}
          className={`py-3 px-4 text-sm font-bold border-b-2 uppercase tracking-wide transition select-none cursor-pointer ${
            activeTab === 'client'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Client Accounts
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Filters Search Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
          <input
            type="text"
            placeholder={
              activeTab === 'staff' ? 'Search staff by name, email, or employee ID...' :
              activeTab === 'intern' ? 'Search interns by name, email, or employee ID...' :
              'Search clients by name, business, ID, or email...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Main Table / Loader */}
      {loading || (activeTab === 'client' && clientsLoading) ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'staff' && (
              /* ================== STAFF DIRECTORY TABLE ================== */
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-450 font-bold uppercase">
                    <th className="py-3 px-4">Staff Details</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Monthly CTC</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-450 font-semibold italic">
                        No staff accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((item) => {
                      const isSelf = item._id === currentUser?.id;
                      const isUpdating = actionLoading === item._id;

                      return (
                        <tr
                          key={item._id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${
                            isSelf ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01]' : ''
                          }`}
                        >
                          {/* Details */}
                          <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
                                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800 dark:text-white">
                                  {item.name} {isSelf && <span className="text-[9px] text-indigo-500 font-bold ml-1 uppercase">(You)</span>}
                                </p>
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold leading-none">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  {item.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* ID */}
                          <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {item.employeeId || 'N/A'}
                          </td>

                          {/* Role & Dept */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                                {item.department?.name || 'Unallocated'}
                              </span>
                              {isSelf ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                  <Shield className="h-3 w-3" />
                                  {item.role?.name}
                                </span>
                              ) : (
                                <select
                                  disabled={isUpdating}
                                  value={item.role?.name || ''}
                                  onChange={(e) => handleRoleChange(item._id, e.target.value)}
                                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded py-0.5 px-2 text-[10px] text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer disabled:opacity-50"
                                >
                                  {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                  <option value="Intern">Promote to Intern</option>
                                  <option value="Client">Demote to Client</option>
                                </select>
                              )}
                            </div>
                          </td>

                          {/* Salary */}
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center gap-0.5">
                              <IndianRupee className="h-3 w-3 text-slate-400 shrink-0" />
                              {formatCurrency(item.salary)}
                            </span>
                          </td>

                          {/* Joining Date */}
                          <td className="py-4 px-4 font-semibold text-slate-450">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(item.joiningDate || item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {isSelf ? (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protected</span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => { setSelectedUserForPassword(item); setShowPasswordModal(true); setPasswordError(''); setNewPassword(''); setConfirmPassword(''); }}
                                    disabled={isUpdating}
                                    className="rounded-lg p-2 text-indigo-500 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/25 disabled:opacity-50 cursor-pointer active:scale-[0.95] transition"
                                    title="Change Password"
                                  >
                                    <Key className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(item._id, 'Staff')}
                                    disabled={isUpdating}
                                    className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 disabled:opacity-50 cursor-pointer active:scale-[0.95] transition"
                                    title="Delete Staff Account"
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'intern' && (
              /* ================== INTERN REGISTRY TABLE ================== */
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-450 font-bold uppercase">
                    <th className="py-3 px-4">Intern Details</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Assigned Department</th>
                    <th className="py-3 px-4">Stipend</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                  {filteredInterns.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-450 font-semibold italic">
                        No interns found.
                      </td>
                    </tr>
                  ) : (
                    filteredInterns.map((item) => {
                      const isUpdating = actionLoading === item._id;

                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          {/* Details */}
                          <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-[10px]">
                                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800 dark:text-white">
                                  {item.name}
                                </p>
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold leading-none">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  {item.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* ID */}
                          <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {item.employeeId || 'N/A'}
                          </td>

                          {/* Dept / Promote */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                                {item.department?.name || 'Unallocated'}
                              </span>
                              <select
                                disabled={isUpdating}
                                value={item.role?.name || ''}
                                onChange={(e) => handleRoleChange(item._id, e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded py-0.5 px-2 text-[10px] text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer disabled:opacity-50"
                              >
                                <option value="Intern">Intern</option>
                                <option value="Employee">Promote to Employee</option>
                                <option value="TL">Promote to TL</option>
                                <option value="Manager">Promote to Manager</option>
                                <option value="Client">Demote to Client</option>
                              </select>
                            </div>
                          </td>

                          {/* Stipend */}
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center gap-0.5">
                              <IndianRupee className="h-3 w-3 text-slate-400 shrink-0" />
                              {formatCurrency(item.salary)}
                            </span>
                          </td>

                          {/* Joining Date */}
                          <td className="py-4 px-4 font-semibold text-slate-450">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(item.joiningDate || item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => { setSelectedUserForPassword(item); setShowPasswordModal(true); setPasswordError(''); setNewPassword(''); setConfirmPassword(''); }}
                                disabled={isUpdating}
                                className="rounded-lg p-2 text-indigo-500 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/25 disabled:opacity-50 cursor-pointer active:scale-[0.95] transition"
                                title="Change Password"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(item._id, 'Intern')}
                                disabled={isUpdating}
                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 disabled:opacity-50 cursor-pointer active:scale-[0.95] transition"
                                title="Delete Intern Account"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'client' && (
              /* ================== CLIENT ACCOUNTS TABLE ================== */
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-450 font-bold uppercase">
                    <th className="py-3 px-4">Client ID</th>
                    <th className="py-3 px-4">Client Representative</th>
                    <th className="py-3 px-4">Business / Company Details</th>
                    <th className="py-3 px-4">PAN Details</th>
                    <th className="py-3 px-4">GSTIN Details</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-450 font-semibold italic">
                        No clients found.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((item) => {
                      const isUpdating = actionLoading === item.user?._id;

                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          {/* Client ID */}
                          <td className="py-4 px-4 font-black text-indigo-500">
                            {item.clientId || 'Generated...'}
                          </td>

                          {/* Representative */}
                          <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-[10px]">
                                {item.user?.name ? item.user.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800 dark:text-white">
                                  {item.user?.name || 'Deleted Representative'}
                                </p>
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold leading-none">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  {item.user?.email || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Company / Phone */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                {item.companyName}
                              </span>
                              {item.user?.phone && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold leading-none">
                                  <Phone className="h-3 w-3 shrink-0" />
                                  {item.user.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* PAN */}
                          <td className="py-4 px-4 font-black text-slate-600 dark:text-slate-350 uppercase">
                            {item.panNumber || 'Not Specified'}
                          </td>

                          {/* GSTIN */}
                          <td className="py-4 px-4 font-black text-slate-600 dark:text-slate-350 uppercase">
                            {item.gstin || 'Not Registered'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            {item.user?._id && (
                              <button
                                onClick={() => handleDeleteUser(item.user._id, 'Client')}
                                disabled={isUpdating}
                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 disabled:opacity-50 cursor-pointer active:scale-[0.95] transition"
                                title="Delete Client Account"
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
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================== MODAL: ADD STAFF MEMBER ================== */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-500" />
                Register Staff Member
              </h3>
              <button onClick={() => { setShowStaffModal(false); setError(''); setSuccess(''); resetStaff(); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submitStaff(onAddStaff)} className="grid grid-cols-2 gap-4 text-xs font-semibold">
              {/* Name */}
              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 block">Full Name</label>
                <input
                  type="text"
                  {...regStaff('name', { required: 'Name is required' })}
                  placeholder="Employee Full Name"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsStaff.name && <p className="text-red-400 text-[10px]">{errorsStaff.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Email Address</label>
                <input
                  type="email"
                  {...regStaff('email', { required: 'Email is required' })}
                  placeholder="employee@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsStaff.email && <p className="text-red-400 text-[10px]">{errorsStaff.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Temporary Password</label>
                <input
                  type="text"
                  {...regStaff('password', { required: 'Password is required', minLength: 6 })}
                  defaultValue="welcome123"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsStaff.password && <p className="text-red-400 text-[10px]">{errorsStaff.password.message || 'At least 6 characters'}</p>}
              </div>

              {/* Employee ID */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Employee ID</label>
                <input
                  type="text"
                  disabled
                  value="Auto-generated"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-400 cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Mobile Phone</label>
                <input
                  type="tel"
                  {...regStaff('phone')}
                  placeholder="+91 99999 99999"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Department</label>
                <select
                  {...regStaff('department')}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="">Unallocated</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Staff Role</label>
                <select
                  {...regStaff('role')}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="Employee">Employee</option>
                  <option value="TL">Team Leader</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              {/* Monthly Salary */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Monthly CTC (INR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <IndianRupee className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    {...regStaff('salary', { required: 'Salary is required' })}
                    placeholder="45000"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {errorsStaff.salary && <p className="text-red-400 text-[10px]">{errorsStaff.salary.message}</p>}
              </div>

              {/* Joining Date */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Joining Date</label>
                <input
                  type="date"
                  {...regStaff('joiningDate')}
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => { setShowStaffModal(false); setError(''); setSuccess(''); resetStaff(); }}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating-staff'}
                  className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'creating-staff' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================== MODAL: ADD INTERN APPRENTICE ================== */}
      {showInternModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                Register Intern Apprentice
              </h3>
              <button onClick={() => { setShowInternModal(false); setError(''); setSuccess(''); resetIntern(); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submitIntern(onAddIntern)} className="grid grid-cols-2 gap-4 text-xs font-semibold">
              {/* Name */}
              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 block">Full Name</label>
                <input
                  type="text"
                  {...regIntern('name', { required: 'Name is required' })}
                  placeholder="Intern Full Name"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsIntern.name && <p className="text-red-400 text-[10px]">{errorsIntern.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Email Address</label>
                <input
                  type="email"
                  {...regIntern('email', { required: 'Email is required' })}
                  placeholder="intern@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsIntern.email && <p className="text-red-400 text-[10px]">{errorsIntern.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Temporary Password</label>
                <input
                  type="text"
                  {...regIntern('password', { required: 'Password is required', minLength: 6 })}
                  defaultValue="welcome123"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsIntern.password && <p className="text-red-400 text-[10px]">{errorsIntern.password.message || 'At least 6 characters'}</p>}
              </div>

              {/* Employee ID */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Intern / Employee ID</label>
                <input
                  type="text"
                  disabled
                  value="Auto-generated"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-400 cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Mobile Phone</label>
                <input
                  type="tel"
                  {...regIntern('phone')}
                  placeholder="+91 99999 99999"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Department</label>
                <select
                  {...regIntern('department')}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="">Unallocated</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Stipend */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Monthly Stipend (INR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <IndianRupee className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    {...regIntern('salary', { required: 'Stipend is required' })}
                    placeholder="15000"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {errorsIntern.salary && <p className="text-red-400 text-[10px]">{errorsIntern.salary.message}</p>}
              </div>

              {/* Joining Date */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Joining Date</label>
                <input
                  type="date"
                  {...regIntern('joiningDate')}
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => { setShowInternModal(false); setError(''); setSuccess(''); resetIntern(); }}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating-intern'}
                  className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'creating-intern' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Intern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================== MODAL: ADD CLIENT PROFILE ================== */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-500" />
                Spawn Client Profile & Account
              </h3>
              <button onClick={() => { setShowClientModal(false); setError(''); setSuccess(''); resetClient(); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submitClient(onAddClient)} className="grid grid-cols-2 gap-4 text-xs font-semibold">
              {/* Representative Name */}
              <div className="col-span-2 space-y-1">
                <label className="text-slate-500 block">Representative Name</label>
                <input
                  type="text"
                  {...regClient('name', { required: 'Name is required' })}
                  placeholder="John Representative"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsClient.name && <p className="text-red-400 text-[10px]">{errorsClient.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Portal Email Address</label>
                <input
                  type="email"
                  {...regClient('email', { required: 'Email is required' })}
                  placeholder="client@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsClient.email && <p className="text-red-400 text-[10px]">{errorsClient.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Temporary Password</label>
                <input
                  type="text"
                  {...regClient('password', { required: 'Password is required', minLength: 6 })}
                  defaultValue="welcome123"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsClient.password && <p className="text-red-400 text-[10px]">{errorsClient.password.message || 'At least 6 characters'}</p>}
              </div>

              {/* Phone (Strictly Required for Client ID generation) */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Mobile Phone (Strictly Required)</label>
                <input
                  type="tel"
                  {...regClient('phone', { required: 'Phone number is required' })}
                  placeholder="+91 99999 99999"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsClient.phone && <p className="text-red-400 text-[10px]">{errorsClient.phone.message}</p>}
              </div>

              {/* Company Name (Strictly Required) */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Business / Company Name</label>
                <input
                  type="text"
                  {...regClient('companyName', { required: 'Company name is required' })}
                  placeholder="Apex Solutions LLP"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errorsClient.companyName && <p className="text-red-400 text-[10px]">{errorsClient.companyName.message}</p>}
              </div>

              {/* PAN Number */}
              <div className="space-y-1">
                <label className="text-slate-500 block">PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  {...regClient('panNumber', {
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
                      message: 'Invalid PAN format',
                    }
                  })}
                  placeholder="ABCDE1234F"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                />
                {errorsClient.panNumber && <p className="text-red-400 text-[10px]">{errorsClient.panNumber.message}</p>}
              </div>

              {/* GSTIN */}
              <div className="space-y-1">
                <label className="text-slate-500 block">GSTIN Number</label>
                <input
                  type="text"
                  maxLength={15}
                  {...regClient('gstin', {
                    pattern: {
                      value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
                      message: 'Invalid GSTIN format',
                    }
                  })}
                  placeholder="27ABCDE1234F1Z0"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                />
                {errorsClient.gstin && <p className="text-red-400 text-[10px]">{errorsClient.gstin.message}</p>}
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => { setShowClientModal(false); setError(''); setSuccess(''); resetClient(); }}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating-client'}
                  className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'creating-client' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Spawn Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================== MODAL: RESET PASSWORD ================== */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-indigo-500" />
                Reset User Password
              </h3>
              <button 
                onClick={() => { setShowPasswordModal(false); setSelectedUserForPassword(null); setPasswordError(''); }} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are updating the login credentials for:
              </p>
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs">
                <div className="font-bold text-slate-800 dark:text-white">{selectedUserForPassword.name}</div>
                <div className="text-slate-500 dark:text-slate-400 font-semibold">{selectedUserForPassword.email}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-1.5 py-0.5 rounded inline-block">
                  {selectedUserForPassword.role?.name || 'Staff'}
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs font-semibold">
              {/* New Password */}
              <div className="space-y-1">
                <label className="text-slate-500 block">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-slate-500 block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setSelectedUserForPassword(null); setPasswordError(''); }}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 cursor-pointer disabled:opacity-50"
                >
                  {passwordSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersList;

