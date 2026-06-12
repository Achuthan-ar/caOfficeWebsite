import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  UserCheck,
  CreditCard,
} from 'lucide-react';

const ClientForm = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams(); // populated if editing
  const isEditMode = !!id;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields State
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    fileNumber: '',
    businessName: '',
    accountantName: '',
    clientType: 'Individuals',
    caseType: 'GST Filing',
    dobDof: '',
    phoneNumber: '',
    email: '',
    whatsappNumber: '',
    panNumber: '',
    aadhaarNumber: '',
    servicesOpted: [],
    address: '',
    regularityType: 'Regular',
    remarks: '',
    status: 'Active',
    assignedTeamLead: '',
    assignedEmployee: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Dropdown list options with dynamic API fallbacks
  const [clientTypes, setClientTypes] = useState([
    'Individuals',
    'HUF',
    'Proprietorship',
    'Partnership Firms',
    'LLP',
    'Companies',
    'Trusts / AOP / BOI',
    'Others'
  ]);
  const [caseTypes, setCaseTypes] = useState(['GST Filing', 'Income Tax Filing', 'Statutory Audit', 'Internal Audit', 'TDS Filing', 'Company Registration']);
  const [regularityTypes, setRegularityTypes] = useState(['Regular', 'Irregular', 'Inactive']);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [accountantOptions, setAccountantOptions] = useState(['CA Ramesh', 'CA Suresh', 'CA Priya']);

  // Fetch staff users to populate assignments dropdowns
  const fetchStaff = async () => {
    try {
      const response = await api.get('/employees');
      if (response.data?.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load employee list:', err.message);
    }
  };

  // Fetch active dropdown values from masters module
  const fetchMasters = async () => {
    try {
      const [servicesRes, accountantsRes, caseTypesRes] = await Promise.all([
        api.get('/masters/services?status=Active&limit=1000'),
        api.get('/masters/accountants?status=Active&limit=1000'),
        api.get('/masters/case-types?status=Active&limit=1000')
      ]);

      if (servicesRes.data?.success && servicesRes.data.data.length > 0) {
        setServiceOptions(servicesRes.data.data.map(item => item.name));
      }
      if (accountantsRes.data?.success && accountantsRes.data.data.length > 0) {
        setAccountantOptions(accountantsRes.data.data.map(item => item.associate_name));
      }
      if (caseTypesRes.data?.success && caseTypesRes.data.data.length > 0) {
        setCaseTypes(caseTypesRes.data.data.map(item => item.name));
      }
    } catch (err) {
      console.error('Failed to load master list dropdowns, using defaults:', err.message);
    }
  };

  // Fetch client details if in Edit Mode
  const fetchClientDetails = async () => {
    if (!isEditMode) return;
    setFetching(true);
    setError('');
    try {
      const response = await api.get(`/clients/${id}`);
      if (response.data?.success) {
        const client = response.data.data;
        setFormData({
          clientId: client.clientId || '',
          clientName: client.clientName || '',
          fileNumber: client.fileNumber || '',
          businessName: client.businessName || '',
          accountantName: client.accountantName || '',
          clientType: client.clientType || 'Individuals',
          caseType: client.caseType || 'GST Filing',
          dobDof: client.dobDof ? new Date(client.dobDof).toISOString().split('T')[0] : '',
          phoneNumber: client.phoneNumber || '',
          email: client.email || '',
          whatsappNumber: client.whatsappNumber || '',
          panNumber: client.panNumber || '',
          aadhaarNumber: client.aadhaarNumber || '',
          servicesOpted: client.servicesOpted || [],
          address: client.address || '',
          regularityType: client.regularityType || 'Regular',
          remarks: client.remarks || '',
          status: client.status || 'Active',
          assignedTeamLead: client.assignedTeamLead?._id || client.assignedTeamLead || '',
          assignedEmployee: client.assignedEmployee?._id || client.assignedEmployee || '',
        });
      } else {
        setError('Failed to retrieve client profile details');
      }
    } catch (err) {
      console.error('Error fetching client details:', err.message);
      setError(err.response?.data?.message || 'Error loading client details');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const initForm = async () => {
      await fetchStaff();
      await fetchMasters();
      if (isEditMode) {
        await fetchClientDetails();
      } else {
        // If team lead is adding a client, default assignedTeamLead to their user ID
        if (currentUser?.role?.name === 'Manager') {
          setFormData((prev) => ({ ...prev, assignedTeamLead: currentUser.id || currentUser._id }));
        }
        // Fetch next client ID
        try {
          const nextIdRes = await api.get('/clients/next-id');
          if (nextIdRes.data?.success) {
            setFormData((prev) => ({ ...prev, clientId: nextIdRes.data.clientId }));
          }
        } catch (err) {
          console.error('Failed to pre-generate Client ID:', err.message);
        }
      }
    };
    initForm();
  }, [id, isEditMode]);

  // Form input validation logic
  const validateForm = () => {
    const errors = {};
    const phonePattern = /^\d{10}$/;
    const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadhaarPattern = /^\d{12}$/;

    if (!formData.clientName.trim()) {
      errors.clientName = 'Client Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone Number is required';
    } else if (!phonePattern.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone Number must be exactly 10 digits and numeric only';
    }

    if (!formData.clientType) {
      errors.clientType = 'Client Type is required';
    }



    if (formData.email && !emailPattern.test(formData.email)) {
      errors.email = 'Please provide a valid email format';
    }

    if (formData.panNumber && !panPattern.test(formData.panNumber.toUpperCase())) {
      errors.panNumber = 'PAN must be exactly 10 characters in format ABCDE1234F (Uppercase)';
    }

    if (formData.aadhaarNumber && !aadhaarPattern.test(formData.aadhaarNumber)) {
      errors.aadhaarNumber = 'Aadhaar must be exactly 12 digits and numeric only';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle generic input updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear specific field error on typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle service checkbox changes
  const handleServiceCheckboxChange = (service) => {
    setFormData((prev) => {
      const currentServices = prev.servicesOpted || [];
      const updatedServices = currentServices.includes(service)
        ? currentServices.filter((s) => s !== service)
        : [...currentServices, service];
      return { ...prev, servicesOpted: updatedServices };
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please resolve inputs validation errors before saving.');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.panNumber) payload.panNumber = payload.panNumber.toUpperCase();

      let response;
      if (isEditMode) {
        response = await api.put(`/clients/${id}`, payload);
      } else {
        response = await api.post('/clients', payload);
      }

      if (response.data?.success) {
        setSuccess(
          isEditMode
            ? 'Client profile updated successfully!'
            : 'New client added successfully!'
        );
        setTimeout(() => {
          navigate('/clients');
        }, 1500);
      } else {
        setError(response.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error submitting form:', err.message);
      setError(err.response?.data?.message || 'An error occurred while saving client record.');
    } finally {
      setLoading(false);
    }
  };

  // Role details
  const isEmployee = currentUser?.role?.name === 'Employee';


  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Retrieving client record...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              {isEditMode ? `Edit Client Details` : 'Add New Client Profile'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? 'Modify client basic information, tax references, and team assignments.'
                : 'Register a new tax client in the central CA database.'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Alert Panels */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Information */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
            <FileText className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Basic Information & Business Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Client ID (Read-Only) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 dark:text-slate-500">Client ID (Read-Only)</label>
              <input
                type="text"
                name="clientId"
                value={formData.clientId}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-500 dark:text-slate-400 font-semibold focus:outline-none cursor-not-allowed"
                placeholder="Pre-generating..."
              />
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  fieldErrors.clientName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="Enter client's full name"
              />
              {fieldErrors.clientName && (
                <p className="text-[10px] text-red-500 font-semibold">{fieldErrors.clientName}</p>
              )}
            </div>

            {/* Business Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="e.g. Acme Tech Solutions LLC"
              />
            </div>

            {/* File Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">File Number</label>
              <input
                type="text"
                name="fileNumber"
                value={formData.fileNumber}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="e.g. FILE-2026-098"
              />
            </div>

            {/* Client Type */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">
                Client Type <span className="text-red-500">*</span>
              </label>
              <select
                name="clientType"
                value={formData.clientType}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              >
                {[...new Set([...clientTypes, formData.clientType])].filter(Boolean).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Case Type */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">Case Type</label>
              <select
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              >
                {[...new Set([...caseTypes, formData.caseType])].filter(Boolean).map((cType) => (
                  <option key={cType} value={cType}>
                    {cType}
                  </option>
                ))}
              </select>
            </div>

            {/* DOB / DOF */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">DOB / Date of Incorporation</label>
              <input
                type="date"
                name="dobDof"
                value={formData.dobDof}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              />
            </div>

            {/* Accountant Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">Accountant Name</label>
              <select
                name="accountantName"
                value={formData.accountantName}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              >
                <option value="">-- Select Accountant --</option>
                {[...new Set([...accountantOptions, formData.accountantName])].filter(Boolean).map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            {/* Regularity Type */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">Regularity Type</label>
              <select
                name="regularityType"
                value={formData.regularityType}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              >
                {[...new Set([...regularityTypes, formData.regularityType])].filter(Boolean).map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* PAN Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                maxLength="10"
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase transition-all ${
                  fieldErrors.panNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="ABCDE1234F"
              />
              {fieldErrors.panNumber && (
                <p className="text-[10px] text-red-500 font-semibold">{fieldErrors.panNumber}</p>
              )}
            </div>

            {/* Aadhaar Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">Aadhaar Number</label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                maxLength="12"
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  fieldErrors.aadhaarNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="12-digit numeric Aadhaar"
              />
              {fieldErrors.aadhaarNumber && (
                <p className="text-[10px] text-red-500 font-semibold">{fieldErrors.aadhaarNumber}</p>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">Remarks</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Any special remarks..."
              />
            </div>
          </div>
        </div>

        {/* Step 2: Contact & Government Credentials */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
            <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Contact & Registrations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                maxLength="10"
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  fieldErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="10-digit mobile number"
              />
              {fieldErrors.phoneNumber && (
                <p className="text-[10px] text-red-500 font-semibold">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">WhatsApp Number</label>
              <input
                type="text"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                maxLength="12"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="WhatsApp contact with country code"
              />
            </div>

            {/* Email ID */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-350">Email ID</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="client.email@example.com"
              />
              {fieldErrors.email ? (
                <p className="text-[10px] text-red-500 font-semibold">{fieldErrors.email}</p>
              ) : (
                !isEditMode && <span className="text-[10px] text-slate-400 block mt-0.5">Creating an email automatically sets up a secure client login account.</span>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="font-bold text-slate-600 dark:text-slate-350">Permanent / Office Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Provide physical street address details..."
              />
            </div>
          </div>
        </div>

        {/* Step 3: Services */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
            <UserCheck className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Services Opted
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Services Checklist */}
            <div className="space-y-2 md:col-span-3">
              <span className="font-bold text-slate-600 dark:text-slate-350 block">
                Services Opted
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                {[...new Set([...serviceOptions, ...(formData.servicesOpted || [])])].filter(Boolean).map((service) => {
                  const isChecked = (formData.servicesOpted || []).includes(service);
                  return (
                    <label
                      key={service}
                      className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer select-none transition-all duration-150 ${
                        isChecked
                          ? 'border-indigo-500/30 bg-indigo-500/[0.04] text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400 font-bold'
                          : 'border-slate-200 dark:border-slate-850 hover:bg-slate-100/30 text-slate-600 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleServiceCheckboxChange(service)}
                        className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/25 shrink-0"
                      />
                      {service}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-6 py-2.5 text-xs font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 disabled:opacity-60 cursor-pointer active:scale-95"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditMode ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
