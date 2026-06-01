import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../services/api';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      employeeId: '',
      phone: '',
      department: '',
      role: 'Employee',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: 0,
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
      },
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'documents',
  });

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('/departments');
      if (response.data?.success) {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err.message);
    }
  }, []);

  const fetchEmployeeDetails = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    setError('');
    try {
      // Fetch employee list (Admin/Manager gets access to salary as well)
      const response = await api.get('/employees');
      if (response.data?.success) {
        const emp = response.data.data.find((e) => e._id === id);
        if (emp) {
          setValue('name', emp.name);
          setValue('email', emp.email);
          setValue('employeeId', emp.employeeId);
          setValue('phone', emp.phone || '');
          setValue('department', emp.department?._id || '');
          setValue('role', emp.role?.name || 'Employee');
          setValue('joiningDate', emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '');
          setValue('salary', emp.salary || 0);
          setValue('address', emp.address || '');
          setValue('emergencyContact.name', emp.emergencyContact?.name || '');
          setValue('emergencyContact.phone', emp.emergencyContact?.phone || '');
          
          // Clear current document inputs and append from API
          remove();
          if (emp.documents && emp.documents.length > 0) {
            emp.documents.forEach((doc) => {
              append(doc);
            });
          }
        } else {
          setError('Employee details not found in registry');
        }
      }
    } catch (err) {
      console.error('Error loading employee details:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch employee details');
    } finally {
      setFetching(false);
    }
  }, [id, setValue, remove, append]);

  useEffect(() => {
    const init = async () => {
      await fetchDepartments();
      if (isEditMode) {
        await fetchEmployeeDetails();
      }
    };
    init();
  }, [isEditMode, fetchDepartments, fetchEmployeeDetails]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Ensure documents is an array of strings
    const payload = {
      ...data,
      documents: data.documents.filter((d) => d && d.trim() !== ''),
      salary: Number(data.salary) || 0,
      department: data.department || null,
    };

    // If edit mode and password is empty, don't update it
    if (isEditMode) {
      delete payload.password;
    }

    try {
      let response;
      if (isEditMode) {
        response = await api.put(`/employees/${id}`, payload);
      } else {
        response = await api.post('/employees', payload);
      }

      if (response.data?.success) {
        setSuccess(response.data.message || 'Employee record saved successfully.');
        setTimeout(() => {
          navigate('/employees');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving employee:', err.message);
      setError(err.response?.data?.message || 'Error occurred while saving profile.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading employee details...
        </p>
      </div>
    );
  }

  const roleOptions = ['Manager', 'TL', 'Employee', 'Intern'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <Link
          to="/employees"
          className="inline-flex items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
            {isEditMode ? 'Edit Employee Details' : 'Add New Employee'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditMode ? 'Modify employee registration, files, and emergency contacts' : 'Register a new employee account in the CA Office system'}
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

      {/* Main Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* Section 1: Basic credentials */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-900 pb-2">
            1. Core Information & Security
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Full Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Full name is required' })}
                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'}`}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Email Address *</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-0._%+-]+@[a-zA-Z0-0.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Enter a valid email address',
                  },
                })}
                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'}`}
                placeholder="johndoe@office.com"
              />
              {errors.email && <p className="text-[10px] font-bold text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            {!isEditMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Password * (Default temporary password: welcome123)</label>
                <input
                  type="password"
                  {...register('password', {
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'}`}
                  placeholder="Leave blank to use default password"
                />
                {errors.password && <p className="text-[10px] font-bold text-red-500">{errors.password.message}</p>}
              </div>
            )}

            {/* Employee ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Employee ID *</label>
              <input
                type="text"
                {...register('employeeId', { required: 'Employee ID is required' })}
                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.employeeId ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'}`}
                placeholder="EMP1024"
              />
              {errors.employeeId && <p className="text-[10px] font-bold text-red-500">{errors.employeeId.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Department and Org settings */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-900 pb-2">
            2. Department, Role & Joining Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Department</label>
              <select
                {...register('department')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Unallocated</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Assigned System Role</label>
              <select
                {...register('role')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Joining Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Joining Date</label>
              <input
                type="date"
                {...register('joiningDate')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Salary */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Monthly CTC / Salary (INR)</label>
              <input
                type="number"
                {...register('salary')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="50000"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Phone Number</label>
              <input
                type="text"
                {...register('phone')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contact & Address */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-900 pb-2">
            3. Address & Emergency Contacts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Address */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Full Address</label>
              <textarea
                rows="2"
                {...register('address')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                placeholder="123 Office Lane, CA Complex, Mumbai, India"
              />
            </div>

            {/* Emergency name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Emergency Contact Person</label>
              <input
                type="text"
                {...register('emergencyContact.name')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Emergency Contact Name"
              />
            </div>

            {/* Emergency Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Emergency Phone</label>
              <input
                type="text"
                {...register('emergencyContact.phone')}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Emergency Phone Number"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Document Links */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              4. Verified Documents & Files (Links)
            </h3>
            <button
              type="button"
              onClick={() => append('')}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition duration-150 border border-indigo-500/10 hover:border-indigo-500/35 bg-indigo-500/[0.03] rounded-lg px-2.5 py-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Document Link
            </button>
          </div>

          {fields.length === 0 ? (
            <p className="text-[11px] text-slate-450 italic">No document links added. Upload sheets, IDs or contracts and insert links here.</p>
          ) : (
            <div className="space-y-2.5">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
                    <input
                      type="text"
                      {...register(`documents.${index}`)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="e.g. Aadhar card link, employment contract URL..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 rounded-lg cursor-pointer"
                    title="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <hr className="border-slate-100 dark:border-slate-900 pt-2" />
        <div className="flex justify-end gap-3.5">
          <Link
            to="/employees"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition duration-150 cursor-pointer active:scale-95"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/15 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Employee
          </button>
        </div>

      </form>
    </div>
  );
};

export default EmployeeForm;
