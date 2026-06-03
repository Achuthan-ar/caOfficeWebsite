import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  FileText,
  Check,
  X,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

const PendingDocuments = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected item to review
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approve'); // Approve, Reject, Request Re-upload
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch only requests that are 'Uploaded' (Under Review)
      const response = await api.get('/document-requests?status=Uploaded');
      if (response.data?.success) {
        setRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending uploads:', err);
      setError('Failed to load pending reviews checklist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/document-requests/${selectedReq._id}/review`, {
        action: reviewAction,
        comments: reviewComments,
      });

      if (response.data?.success) {
        setSuccess(`Document review status submitted: ${reviewAction}.`);
        setReviewComments('');
        setSelectedReq(null);
        fetchPendingRequests();
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Review error:', err);
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
          Pending Reviews Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review documents uploaded by clients, verify accuracy, approve, or request re-uploads with remarks.
        </p>
      </div>

      {/* Success/Error boxes */}
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

      {/* Split view: pending list vs. review details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Pending checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
                Pending Audits Queue ({requests.length})
              </h3>
              <button
                onClick={fetchPendingRequests}
                className="p-1 text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <hr className="border-slate-100 dark:border-slate-900 mb-4" />

            {loading ? (
              <div className="text-center py-12 text-xs text-slate-450">Loading uploads queue...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 space-y-2.5">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Queue is empty!</h4>
                <p className="text-xs text-slate-500">All client document uploads have been fully reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    onClick={() => {
                      setSelectedReq(req);
                      setReviewComments('');
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                      selectedReq?._id === req._id
                        ? 'border-indigo-500 bg-indigo-500/[0.02]'
                        : 'border-slate-200/60 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/10 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="p-2 rounded bg-amber-500/10 text-amber-500 shrink-0 mt-0.5 border border-amber-500/20">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                          {req.uploadedDocument?.name || req.documentName}
                        </p>
                        <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          {req.client?.companyName} • {req.category}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-450 font-semibold mt-1">
                          <span>Req: {req.requestId}</span>
                          <span>•</span>
                          <span>Uploaded: {new Date(req.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        req.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        req.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-indigo-500/10 text-indigo-500'
                      }`}>
                        {req.priority}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-bold hover:underline">
                        Review File &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Audit Form Panel */}
        <div className="lg:col-span-1">
          {selectedReq ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Request: {selectedReq.requestId}
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading mt-2">
                  Review: {selectedReq.documentName}
                </h3>
              </div>
              <hr className="border-slate-100 dark:border-slate-900" />

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-450 font-medium block">Filing Client:</span>
                  <p className="font-bold text-slate-750 dark:text-slate-200">{selectedReq.client?.companyName}</p>
                </div>
                <div>
                  <span className="text-slate-450 font-medium block">Uploaded File:</span>
                  <p className="font-semibold text-indigo-500 truncate max-w-[240px]">
                    {selectedReq.uploadedDocument?.name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-450 font-medium block">Category:</span>
                  <p className="font-bold">{selectedReq.category}</p>
                </div>
                <div>
                  <span className="text-slate-450 font-medium block">Description/Instructions:</span>
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    {selectedReq.description || 'No description provided.'}
                  </p>
                </div>

                {/* Download Button */}
                {selectedReq.uploadedDocument?.fileUrl && (
                  <a
                    href={selectedReq.uploadedDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-350 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 font-bold rounded-lg transition text-[11px] cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download / Open Document
                  </a>
                )}
              </div>

              <hr className="border-slate-100 dark:border-slate-900" />

              {/* Review Audit Form */}
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Decision</label>
                  <select
                    value={reviewAction}
                    onChange={(e) => setReviewAction(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Approve">Approve Document</option>
                    <option value="Reject">Reject Document</option>
                    <option value="Request Re-upload">Request Re-upload</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Remarks / Comments</label>
                  <textarea
                    placeholder="Provide detailed comments explaining approval or why a re-upload is needed..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition font-semibold text-[11px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 px-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 font-bold text-[11px] cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Decision'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-100/50 dark:bg-slate-900/10 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl p-8 text-center space-y-2 text-xs">
              <MessageSquare className="h-6 w-6 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-455">No file selected</p>
              <p className="text-slate-450 leading-relaxed">Select a pending upload entry from the list on the left to begin auditing details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PendingDocuments;
