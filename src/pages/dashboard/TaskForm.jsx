import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  Briefcase,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  UserCheck,
  Tag,
} from 'lucide-react';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      assignedTo: '',
      priority: 'Medium',
      dueDate: '',
      department: '',
    },
  });

  const fetchDependencies = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
      ]);

      if (empRes.data?.success) {
        setEmployees(empRes.data.data);
      }
      if (deptRes.data?.success) {
        setDepartments(deptRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching task dependencies:', err.message);
    }
  };

  const fetchTaskDetails = async () => {
    if (!id) return;
    setFetching(true);
    setError('');
    try {
      const response = await api.get('/tasks');
      if (response.data?.success) {
        const task = response.data.data.find((t) => t._id === id);
        if (task) {
          setValue('title', task.title);
          setValue('description', task.description || '');
          setValue('assignedTo', task.assignedTo?._id || '');
          setValue('priority', task.priority);
          setValue('dueDate', task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
          setValue('department', task.department?._id || '');
        } else {
          setError('Task details not found');
        }
      }
    } catch (err) {
      console.error('Error fetching task details:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch task details.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDependencies();
      if (isEditMode) {
        await fetchTaskDetails();
      }
    };
    init();
  }, [id]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      ...data,
      assignedTo: data.assignedTo || null,
      department: data.department || null,
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
      console.error('Error saving task:', err.message);
      setError(err.response?.data?.message || 'Error occurred while saving task.');
    } finally {
      setLoading(false);
    }
  };

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

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-3">
        <Link
          to="/tasks"
          className="inline-flex items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
            {isEditMode ? 'Modify Task Details' : 'Create New Task'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditMode ? 'Update guidelines, assignee details or deadlines.' : 'Deploy a new sprint deliverable and allocate resources.'}
          </p>
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

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm space-y-5">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Task Title *</label>
          <input
            type="text"
            {...register('title', { required: 'Task title is required' })}
            className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              errors.title ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
            }`}
            placeholder="e.g. Audit ledger files for Apex Inc."
          />
          {errors.title && <p className="text-[10px] text-rose-500 font-bold">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Guidelines & Scope</label>
          <textarea
            rows="4"
            {...register('description')}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Describe the steps, documents needed, and validation requirements..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Assigned To */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Assign Staff Member</label>
            <select
              {...register('assignedTo')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Team / Department</label>
            <select
              {...register('department')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Cross-Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Priority Level</label>
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

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-655 dark:text-slate-355">Due Date *</label>
            <input
              type="date"
              {...register('dueDate', { required: 'Due date is required' })}
              className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                errors.dueDate ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
              }`}
            />
            {errors.dueDate && <p className="text-[10px] text-rose-500 font-bold">{errors.dueDate.message}</p>}
          </div>
        </div>

        {/* Buttons */}
        <hr className="border-slate-100 dark:border-slate-900 pt-2" />
        <div className="flex justify-end gap-3">
          <Link
            to="/tasks"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition active:scale-95 cursor-pointer"
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
