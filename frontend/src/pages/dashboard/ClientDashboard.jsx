import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, Upload, Download, CheckCircle, AlertCircle, Clock, 
  Send, Plus, FileUp, X, Bell, Info, Landmark, Layers
} from 'lucide-react';

const ClientDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Document upload form state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('GST documents');
  const [docUrl, setDocUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading client dashboard details:', err);
      setError(err.response?.data?.message || 'Failed to load client portal. Verify role mapping.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError('');

    if (!docName || !docUrl) {
      setUploadError('Please fill in all required fields.');
      setUploadLoading(false);
      return;
    }

    try {
      const res = await api.post('/clients/documents', {
        name: docName,
        documentType: docType,
        fileUrl: docUrl
      });

      if (res.data?.success) {
        setDocName('');
        setDocUrl('');
        setIsUploadModalOpen(false);
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Error uploading client document:', err);
      setUploadError(err.response?.data?.message || 'Failed to submit document.');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading client dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-550/20 text-red-500 rounded-xl p-8 max-w-xl mx-auto space-y-4 text-center">
        <Landmark className="h-12 w-12 mx-auto text-red-500" />
        <h3 className="text-lg font-bold font-heading">Secure Client Portal Error</h3>
        <p className="text-xs leading-relaxed">
          {error || 'You do not have a client profile linked to this user account. Please contact administrative staff.'}
        </p>
      </div>
    );
  }

  const { client, documents } = data;

  // Split documents into My Uploads (Client uploaded) vs. Firm Uploads (Staff uploaded)
  const clientUploaded = documents.filter(d => d.uploadedBy?.role?.name === 'Client');
  const staffUploaded = documents.filter(d => d.uploadedBy?.role?.name !== 'Client');

  // Status visual maps
  const getTrackerStepClass = (currentStatus, targetStatus, stepsList) => {
    const currentIdx = stepsList.indexOf(currentStatus);
    const targetIdx = stepsList.indexOf(targetStatus);
    
    if (currentIdx >= targetIdx) {
      return 'bg-indigo-500 border-indigo-500 text-white'; // Completed / active
    }
    return 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'; // Upcoming
  };

  const getTrackerBarClass = (currentStatus, targetStatus, stepsList) => {
    const currentIdx = stepsList.indexOf(currentStatus);
    const targetIdx = stepsList.indexOf(targetStatus);
    if (currentIdx > targetIdx) {
      return 'bg-indigo-500';
    }
    return 'bg-slate-200 dark:bg-slate-800';
  };

  const docTypeBadgeColors = {
    'GST documents': 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    'ITR documents': 'bg-sky-500/10 text-sky-500 border border-sky-500/20',
    'Audit reports': 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    'Financial statements': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  };

  const docStatusBadgeColors = {
    'Uploaded': 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    'Reviewed': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    'Action Needed': 'bg-red-500/10 text-red-500 border border-red-500/20',
    'Approved': 'bg-emerald-500/10 text-emerald-500 border border-emerald-555/20',
  };

  const gstSteps = ['Not Started', 'Pending Documents', 'In Progress', 'Filed'];
  const itrSteps = ['Not Started', 'Pending Documents', 'In Progress', 'Filed'];
  const auditSteps = ['Not Started', 'In Progress', 'Completed'];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-heading">
            {client.companyName} Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure client workspace. Track active filings, exchange compliance sheets, and view outstanding work.
          </p>
        </div>

        <button
          onClick={() => {
            setUploadError('');
            setIsUploadModalOpen(true);
          }}
          className="bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
        >
          <Upload className="h-4.5 w-4.5" />
          Upload Document
        </button>
      </div>

      {/* Grid: Filing Status Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GST Filing Tracker */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">GST Compliance</span>
            <span className="text-xs font-extrabold text-indigo-500">{client.filingStatus?.gstStatus}</span>
          </div>

          {/* Stepper */}
          <div className="relative flex justify-between items-center py-2">
            {gstSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                {/* Step Circle */}
                <div
                  className={`w-6 h-6 rounded-full border text-[9px] font-black flex items-center justify-center relative z-10 select-none ${getTrackerStepClass(client.filingStatus?.gstStatus, step, gstSteps)}`}
                  title={`GST Step: ${step}`}
                >
                  {idx + 1}
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[7px] font-extrabold uppercase whitespace-nowrap text-slate-400">
                    {step.split(' ')[0]}
                  </span>
                </div>
                {/* Connector line */}
                {idx < gstSteps.length - 1 && (
                  <div className={`h-1 flex-1 relative z-0 -mx-1 ${getTrackerBarClass(client.filingStatus?.gstStatus, gstSteps[idx + 1], gstSteps)}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="pt-2"></div>
        </div>

        {/* ITR Filing Tracker */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Income Tax Filing</span>
            <span className="text-xs font-extrabold text-indigo-500">{client.filingStatus?.itrStatus}</span>
          </div>

          {/* Stepper */}
          <div className="relative flex justify-between items-center py-2">
            {itrSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                {/* Step Circle */}
                <div
                  className={`w-6 h-6 rounded-full border text-[9px] font-black flex items-center justify-center relative z-10 select-none ${getTrackerStepClass(client.filingStatus?.itrStatus, step, itrSteps)}`}
                  title={`ITR Step: ${step}`}
                >
                  {idx + 1}
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[7px] font-extrabold uppercase whitespace-nowrap text-slate-400">
                    {step.split(' ')[0]}
                  </span>
                </div>
                {/* Connector line */}
                {idx < itrSteps.length - 1 && (
                  <div className={`h-1 flex-1 relative z-0 -mx-1 ${getTrackerBarClass(client.filingStatus?.itrStatus, itrSteps[idx + 1], itrSteps)}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="pt-2"></div>
        </div>

        {/* Audit Status Tracker */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Statutory Audit</span>
            <span className="text-xs font-extrabold text-indigo-500">{client.filingStatus?.auditStatus}</span>
          </div>

          {/* Stepper */}
          <div className="relative flex justify-between items-center py-2">
            {auditSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                {/* Step Circle */}
                <div
                  className={`w-6 h-6 rounded-full border text-[9px] font-black flex items-center justify-center relative z-10 select-none ${getTrackerStepClass(client.filingStatus?.auditStatus, step, auditSteps)}`}
                  title={`Audit Step: ${step}`}
                >
                  {idx + 1}
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[7px] font-extrabold uppercase whitespace-nowrap text-slate-400">
                    {step.split(' ')[0]}
                  </span>
                </div>
                {/* Connector line */}
                {idx < auditSteps.length - 1 && (
                  <div className={`h-1 flex-1 relative z-0 -mx-1 ${getTrackerBarClass(client.filingStatus?.auditStatus, auditSteps[idx + 1], auditSteps)}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="pt-2"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client actions & completed filings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pending instructions */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5 text-indigo-500" />
              Pending Instructions
            </h3>

            {client.pendingWorks?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                All client actions clear. No pending items.
              </div>
            ) : (
              <ul className="space-y-2">
                {client.pendingWorks?.map((work, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2.5 items-start p-3 bg-red-500/[0.03] dark:bg-red-950/[0.01] border border-red-500/10 rounded-lg text-xs leading-normal"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{work}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Completed Filings Log */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
              Completed Filings History
            </h3>

            {client.completedFilings?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                No filing transactions completed in this program.
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {client.completedFilings?.map((filing) => (
                  <div
                    key={filing._id}
                    className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-800 dark:text-white truncate max-w-[120px]">{filing.filingType}</span>
                      <span className="text-slate-400 text-[10px]">{filing.period}</span>
                    </div>
                    {filing.acknowledgmentNumber && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Ack: <span className="font-bold">{filing.acknowledgmentNumber}</span>
                      </p>
                    )}
                    <span className="text-[9px] text-slate-400 block pt-0.5">
                      Filed: {new Date(filing.filedDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Documents Exchange Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Firm Uploads: Official CA sheets, statements and reports */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-white font-heading">
              Finalized Filings & Reports Issued by Firm
            </h3>

            {staffUploaded.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-450 italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                No documents uploaded by CA staff yet. Completed reports and tax filing receipts will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {staffUploaded.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-900 rounded-xl"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-805 dark:text-white truncate max-w-[200px]">
                          {doc.name}
                        </h4>
                        <span className={`rounded-full px-2 py-0.2 text-[8px] font-bold uppercase tracking-wider ${docTypeBadgeColors[doc.documentType] || 'bg-slate-100 text-slate-600'}`}>
                          {doc.documentType.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 block font-semibold">
                        Uploaded by {doc.uploadedBy?.name} on {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex items-center justify-center gap-1 bg-indigo-500 hover:bg-indigo-650 text-white rounded-lg p-2 text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                      title="Download Issued Document"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Uploads: GST excel, ITR inputs */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-855 dark:text-white font-heading">
              My Uploaded Documents Registry
            </h3>

            {clientUploaded.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-450 italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                You have not uploaded any documents. Click "Upload Document" to send GST excel files or billing sheets to our operations team.
              </div>
            ) : (
              <div className="space-y-3">
                {clientUploaded.map((doc) => (
                  <div
                    key={doc._id}
                    className="border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-950/20"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className={`inline-block rounded-full px-2 py-0.2 text-[8px] font-bold uppercase tracking-wider ${docTypeBadgeColors[doc.documentType] || 'bg-slate-100 text-slate-650'} mb-1`}>
                          {doc.documentType}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                          {doc.name}
                        </h4>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${docStatusBadgeColors[doc.status] || 'bg-slate-100 text-slate-500'}`}>
                        {doc.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] text-slate-400">
                      <span>Uploaded on: {new Date(doc.createdAt).toLocaleDateString()}</span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-500 hover:underline font-bold"
                      >
                        <ExternalLink className="h-3 w-3" /> Check File
                      </a>
                    </div>

                    {doc.remarks && (
                      <div className="bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] border-l-2 border-indigo-500 p-2.5 rounded-r-lg text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-[8px] uppercase tracking-wider text-slate-400 block">CA Reviewer Notes:</span>
                        <p className="italic">"{doc.remarks}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Document Modal overlay */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
                Upload Compliance Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
              {uploadError && (
                <div className="bg-red-500/10 border border-red-550/25 text-red-500 rounded-xl p-3 text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Document Name *
                </label>
                <input
                  required
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Sales Registry Excel May 2026"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Document Category / Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="GST documents">GST documents</option>
                  <option value="ITR documents">ITR documents</option>
                  <option value="Audit reports">Audit reports</option>
                  <option value="Financial statements">Financial statements</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Document Link (Google Drive / PDF URL) *
                </label>
                <input
                  required
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={uploadLoading}
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-650 disabled:bg-indigo-550/50 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {uploadLoading ? 'Uploading...' : <><Send className="h-3.5 w-3.5" /> Submit File</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
