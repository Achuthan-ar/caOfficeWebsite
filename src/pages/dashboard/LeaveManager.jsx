import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Coffee,
  Check,
  X,
  Send,
  Loader2,
} from 'lucide-react';

const LeaveManager = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('my-history');
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [leaveBalance, setLeaveBalance] = useState(currentUser?.leaveBalance || 15);

  // Review states
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      leaveType: 'Casual Leave',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const isManagerOrAdmin = ['Admin', 'Manager'].includes(currentUser?.role?.name);

  const fetchMyLeaves = useCallback(async () => {
    try {
      const response = await api.get('/leaves/my');
      if (response.data?.success) {
        setMyLeaves(response.data.data);
      }
      
      // Update profile info for leave balance
      const meResponse = await api.get('/auth/me');
      if (meResponse.data?.success) {
        setLeaveBalance(meResponse.data.data.leaveBalance);
      }
    } catch (err) {
      console.error('Error fetching my leaves:', err.message);
    }
  }, []);

  const fetchTeamLeaves = useCallback(async () => {
    if (!isManagerOrAdmin) return;
    try {
      const response = await api.get('/leaves');
      if (response.data?.success) {
        setTeamLeaves(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching team leaves:', err.message);
    }
  }, [isManagerOrAdmin]);

  const initData = useCallback(async () => {
    setLoading(true);
    await fetchMyLeaves();
    if (isManagerOrAdmin) {
      await fetchTeamLeaves();
    }
    setLoading(false);
  }, [isManagerOrAdmin, fetchMyLeaves, fetchTeamLeaves]);

  useEffect(() => {
    initData();
  }, [initData]);

  const onSubmitLeave = async (data) => {
    setError('');
    setSuccess('');
    setActionLoading('submit');
    try {
      const response = await api.post('/leaves', data);
      if (response.data?.success) {
        setSuccess('Leave request submitted successfully.');
        reset();
        await fetchMyLeaves();
        setActiveTab('my-history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewStatus = async (leaveId, status) => {
    if (status === 'Rejected' && !remarks.trim()) {
      alert('Please provide rejection remarks.');
      return;
    }

    if (!window.confirm(`Are you sure you want to set this leave status to ${status}?`)) {
      return;
    }

    setActionLoading(leaveId);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/leaves/${leaveId}/status`, { status, remarks });
      if (response.data?.success) {
        setSuccess(`Leave request set to ${status} successfully.`);
        setSelectedLeave(null);
        setRemarks('');
        await Promise.all([fetchTeamLeaves(), fetchMyLeaves()]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update leave status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    setActionLoading(leaveId);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/leaves/${leaveId}/cancel`);
      if (response.data?.success) {
        setSuccess('Leave request cancelled successfully.');
        await Promise.all([fetchMyLeaves(), fetchTeamLeaves()]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setActionLoading(null);
    }
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-500 dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
      default:
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    }
  };

  const leaveTypes = ['Casual Leave', 'Sick Leave', 'Emergency Leave', 'Paid Leave'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              Leave Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submit requests, track approvals, and review leave balance ledger.
            </p>
          </div>
        </div>

        {/* Leave Balance Counter */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm select-none">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Leaves Available</span>
            <span className="text-base font-black text-slate-800 dark:text-white leading-tight">{leaveBalance} day(s)</span>
          </div>
        </div>
      </div>

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

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('my-history')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            activeTab === 'my-history'
              ? 'text-indigo-500 border-b-2 border-indigo-500'
              : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          My Leave Log
        </button>

        <button
          onClick={() => setActiveTab('apply')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            activeTab === 'apply'
              ? 'text-indigo-500 border-b-2 border-indigo-500'
              : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          Request Time-Off
        </button>

        {isManagerOrAdmin && (
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === 'reviews'
                ? 'text-indigo-500 border-b-2 border-indigo-500'
                : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            Pending Reviews ({teamLeaves.filter((l) => l.status === 'Pending').length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: MY HISTORY */}
          {activeTab === 'my-history' && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-450 font-bold uppercase">
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Dates Range</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status & Action</th>
                      <th className="py-3 px-4">Approver Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                    {myLeaves.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-450 font-medium italic">
                          You have not submitted any leave requests yet.
                        </td>
                      </tr>
                    ) : (
                      myLeaves.map((leave) => {
                        const days = calculateDays(leave.startDate, leave.endDate);
                        const isActioning = actionLoading === leave._id;
                        return (
                          <tr key={leave._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                            {/* Type */}
                            <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">
                              {leave.leaveType}
                            </td>

                            {/* Duration */}
                            <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                              {days} day(s)
                            </td>

                            {/* Dates */}
                            <td className="py-4 px-4 font-semibold text-slate-400">
                              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </td>

                            {/* Reason */}
                            <td className="py-4 px-4 max-w-xs truncate" title={leave.reason}>
                              {leave.reason}
                            </td>

                            {/* Status and Cancellation */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${getStatusBadge(leave.status)}`}>
                                  {leave.status}
                                </span>
                                {['Pending', 'Approved'].includes(leave.status) && (
                                  <button
                                    onClick={() => handleCancelLeave(leave._id)}
                                    disabled={isActioning}
                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition underline cursor-pointer disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Remarks */}
                            <td className="py-4 px-4 font-medium italic text-slate-400">
                              {leave.remarks || (leave.status === 'Pending' ? 'Awaiting review...' : '--')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: APPLY LEAVE */}
          {activeTab === 'apply' && (
            <div className="max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-900 pb-2">
                Apply for leave
              </h3>

              <form onSubmit={handleSubmit(onSubmitLeave)} className="space-y-4">
                {/* Leave Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Leave Category *</label>
                  <select
                    {...register('leaveType', { required: 'Please select a leave type' })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Start Date *</label>
                    <input
                      type="date"
                      {...register('startDate', { required: 'Start date is required' })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {errors.startDate && <p className="text-[10px] text-rose-500 font-bold">{errors.startDate.message}</p>}
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-655 dark:text-slate-350">End Date *</label>
                    <input
                      type="date"
                      {...register('endDate', { required: 'End date is required' })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {errors.endDate && <p className="text-[10px] text-rose-500 font-bold">{errors.endDate.message}</p>}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Reason for Request *</label>
                  <textarea
                    rows="3"
                    {...register('reason', { required: 'Please specify the reason' })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                    placeholder="e.g. Dentist checkup, attending wedding, personal emergency..."
                  />
                  {errors.reason && <p className="text-[10px] text-rose-500 font-bold">{errors.reason.message}</p>}
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading === 'submit'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === 'submit' ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Send className="h-4.5 w-4.5" />
                    )}
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: REVIEWS (MANAGERS/ADMINS ONLY) */}
          {activeTab === 'reviews' && isManagerOrAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* List of leaves */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                  Staff Requests Ledger
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 font-bold uppercase">
                        <th className="py-2.5">Staff details</th>
                        <th className="py-2.5">Type & Days</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                      {teamLeaves.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-450 italic font-medium">
                            No team leave requests found.
                          </td>
                        </tr>
                      ) : (
                        teamLeaves.map((leave) => {
                          const days = calculateDays(leave.startDate, leave.endDate);
                          const isSelected = selectedLeave?._id === leave._id;
                          return (
                            <tr
                              key={leave._id}
                              className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/10 cursor-pointer ${
                                isSelected ? 'bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01]' : ''
                              }`}
                              onClick={() => {
                                setSelectedLeave(leave);
                                setRemarks(leave.remarks || '');
                              }}
                            >
                              {/* Staff info */}
                              <td className="py-3">
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                    {leave.user?.name}
                                  </p>
                                  <span className="text-[9px] text-slate-400 uppercase font-semibold">
                                    Bal: {leave.user?.leaveBalance || 0}d | {leave.user?.employeeId || 'Staff'}
                                  </span>
                                </div>
                              </td>

                              {/* Details */}
                              <td className="py-3">
                                <div>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">{leave.leaveType}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold">
                                    {days} day(s) ({new Date(leave.startDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' })})
                                  </span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3">
                                <span className={`inline-block rounded px-1.5 py-0.2 text-[8px] font-bold uppercase ${getStatusBadge(leave.status)}`}>
                                  {leave.status}
                                </span>
                              </td>

                              {/* CTA Actions */}
                              <td className="py-3 text-right">
                                <span className="text-[10px] font-bold text-indigo-500 hover:underline">
                                  {leave.status === 'Pending' ? 'Review request' : 'View summary'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Review Sidebar Card */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm h-fit space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                  Review Request Detail
                </h3>

                {selectedLeave ? (
                  <div className="space-y-4 text-xs">
                    {/* User profile */}
                    <div className="space-y-1.5">
                      <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Employee Name</span>
                      <p className="font-bold text-slate-850 dark:text-slate-250 text-sm">
                        {selectedLeave.user?.name}
                      </p>
                      <p className="text-slate-400 leading-none">
                        Email: {selectedLeave.user?.email} | Balance: {selectedLeave.user?.leaveBalance || 0} days
                      </p>
                    </div>

                    {/* Leave details */}
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Leave Type</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLeave.leaveType}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Duration</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} days
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Dates Requested</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Reason</span>
                      <p className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/60 leading-relaxed max-h-24 overflow-y-auto font-medium">
                        {selectedLeave.reason}
                      </p>
                    </div>

                    {/* Reviewing Actions */}
                    {selectedLeave.status === 'Pending' ? (
                      <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-900">
                        {/* Remarks */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">Manager Remarks (required for reject)</label>
                          <input
                            type="text"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add rejection reason or approval note..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <button
                            disabled={actionLoading === selectedLeave._id}
                            onClick={() => handleReviewStatus(selectedLeave._id, 'Approved')}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </button>
                          
                          <button
                            disabled={actionLoading === selectedLeave._id}
                            onClick={() => handleReviewStatus(selectedLeave._id, 'Rejected')}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-rose-500/10 active:scale-95 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-900 text-center font-bold text-[10px] text-slate-450 uppercase">
                        Review Completed: {selectedLeave.status}
                        {selectedLeave.remarks && (
                          <div className="mt-2 text-left italic font-medium normal-case text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-250/20">
                            Remarks: {selectedLeave.remarks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-450 italic text-center py-12">
                    Select a request from the ledger list to review and update status.
                  </p>
                )}
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
};

export default LeaveManager;
