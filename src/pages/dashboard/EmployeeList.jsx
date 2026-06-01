import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  UserCheck,
  Building,
} from 'lucide-react';

const EmployeeList = () => {
  const { user: currentUser } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedDept) params.department = selectedDept;
      if (selectedRole) params.role = selectedRole;

      const response = await api.get('/employees', { params });
      if (response.data?.success) {
        setEmployees(response.data.data);
      } else {
        setError('Failed to fetch employee list');
      }
    } catch (err) {
      console.error('Error fetching employees:', err.message);
      setError(err.response?.data?.message || 'Error connecting to service');
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, selectedRole]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      if (response.data?.success) {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err.message);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee "${name}"? This will terminate their account.`)) {
      return;
    }

    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/employees/${id}`);
      if (response.data?.success) {
        setSuccess(`Employee "${name}" deleted successfully.`);
        setEmployees(employees.filter((emp) => emp._id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const isAdmin = currentUser?.role?.name === 'Admin';

  const roleOptions = [
    { value: 'Manager', label: 'Manager' },
    { value: 'TL', label: 'Team Leader' },
    { value: 'Employee', label: 'Employee' },
    { value: 'Intern', label: 'Intern' },
  ];

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
              Employee Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage staff accounts, departments, and payroll details.
            </p>
          </div>
        </div>

        <Link
          to="/employee-form"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Employee
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="relative">
            <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
            >
              <option value="">All Roles</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
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

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase">
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Staff Details</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4">Salary (Monthly)</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-450 font-medium">
                      No employee accounts found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const isSelf = emp._id === currentUser?.id;
                    const isActioning = actionLoading === emp._id;
                    const deptName = emp.department?.name || 'Unallocated';
                    const roleName = emp.role?.name || 'Staff';

                    const roleBadges = {
                      Admin: 'bg-red-500/10 text-red-500 border border-red-500/20',
                      Manager: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
                      TL: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
                      Employee: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
                      Intern: 'bg-sky-500/10 text-sky-500 border border-sky-500/20',
                    };

                    return (
                      <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all duration-150">
                        {/* ID */}
                        <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {emp.employeeId || 'N/A'}
                        </td>

                        {/* Name & Contact */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {emp.name} {isSelf && <span className="text-[10px] text-indigo-500 font-semibold">(You)</span>}
                            </p>
                            <div className="flex flex-col gap-0.5 text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {emp.email}
                              </span>
                              {emp.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {emp.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Dept & Role */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-350 block">
                              {deptName}
                            </span>
                            <span className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${roleBadges[roleName] || 'bg-slate-100 text-slate-500 dark:bg-slate-900'}`}>
                              {roleName}
                            </span>
                          </div>
                        </td>

                        {/* Salary */}
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatCurrency(emp.salary)}</span>
                          </div>
                        </td>

                        {/* Joining Date */}
                        <td className="py-4 px-4 font-semibold text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(emp.joiningDate).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link
                              to={`/employee-form/${emp._id}`}
                              className="rounded-lg p-2 text-indigo-500 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/25 transition-all"
                              title="Edit Details"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            
                            {isAdmin && !isSelf && (
                              <button
                                onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                                disabled={isActioning}
                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 disabled:opacity-50 transition-all cursor-pointer"
                                title="Delete Employee"
                              >
                                {isActioning ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
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
    </div>
  );
};

export default EmployeeList;
