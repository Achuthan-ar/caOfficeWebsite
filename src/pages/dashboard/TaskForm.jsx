import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default financial year calculation
  const getCurrentFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed: 0 = January, 3 = April
    if (month >= 3) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  };

  const financialYearOptions = [
    '2023-24',
    '2024-25',
    '2025-26',
    '2026-27',
    '2027-28',
    '2028-29',
  ];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      taskName: '',
      financialYear: getCurrentFinancialYear(),
      taskDescription: '',
      clientId: '',
      assignedEmployee: '',
      assignedTeamLead: '',
      priority: 'Medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      completionRemarks: '',
      estimatedHours: 0,
      internalNotes: '',
      clientVisible: 'No',
    },
  });



  const fetchDependencies = useCallback(async () => {
    try {
      const [empRes, clientRes] = await Promise.all([
        api.get('/employees'),
        api.get('/clients'),
      ]);

      if (empRes.data?.success) {
        setEmployees(empRes.data.data);
      }
      if (clientRes.data?.success) {
        setClients(clientRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching task form dependencies:', err.message);
      setError('Failed to fetch dependencies (clients or employees) from server.');
    }
  }, []);

  const fetchTaskDetails = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    setError('');
    try {
      const response = await api.get(`/tasks/${id}`);
      if (response.data?.success) {
        const task = response.data.data;
        setTaskId(task.taskId || '');
        setValue('taskName', task.taskName);
        setValue('financialYear', task.financialYear || getCurrentFinancialYear());
        setValue('taskDescription', task.taskDescription || '');
        setValue('clientId', task.clientId?._id || task.clientId || '');
        setValue('assignedEmployee', task.assignedEmployee?._id || task.assignedEmployee || task.assignedTo?._id || task.assignedTo || '');
        setValue('assignedTeamLead', task.assignedTeamLead?._id || task.assignedTeamLead || '');
        setValue('priority', task.priority);
        setValue('startDate', task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
        setValue('dueDate', task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setValue('completionRemarks', task.completionRemarks || task.remarks || '');
        setValue('estimatedHours', task.estimatedHours || 0);
        setValue('internalNotes', task.internalNotes || '');
        setValue('clientVisible', task.clientVisible || 'No');
      }
    } catch (err) {
      console.error('Error fetching task details:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch task details.');
    } finally {
      setFetching(false);
    }
  }, [id, setValue]);

  useEffect(() => {
    const init = async () => {
      await fetchDependencies();
      if (isEditMode) {
        await fetchTaskDetails();
      }
    };
    init();
  }, [isEditMode, fetchDependencies, fetchTaskDetails]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Custom check: Due Date must be >= Start Date
    if (new Date(data.dueDate) < new Date(data.startDate)) {
      setError('Due date cannot be before start date.');
      setLoading(false);
      return;
    }

    const payload = {
      ...data,
      clientId: data.clientId || null,
      assignedEmployee: data.assignedEmployee || null,
      assignedTeamLead: data.assignedTeamLead || null,
      estimatedHours: Number(data.estimatedHours) || 0,
    };

    try {
      let response;
      if (isEditMode) {
        response = await api.put(`/tasks/${id}`, payload);
      } else {
        response = await api.post('/tasks', payload);
      }

      if (response.data?.success) {
        setSuccess('Task saved successfully.');
        setTimeout(() => {
          navigate('/tasks');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving task details:', err.message);
      setError(err.response?.data?.message || 'Error occurred while saving task.');
    } finally {
      setLoading(false);
    }
  };

  const priorities = ['High', 'Medium', 'Low'];



  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading task details...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-3">
        <Link
          to="/tasks"
          className="inline-flex items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
            {isEditMode ? 'Modify Task Details' : 'Create New Task'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditMode ? `Update guidelines, client details, or staff assignments for task ${taskId}.` : 'Deploy a new compliance sprint task and allocate staff.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-450 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-450 dark:text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm space-y-5">
        {/* Task ID (Edit Mode only) */}
        {isEditMode && taskId && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Task ID (Auto Generated)</label>
            <input
              type="text"
              readOnly
              value={taskId}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold focus:outline-none"
            />
          </div>
        )}

        {/* Task Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Task Name *</label>
          <input
            type="text"
            {...register('taskName', { required: 'Task name is required' })}
            className={`w-full bg-slate-55 dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              errors.taskName ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
            }`}
            placeholder="e.g. Audit ledger files for Apex Inc."
          />
          {errors.taskName && <p className="text-[10px] text-rose-500 font-bold">{errors.taskName.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Task Description</label>
          <textarea
            rows="3"
            {...register('taskDescription')}
            className="w-full bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Describe the steps, documents needed, and validation requirements..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Client ID */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-355">Client Account *</label>
            <select
              {...register('clientId', { required: 'Client reference is required' })}
              className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                errors.clientId ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
              }`}
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName || c.clientName} ({c.clientId || 'Client ID'})
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-[10px] text-rose-500 font-bold">{errors.clientId.message}</p>}
          </div>

          {/* Assigned Employee */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-355">Assigned Employee *</label>
            <select
              {...register('assignedEmployee', { required: 'Assigned employee is required' })}
              className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                errors.assignedEmployee ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
              }`}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.role?.name || 'Staff'})
                </option>
              ))}
            </select>
            {errors.assignedEmployee && <p className="text-[10px] text-rose-500 font-bold">{errors.assignedEmployee.message}</p>}
          </div>

          {/* Financial Year */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Financial Year</label>
            <select
              {...register('financialYear')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {financialYearOptions.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-355">Priority Level</label>
            <select
              {...register('priority')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-355">Estimated Hours</label>
            <input
              type="number"
              min="0"
              step="0.5"
              {...register('estimatedHours')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. 15.5"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-355">Start Date *</label>
            <input
              type="date"
              {...register('startDate', { required: 'Start date is required' })}
              className={`w-full bg-slate-55 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                errors.startDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
              }`}
            />
            {errors.startDate && <p className="text-[10px] text-rose-500 font-bold">{errors.startDate.message}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Due Date *</label>
            <input
              type="date"
              {...register('dueDate', { required: 'Due date is required' })}
              className={`w-full bg-slate-55 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                errors.dueDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
              }`}
            />
            {errors.dueDate && <p className="text-[10px] text-rose-500 font-bold">{errors.dueDate.message}</p>}
          </div>

          {/* Client Visible */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-355">Client Visible</label>
            <select
              {...register('clientVisible')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="No">No (Internal Only)</option>
              <option value="Yes">Yes (Show to Client)</option>
            </select>
          </div>
        </div>

        {/* Internal Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Internal Notes (Hidden from Client)</label>
          <textarea
            rows="3"
            {...register('internalNotes')}
            className="w-full bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Add internal notes, phone logs, account codes..."
          />
        </div>

        {/* Completion Remarks */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Remarks / Completion Remarks</label>
          <textarea
            rows="3"
            {...register('completionRemarks')}
            className="w-full bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Add comments, closing reports, or notes on completion..."
          />
        </div>

        {/* Buttons */}
        <hr className="border-slate-100 dark:border-slate-900 pt-2" />
        <div className="flex justify-end gap-3">
          <Link
            to="/tasks"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-750 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-900 transition active:scale-95 cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/15 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
