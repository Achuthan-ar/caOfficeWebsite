import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  FileText,
  Plus,
  Send,
  Bell,
  AlertTriangle,
  Calendar,
  Layers,
  X,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';

const DocumentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  // Single Request fields
  const [reqClientId, setReqClientId] = useState('');
  const [reqDocName, setReqDocName] = useState('');
  const [reqCategory, setReqCategory] = useState('GST');
  const [reqDesc, setReqDesc] = useState('');
  const [reqPriority, setReqPriority] = useState('Medium');
  const [reqDueDate, setReqDueDate] = useState('');

  // Template Request fields
  const [tplClientId, setTplClientId] = useState('');
  const [tplName, setTplName] = useState('GST');
  const [tplDueDate, setTplDueDate] = useState('');

  // Action status loading states
  const [submitting, setSubmitting] = useState(false);
  const [checkingReminders, setCheckingReminders] = useState(false);

  const categories = ['GST', 'Income Tax', 'Audit', 'ROC', 'Payroll', 'KYC', 'Compliance', 'Others'];

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/document-requests');
      if (response.data?.success) {
        setRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch requests list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients');
      if (response.data?.success) {
        setClients(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchClients();
  }, [fetchRequests, fetchClients]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqClientId || !reqDocName || !reqDueDate) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/document-requests', {
        clientId: reqClientId,
        documentName: reqDocName,
        category: reqCategory,
        description: reqDesc,
        priority: reqPriority,
        dueDate: reqDueDate,
      });

      if (response.data?.success) {
        setSuccess('Document request generated successfully.');
        setReqDocName('');
        setReqDesc('');
        setReqDueDate('');
        fetchRequests();
        setTimeout(() => {
          setIsRequestOpen(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setError(err.response?.data?.message || 'Failed to create request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyTemplate = async (e) => {
    e.preventDefault();
    if (!tplClientId || !tplDueDate) {
      setError('Please select a client and set a due date.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/document-requests/template', {
        clientId: tplClientId,
        templateName: tplName,
        dueDate: tplDueDate,
      });

      if (response.data?.success) {
        setSuccess(`Applied ${tplName} template! Generated ${response.data.count} requests.`);
        setTplDueDate('');
        fetchRequests();
        setTimeout(() => {
          setIsTemplateOpen(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error applying template:', err);
      setError(err.response?.data?.message || 'Failed to apply template.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerReminders = async () => {
    setCheckingReminders(true);
    setError('');
    setSuccess('');
    try {
      // Force reminder dispatch simulation
      const response = await api.post('/document-requests/run-reminders', { force: true });
      if (response.data?.success) {
        const { remindersSent, escalationsTriggered } = response.data.data;
        setSuccess(`Reminder check completed: Sent ${remindersSent} alerts, triggered ${escalationsTriggered} escalations.`);
        fetchRequests();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Error triggering reminders:', err);
      setError('Reminder check failed.');
    } finally {
      setCheckingReminders(false);
    }
  };

  // Stats calculation
  const totalCount = requests.length;
  const overdueCount = requests.filter(r => r.status === 'Overdue').length;
  const escalatedCount = requests.filter(r => r.status === 'Escalated').length;
  const pendingReviewCount = requests.filter(r => r.status === 'Uploaded').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Client Document Requests
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create document checklist requests, apply predefined filing templates, and automate reminders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleTriggerReminders}
            disabled={checkingReminders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 px-4 py-2 text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <Bell className={`h-4 w-4 ${checkingReminders ? 'animate-bounce' : ''}`} />
            {checkingReminders ? 'Running Reminders...' : 'Run Reminder Check'}
          </button>
          <button
            onClick={() => setIsTemplateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 px-4 py-2 text-sm font-semibold transition cursor-pointer"
          >
            <Layers className="h-4 w-4" />
            Apply Template
          </button>
          <button
            onClick={() => setIsRequestOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Request Document
          </button>
        </div>
      </div>

      {/* Alert states */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-500 text-sm">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-rose-500 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Requested</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block font-heading">{totalCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Pending Review</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block font-heading">{pendingReviewCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm border-l-4 border-l-rose-500 animate-pulse">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Overdue Files</span>
          <span className="text-2xl font-black text-rose-500 mt-1 block font-heading">{overdueCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm border-l-4 border-l-red-500">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Escalated Requests</span>
          <span className="text-2xl font-black text-red-500 mt-1 block font-heading">{escalatedCount}</span>
        </div>
      </div>

      {/* Requests table listing */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading mb-4">
          All Active Requests Checklist
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-450">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <FileText className="h-8 w-8 text-slate-350 mx-auto" />
            <p className="font-bold text-slate-650 dark:text-slate-350 text-xs">No document requests found</p>
            <p className="text-[11px] text-slate-450">Click "Request Document" to start gathering client records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 font-bold uppercase">Req ID</th>
                  <th className="py-2.5 font-bold uppercase">Client</th>
                  <th className="py-2.5 font-bold uppercase">Document Name</th>
                  <th className="py-2.5 font-bold uppercase">Category</th>
                  <th className="py-2.5 font-bold uppercase">Requested By</th>
                  <th className="py-2.5 font-bold uppercase">Due Date</th>
                  <th className="py-2.5 font-bold uppercase">Reminders</th>
                  <th className="py-2.5 font-bold uppercase">Priority</th>
                  <th className="py-2.5 font-bold uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3.5 font-bold text-slate-400">{req.requestId}</td>
                    <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-350">{req.client?.companyName}</td>
                    <td className="py-3.5 font-bold text-slate-750 dark:text-slate-200">{req.documentName}</td>
                    <td className="py-3.5">{req.category}</td>
                    <td className="py-3.5">
                      <span className="font-semibold">{req.requestedBy?.name || 'Staff'}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{req.requestedByRole}</span>
                    </td>
                    <td className="py-3.5">{new Date(req.dueDate).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.reminderCount} sent</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-block font-bold text-[9px] px-1.5 py-0.5 rounded uppercase ${
                        req.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        req.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        req.priority === 'Medium' ? 'bg-indigo-500/10 text-indigo-500' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-900'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        req.status === 'Escalated' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                        req.status === 'Overdue' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        req.status === 'Uploaded' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        req.status === 'Re-upload Required' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-slate-100 text-slate-550 dark:bg-slate-900 dark:text-slate-400'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Single Document Modal */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Request Document from Client
              </h3>
              <button
                onClick={() => setIsRequestOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Target Client</label>
                <select
                  value={reqClientId}
                  onChange={(e) => setReqClientId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Document Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Ledger"
                    value={reqDocName}
                    onChange={(e) => setReqDocName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Description / Instructions</label>
                <textarea
                  placeholder="Describe details regarding format, periods, details requested..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Priority</label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Due Date</label>
                  <input
                    type="date"
                    value={reqDueDate}
                    onChange={(e) => setReqDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting Request...' : 'Send Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Apply Template Modal */}
      {isTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Apply Filing Document Template
              </h3>
              <button
                onClick={() => setIsTemplateOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleApplyTemplate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Target Client</label>
                <select
                  value={tplClientId}
                  onChange={(e) => setTplClientId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Filing Template</label>
                <select
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="GST">GST Filing (4 requested files)</option>
                  <option value="Income Tax">Income Tax Filing (5 requested files)</option>
                  <option value="Audit">Audit Template (4 requested files)</option>
                  <option value="ROC">ROC Template (3 requested files)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Filing Due Date</label>
                <input
                  type="date"
                  value={tplDueDate}
                  onChange={(e) => setTplDueDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Applying Template...' : 'Generate Requests'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequests;
