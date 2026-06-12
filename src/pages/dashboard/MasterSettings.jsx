import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  ArrowUpDown,
  History,
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const MasterSettings = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('services'); // 'services', 'accountants', 'client-types', 'case-types', 'regularity-types', 'audit-trail'
  
  const [data, setData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' (all), 'Active', 'Inactive'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalData, setModalData] = useState({
    name: '',
    description: '',
    status: 'Active',
    associate_name: '',
    email: '',
    phone_number: '',
  });
  const [modalError, setModalError] = useState('');

  const tabs = [
    { id: 'services', label: 'Services', desc: 'opted services categories' },
    { id: 'accountants', label: 'Associates', desc: 'firm associates' },
    { id: 'case-types', label: 'Case Types', desc: 'compliance cases classifications' },
  ];

  const isCALoginOrAdmin = ['Admin', 'CA Login'].includes(currentUser?.role?.name);
  const isManager = currentUser?.role?.name === 'Manager';
  const isEmployee = currentUser?.role?.name === 'Employee';

  // Fetch Master Data
  const fetchData = useCallback(async () => {
    if (activeTab === 'audit-trail') return;
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        sortBy,
        order,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.get(`/masters/${activeTab}`, { params });
      if (response.data?.success) {
        setData(response.data.data);
        setTotalRecords(response.data.total);
        setTotalPages(response.data.pages || 1);
      } else {
        setError('Failed to retrieve master list records.');
      }
    } catch (err) {
      console.error('Error fetching master records:', err.message);
      setError(err.response?.data?.message || 'Error communicating with database');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, sortBy, order, search, statusFilter]);

  // Fetch Audit Logs (Manager/Admin only)
  const fetchAuditLogs = useCallback(async () => {
    if (activeTab !== 'audit-trail') return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/audit-logs'); // existing system log endpoint
      if (response.data?.success) {
        // Filter master-related actions
        const masterActions = response.data.data.filter(
          (log) => log.action && log.action.startsWith('Master')
        );
        setAuditLogs(masterActions);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err.message);
      setError('Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setStatusFilter('');
    setSortBy(activeTab === 'audit-trail' ? 'createdAt' : 'name');
    setOrder(activeTab === 'audit-trail' ? 'desc' : 'asc');
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'audit-trail') {
      fetchAuditLogs();
    } else {
      fetchData();
    }
  }, [activeTab, fetchData, fetchAuditLogs]);

  // Handle pagination navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Handle sorting trigger
  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  // Open Modal Add/Edit
  const openModal = (mode, record = null) => {
    if (isEmployee) return;
    setModalMode(mode);
    setModalError('');
    if (mode === 'edit' && record) {
      setSelectedRecord(record);
      setModalData({
        name: record.name || '',
        description: record.description || '',
        status: record.status || 'Active',
        associate_name: record.associate_name || '',
        email: record.email || '',
        phone_number: record.phone_number || '',
      });
    } else {
      setSelectedRecord(null);
      setModalData({
        name: '',
        description: '',
        status: 'Active',
        associate_name: '',
        email: '',
        phone_number: '',
      });
    }
    setShowModal(true);
  };

  // Save Modal Record (Add/Edit API Call)
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setModalError('');

    if (activeTab === 'accountants') {
      if (!modalData.associate_name || !modalData.associate_name.trim()) {
        setModalError('Associate Name is required');
        return;
      }
      if (!modalData.email || !modalData.email.trim()) {
        setModalError('Email Address is required');
        return;
      }
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(modalData.email.trim())) {
        setModalError('Please enter a valid email address');
        return;
      }
      if (!modalData.phone_number || !modalData.phone_number.trim()) {
        setModalError('Phone Number is required');
        return;
      }
    } else {
      if (!modalData.name || !modalData.name.trim()) {
        setModalError('Name is required');
        return;
      }
    }

    setLoading(true);
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/masters/${activeTab}/${selectedRecord._id}`, modalData);
      } else {
        response = await api.post(`/masters/${activeTab}`, modalData);
      }

      if (response.data?.success) {
        setSuccess(
          modalMode === 'edit'
            ? 'Record updated successfully!'
            : 'Record created successfully!'
        );
        setShowModal(false);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save master list option');
    } finally {
      setLoading(false);
    }
  };

  // Toggle record status quickly
  const handleToggleStatus = async (record) => {
    if (isEmployee) return;
    const newStatus = record.status === 'Active' ? 'Inactive' : 'Active';
    const recordName = activeTab === 'accountants' ? record.associate_name : record.name;
    
    if (!window.confirm(`Are you sure you want to change status of "${recordName}" to "${newStatus}"?`)) {
      return;
    }

    setActionLoading(record._id);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/masters/${activeTab}/${record._id}`, {
        status: newStatus,
      });

      if (response.data?.success) {
        setSuccess(`"${recordName}" is now ${newStatus}`);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete record API Call
  const handleDeleteRecord = async (record) => {
    if (!isCALoginOrAdmin) {
      setError('Only CA Login users and Admins can delete master options.');
      return;
    }

    const recordName = activeTab === 'accountants' ? record.associate_name : record.name;

    if (!window.confirm(`Are you sure you want to permanently delete "${recordName}"? This action is irreversible.`)) {
      return;
    }

    setActionLoading(record._id);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/masters/${activeTab}/${record._id}`);
      if (response.data?.success) {
        setSuccess(`"${recordName}" deleted successfully.`);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete record');
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              Master Lists Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage dropdown parameters globally to eliminate hardcoded choices across the platform.
            </p>
          </div>
        </div>

        {!isEmployee && activeTab !== 'audit-trail' && (
          <button
            onClick={() => openModal('add')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2.5 text-xs font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Master Value
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider select-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-500 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters Bar (Hidden on Audit Trail) */}
      {activeTab !== 'audit-trail' && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${tabs.find((t) => t.id === activeTab)?.label} master list...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="relative w-full sm:w-48 shrink-0">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Alert Banners */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Data tables rendering */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      ) : activeTab === 'audit-trail' ? (
        /* Audit Trail Log Entries Table (Manager / Admin Only) */
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center select-none">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Masters Operations Log
            </span>
            <span className="text-[10px] text-slate-400 italic">Read-Only Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase">
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 italic">
                      No Master List operations logged in audit files.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        <div className="space-y-0.5">
                          <p>{log.userName || 'System'}</p>
                          <span className="text-[9px] text-slate-400 block tracking-wider uppercase font-semibold">
                            {log.userRole || 'Admin'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-500">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300 leading-normal max-w-lg">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-semibold">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Master options configuration table */
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase select-none">
                  {activeTab === 'accountants' ? (
                    <>
                      <th
                        onClick={() => handleSort('associate_name')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Associate Name
                          {sortBy === 'associate_name' && (order === 'asc' ? <ArrowUpDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-indigo-500" />)}
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Email Address</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                    </>
                  ) : (
                    <>
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortBy === 'name' && (order === 'asc' ? <ArrowUpDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-indigo-500" />)}
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Description</th>
                    </>
                  )}
                  <th className="py-3.5 px-4">Status</th>
                  <th
                    onClick={() => handleSort(activeTab === 'accountants' ? 'created_at' : 'createdAt')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Created Date
                      {(sortBy === 'createdAt' || sortBy === 'created_at') && (order === 'asc' ? <ArrowUpDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-indigo-500" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort(activeTab === 'accountants' ? 'updated_at' : 'updatedAt')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Last Updated
                      {(sortBy === 'updatedAt' || sortBy === 'updated_at') && (order === 'asc' ? <ArrowUpDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-indigo-500" />)}
                    </div>
                  </th>
                  {!isEmployee && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'accountants' ? '7' : '6'} className="py-12 text-center text-slate-400 italic">
                      No parameters defined under this master tab.
                    </td>
                  </tr>
                ) : (
                  data.map((record) => {
                    const isActioning = actionLoading === record._id;

                    return (
                      <tr key={record._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        {activeTab === 'accountants' ? (
                          <>
                            {/* Associate Name */}
                            <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {record.associate_name}
                            </td>
                            {/* Email */}
                            <td className="py-4 px-4 font-medium text-slate-500 dark:text-slate-400">
                              {record.email}
                            </td>
                            {/* Phone */}
                            <td className="py-4 px-4 font-medium text-slate-500 dark:text-slate-400 font-mono">
                              {record.phone_number}
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Name */}
                            <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {record.name}
                            </td>
                            {/* Description */}
                            <td className="py-4 px-4 font-medium text-slate-500 dark:text-slate-400 max-w-xs truncate">
                              {record.description || <span className="italic text-slate-400">No description</span>}
                            </td>
                          </>
                        )}

                        {/* Status Toggle Badge */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleStatus(record)}
                            disabled={isEmployee || isActioning}
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                              record.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20'
                            } disabled:opacity-80`}
                            title={isEmployee ? 'Read-only status' : 'Click to Toggle Status'}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${record.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                            {record.status}
                          </button>
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-4 font-semibold text-slate-400">
                          {new Date(activeTab === 'accountants' ? record.created_at : record.createdAt).toLocaleDateString()}
                        </td>

                        {/* Last Updated */}
                        <td className="py-4 px-4 font-semibold text-slate-400">
                          {new Date(activeTab === 'accountants' ? record.updated_at : record.updatedAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        {!isEmployee && (
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {/* Inline toggle switch */}
                              <button
                                onClick={() => handleToggleStatus(record)}
                                disabled={isActioning}
                                className="rounded-lg p-1.5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-50"
                                title="Toggle Active Status"
                              >
                                {record.status === 'Active' ? <ToggleRight className="h-5 w-5 text-indigo-500" /> : <ToggleLeft className="h-5 w-5" />}
                              </button>

                              <button
                                onClick={() => openModal('edit', record)}
                                disabled={isActioning}
                                className="rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                                title="Edit Value"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {isCALoginOrAdmin && (
                                <button
                                  onClick={() => handleDeleteRecord(record)}
                                  disabled={isActioning}
                                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 disabled:opacity-50 transition-all cursor-pointer"
                                  title="Delete Option"
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
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-850 select-none text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20">
              <span>
                Showing <span className="font-bold text-slate-800 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-bold text-slate-800 dark:text-white">
                  {Math.min(page * limit, totalRecords)}
                </span>{' '}
                of <span className="font-bold text-slate-800 dark:text-white">{totalRecords}</span> entries
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-slate-850 dark:text-white font-bold">{page}</span>
                  <span>/</span>
                  <span>{totalPages}</span>
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp text-xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/10 flex justify-between items-center select-none">
              <h3 className="font-black text-slate-855 dark:text-white uppercase tracking-wider">
                {modalMode === 'edit'
                  ? (activeTab === 'accountants' ? 'Edit Associate Name' : 'Edit Option')
                  : (activeTab === 'accountants' ? 'Add new associate name' : 'Add New Option')}
              </h3>
              <span className="text-[10px] text-indigo-500 font-extrabold capitalize">{tabs.find((t) => t.id === activeTab)?.label} Master</span>
            </div>

            <form onSubmit={handleSaveRecord} className="p-5 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 font-semibold">
                  <AlertCircle className="h-4.5 w-4.5" />
                  {modalError}
                </div>
              )}

              {activeTab === 'accountants' ? (
                <>
                  {/* Associate Name input */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-350">
                      Associate Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalData.associate_name}
                      onChange={(e) => setModalData((prev) => ({ ...prev, associate_name: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      placeholder="e.g. CA Ramesh"
                    />
                  </div>

                  {/* Email address input */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-350">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={modalData.email}
                      onChange={(e) => setModalData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      placeholder="associate@example.com"
                    />
                  </div>

                  {/* Phone number input */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-350">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalData.phone_number}
                      onChange={(e) => setModalData((prev) => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Name input */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-350">
                      Option Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalData.name}
                      onChange={(e) => setModalData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      placeholder="e.g. GST Filing or Individual"
                    />
                  </div>

                  {/* Description input */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 dark:text-slate-350">Description</label>
                    <textarea
                      value={modalData.description}
                      onChange={(e) => setModalData((prev) => ({ ...prev, description: e.target.value }))}
                      rows="3"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Describe this master value configuration..."
                    />
                  </div>
                </>
              )}

              {/* Status input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-350">Status</label>
                <select
                  value={modalData.status}
                  onChange={(e) => setModalData((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Modal buttons */}
              <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-slate-100 dark:border-slate-900 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-4.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-550 dark:text-slate-400 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 text-white px-5 py-2 font-bold hover:bg-indigo-600 transition shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {activeTab === 'accountants' ? 'Save Associate' : 'Save Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterSettings;
