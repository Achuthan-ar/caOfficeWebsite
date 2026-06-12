import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const ClientList = () => {
  const { user: currentUser } = useAuthStore();

  const [clients, setClients] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('clientId');
  const [order, setOrder] = useState('asc');

  // Search & Filtering State
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    clientType: [],
    caseType: [],
    accountantName: [],
    regularityType: [],
    assignedTeamLead: [],
    servicesOpted: [],
  });

  // Unique lists populated from backend client data and Masters API for filter options
  const [filterOptions, setFilterOptions] = useState({
    clientTypes: [
      'Individuals',
      'HUF',
      'Proprietorship',
      'Partnership Firms',
      'LLP',
      'Companies',
      'Trusts / AOP / BOI',
      'Others'
    ],
    caseTypes: ['GST Filing', 'Income Tax Filing', 'Statutory Audit', 'Internal Audit', 'TDS Filing', 'Company Registration'],
    accountants: ['CA Ramesh', 'CA Suresh', 'CA Priya'],
    regularityTypes: ['Regular', 'Irregular', 'Inactive'],
    services: ['GST GSTR-1', 'GST GSTR-3B', 'Income Tax ITR-1/2', 'Income Tax ITR-3/4', 'Income Tax ITR-5/6', 'Tax Audit Form 3CD', 'Statutory Audit', 'TDS Returns', 'ROC Compliances'],
  });

  // Fetch employees list to populate Manager and Employee dropdown filters
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      if (response.data?.success) {
        setEmployeesList(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err.message);
    }
  };

  // Fetch active masters filter options dynamically from backend
  const fetchMasters = async () => {
    try {
      const [servicesRes, accountantsRes, caseTypesRes] = await Promise.all([
        api.get('/masters/services?status=Active&limit=1000'),
        api.get('/masters/accountants?status=Active&limit=1000'),
        api.get('/masters/case-types?status=Active&limit=1000')
      ]);

      setFilterOptions((prev) => {
        const updated = { ...prev };
        if (servicesRes.data?.success && servicesRes.data.data.length > 0) {
          updated.services = servicesRes.data.data.map(item => item.name);
        }
        if (accountantsRes.data?.success && accountantsRes.data.data.length > 0) {
          updated.accountants = accountantsRes.data.data.map(item => item.associate_name);
        }
        if (caseTypesRes.data?.success && caseTypesRes.data.data.length > 0) {
          updated.caseTypes = caseTypesRes.data.data.map(item => item.name);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to load master filters from API, using defaults:', err.message);
    }
  };

  const fetchClients = useCallback(async () => {
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

      // Format multi-select filters as comma separated strings for backend
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key].length > 0) {
          params[key] = filters[key].join(',');
        }
      });

      const response = await api.get('/clients', { params });
      if (response.data?.success) {
        setClients(response.data.data);
        setTotalClients(response.data.total || response.data.count);
        setTotalPages(response.data.pages || 1);
        
        // Dynamically extract and merge unique values for filters (Accountants, etc.)
        if (page === 1 && response.data.data.length > 0) {
          const accountantsFromClients = response.data.data.map(c => c.accountantName).filter(Boolean);
          setFilterOptions(prev => ({
            ...prev,
            accountants: [...new Set([...prev.accountants, ...accountantsFromClients])]
          }));
        }
      } else {
        setError('Failed to fetch clients list');
      }
    } catch (err) {
      console.error('Error fetching clients:', err.message);
      setError(err.response?.data?.message || 'Error connecting to service');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, order, search, filters]);

  useEffect(() => {
    fetchEmployees();
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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
    setPage(1); // Reset page to 1 on sort change
  };

  // Handle checkbox filter changes
  const handleFilterCheckboxChange = (category, value) => {
    setFilters((prev) => {
      const currentValues = prev[category] || [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: updatedValues };
    });
    setPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      clientType: [],
      caseType: [],
      accountantName: [],
      regularityType: [],
      assignedTeamLead: [],
      servicesOpted: [],
    });
    setSearch('');
    setPage(1);
  };

  // Client deletion
  const handleDeleteClient = async (id, clientName) => {
    if (!window.confirm(`Are you sure you want to delete client "${clientName}"? This action is permanent and cannot be undone.`)) {
      return;
    }

    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/clients/${id}`);
      if (response.data?.success) {
        setSuccess(`Client "${clientName}" deleted successfully.`);
        // Remove from list or trigger refresh
        setClients(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete client');
    } finally {
      setActionLoading(null);
    }
  };

  // Export to CSV client-side
  const handleExportCSV = () => {
    const headers = [
      'Client ID', 'Client Name', 'Business Name',
      'Phone Number', 'Email', 'Client Type', 'Case Type',
      'Assigned Team Lead', 'Accountant Name',
      'Regularity Type', 'PAN Number', 'Aadhaar Number', 'Services Opted',
      'Last Updated'
    ];

    const rows = clients.map(c => [
      c.clientId,
      c.clientName,
      c.businessName || '',
      c.phoneNumber,
      c.email || '',
      c.clientType,
      c.caseType || '',
      c.assignedTeamLead?.name || '',
      c.accountantName || '',
      c.regularityType || '',
      c.panNumber || '',
      c.aadhaarNumber || '',
      (c.servicesOpted || []).join('; '),
      new Date(c.updatedAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Client_Master_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCALoginOrAdmin = currentUser?.role?.name === 'Admin' || currentUser?.role?.name === 'CA Login';
  const isManager = currentUser?.role?.name === 'Manager';


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
              Client Master Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Centralized repository for all corporate and individual tax clients.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={clients.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          {(isCALoginOrAdmin || isManager) && (
            <Link
              to="/clients/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2 text-xs font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Client ID, Name, Business, Phone, PAN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                showFilters || Object.values(filters).some(arr => arr.length > 0)
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900'
                  : 'bg-white border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {Object.values(filters).reduce((acc, curr) => acc + curr.length, 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[9px] font-bold">
                  {Object.values(filters).reduce((acc, curr) => acc + curr.length, 0)}
                </span>
              )}
            </button>

            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Dynamic Multi-Select Filters Panel */}
        {showFilters && (
          <div className="border-t border-slate-100 dark:border-slate-900/80 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-fadeIn">
            {/* Client Type Filter */}
            <div className="space-y-2">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Client Type
              </span>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                {filterOptions.clientTypes.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={filters.clientType.includes(type)}
                      onChange={() => handleFilterCheckboxChange('clientType', type)}
                      className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/25"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Case Type Filter */}
            <div className="space-y-2">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Case Type
              </span>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                {filterOptions.caseTypes.map((cType) => (
                  <label key={cType} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={filters.caseType.includes(cType)}
                      onChange={() => handleFilterCheckboxChange('caseType', cType)}
                      className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/25"
                    />
                    {cType}
                  </label>
                ))}
              </div>
            </div>

            {/* Regularity Filter */}
            <div className="space-y-2">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Regularity Type
              </span>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                {filterOptions.regularityTypes.map((reg) => (
                  <label key={reg} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={filters.regularityType.includes(reg)}
                      onChange={() => handleFilterCheckboxChange('regularityType', reg)}
                      className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/25"
                    />
                    {reg}
                  </label>
                ))}
              </div>
            </div>

            {/* Accountant Filter */}
            <div className="space-y-2">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Accountant
              </span>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                {filterOptions.accountants.length === 0 ? (
                  <span className="text-slate-400 italic">None logged yet</span>
                ) : (
                  filterOptions.accountants.map((acc) => (
                    <label key={acc} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-350">
                      <input
                        type="checkbox"
                        checked={filters.accountantName.includes(acc)}
                        onChange={() => handleFilterCheckboxChange('accountantName', acc)}
                        className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/25"
                      />
                      {acc}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Services Filter */}
            <div className="space-y-2">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Services Opted
              </span>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                {filterOptions.services.map((svc) => (
                  <label key={svc} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={filters.servicesOpted.includes(svc)}
                      onChange={() => handleFilterCheckboxChange('servicesOpted', svc)}
                      className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/25"
                    />
                    {svc}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
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

      {/* Clients Table view */}
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
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase select-none">
                  <th
                    onClick={() => handleSort('clientId')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-655 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Client ID
                      {sortBy === 'clientId' && (order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('clientName')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-655 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Client Name
                      {sortBy === 'clientName' && (order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th
                    onClick={() => handleSort('clientType')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-655 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Client Type
                      {sortBy === 'clientType' && (order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Case Type</th>
                  <th
                    onClick={() => handleSort('updatedAt')}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-655 dark:hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Last Updated
                      {sortBy === 'updatedAt' && (order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 font-medium italic">
                      No client accounts found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const isActioning = actionLoading === client._id;
                    const canEdit = isCALoginOrAdmin || 
                      (isManager && client.assignedTeamLead?._id === currentUser?.id) ||
                      (client.assignedEmployee?._id === currentUser?.id);

                    return (
                      <tr
                        key={client._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all duration-150"
                      >
                        {/* ID */}
                        <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-slate-100">
                          <Link to={`/clients/${client._id}`} className="hover:text-indigo-500 hover:underline">
                            {client.clientId}
                          </Link>
                        </td>

                        {/* Name / Business */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <Link
                              to={`/clients/${client._id}`}
                              className="font-bold text-slate-850 dark:text-slate-150 hover:text-indigo-500 transition-colors block"
                            >
                              {client.clientName}
                            </Link>
                            {client.businessName && (
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {client.businessName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-350">
                          {client.phoneNumber}
                        </td>

                        {/* Client Type */}
                        <td className="py-4 px-4 font-medium text-slate-500 dark:text-slate-400">
                          {client.clientType}
                        </td>

                        {/* Case Type */}
                        <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {client.caseType || <span className="text-slate-400 italic">None</span>}
                        </td>

                        {/* Last Updated Date */}
                        <td className="py-4 px-4 text-slate-400 font-semibold">
                          {new Date(client.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Link
                              to={`/clients/${client._id}`}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {canEdit && (
                              <Link
                                to={`/clients/edit/${client._id}`}
                                className="rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/25"
                                title="Edit Details"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Link>
                            )}

                            {isCALoginOrAdmin && (
                              <button
                                onClick={() => handleDeleteClient(client._id, client.clientName)}
                                disabled={isActioning}
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 disabled:opacity-50 transition-all cursor-pointer border border-transparent hover:border-rose-500/25"
                                title="Delete Client"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 dark:border-slate-850 select-none text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20">
              <span>
                Showing <span className="font-bold text-slate-800 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-bold text-slate-800 dark:text-white">
                  {Math.min(page * limit, totalClients)}
                </span>{' '}
                of <span className="font-bold text-slate-800 dark:text-white">{totalClients}</span> clients
              </span>

              <div className="flex items-center gap-2">
                {/* Limit Dropdown */}
                <span className="mr-1">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>

                <div className="flex items-center gap-1.5 ml-4">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    <span className="text-slate-800 dark:text-white font-bold">{page}</span>
                    <span>/</span>
                    <span>{totalPages}</span>
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientList;
