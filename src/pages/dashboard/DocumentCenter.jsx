import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Folder,
  FileText,
  Search,
  Upload,
  Download,
  Eye,
  History,
  ArrowLeft,
  Filter,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  UploadCloud,
} from 'lucide-react';

const DocumentCenter = () => {
  const { user } = useAuthStore();
  const isClient = user?.role?.name === 'Client';

  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Folders & Navigation State
  const [currentFolder, setCurrentFolder] = useState(null); // 'GST', 'Income Tax', etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');

  // Version history modal
  const [selectedDocForHistory, setSelectedDocForHistory] = useState(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('GST');
  const [uploadName, setUploadName] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [targetClientId, setTargetClientId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadMethod, setUploadMethod] = useState('local'); // 'local' | 'link'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const categories = ['GST', 'Income Tax', 'Audit', 'ROC', 'Payroll', 'KYC', 'Compliance', 'Others'];

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/clients/documents';
      const params = {};
      if (selectedClientFilter) {
        params.clientId = selectedClientFilter;
      }
      const response = await api.get(endpoint, { params });
      if (response.data?.success) {
        setDocuments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedClientFilter]);

  const fetchClients = useCallback(async () => {
    if (isClient) return;
    try {
      const response = await api.get('/clients');
      if (response.data?.success) {
        setClients(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching clients list:', err);
    }
  }, [isClient]);

  useEffect(() => {
    fetchDocuments();
    fetchClients();
  }, [fetchDocuments, fetchClients]);

  const handleFileChange = (file) => {
    setUploadError('');
    if (!file) return;

    // Validate size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    // Validate format (pdf, doc, docx, xls, xlsx, csv)
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isAllowed) {
      setUploadError('Invalid file format. Only PDF, Word, Excel, and CSV files are allowed.');
      return;
    }

    setSelectedFile(file);

    // Auto-fill document name if it's empty
    if (!uploadName) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadName(baseName);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadName) {
      setError('Please fill in the document title.');
      return;
    }
    if (uploadMethod === 'link' && !uploadUrl) {
      setError('Please fill in the download link URL.');
      return;
    }
    if (uploadMethod === 'local' && !selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    if (!isClient && !targetClientId) {
      setError('Please select a target client.');
      return;
    }

    setUploading(true);
    setUploadSuccess('');
    setError('');
    setUploadError('');

    try {
      let finalDocUrl = uploadUrl;

      if (uploadMethod === 'local') {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadRes.data?.success) {
          finalDocUrl = uploadRes.data.url;
        } else {
          throw new Error(uploadRes.data?.message || 'File upload failed');
        }
      }

      const payload = {
        name: uploadName,
        documentType: uploadCategory,
        fileUrl: finalDocUrl,
      };

      if (!isClient) {
        payload.clientId = targetClientId;
      }

      const response = await api.post('/clients/documents', payload);
      if (response.data?.success) {
        setUploadSuccess('Document uploaded successfully!');
        setUploadName('');
        setUploadUrl('');
        setSelectedFile(null);
        fetchDocuments();
        setTimeout(() => {
          setIsUploadOpen(false);
          setUploadSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // Filter documents based on query, folder, and filters
  const filteredDocuments = documents.filter((doc) => {
    const matchesFolder = currentFolder ? doc.documentType === currentFolder : true;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (doc.client?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? doc.status === statusFilter : true;
    return matchesFolder && matchesSearch && matchesStatus;
  });

  // Count files inside folders
  const getFolderFileCount = (cat) => {
    return documents.filter(doc => doc.documentType === cat).length;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Secure Document Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Role-based document management, folder structures, and version controls.
          </p>
        </div>
        <button
          onClick={() => {
            setUploadError('');
            setError('');
            setUploadName('');
            setUploadUrl('');
            setSelectedFile(null);
            setUploadMethod('local');
            setIsUploadOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-rose-500 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent focus:outline-none focus:border-indigo-500 transition-colors text-slate-800 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Client Filter (Staff only) */}
          {!isClient && (
            <div className="relative">
              <select
                value={selectedClientFilter}
                onChange={(e) => setSelectedClientFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Uploaded">Uploaded</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Re-upload Required">Re-upload Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Folders View vs. File Grid */}
      {!currentFolder ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Categories (Virtual Folders)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const count = getFolderFileCount(cat);
              return (
                <div
                  key={cat}
                  onClick={() => setCurrentFolder(cat)}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/50 cursor-pointer transition flex items-start gap-4"
                >
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{cat}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{count} {count === 1 ? 'file' : 'files'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentFolder(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Categories
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Active Folder:</span>
              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-500 px-2.5 py-0.5 rounded border border-indigo-500/20">{currentFolder}</span>
            </div>
          </div>

          {/* Files List Table */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <FileText className="h-10 w-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">No documents found</h4>
                <p className="text-xs text-slate-500">There are no files in this folder matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="py-2.5 font-bold uppercase">File Name</th>
                      {!isClient && <th className="py-2.5 font-bold uppercase">Client</th>}
                      <th className="py-2.5 font-bold uppercase">Uploaded By</th>
                      <th className="py-2.5 font-bold uppercase">Upload Date</th>
                      <th className="py-2.5 font-bold uppercase">Status</th>
                      <th className="py-2.5 font-bold uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 font-bold text-slate-850 dark:text-slate-250 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-400" />
                          <span>{doc.name}</span>
                          {doc.versions?.length > 0 && (
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded px-1 font-normal">
                              v{doc.versions.length + 1}
                            </span>
                          )}
                        </td>
                        {!isClient && (
                          <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-300">
                            {doc.client?.companyName || 'Unknown'}
                          </td>
                        )}
                        <td className="py-3.5">{doc.uploadedBy?.name || 'Portal User'}</td>
                        <td className="py-3.5">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            doc.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            doc.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            doc.status === 'Under Review' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                            doc.status === 'Re-upload Required' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-900'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-1.5">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-indigo-500 transition cursor-pointer"
                            title="Download/Open"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          {doc.versions?.length > 0 && (
                            <button
                              onClick={() => setSelectedDocForHistory(doc)}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-indigo-500 transition cursor-pointer"
                              title="Version History"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Dialog Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Upload New Document
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {uploadSuccess && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-500 text-xs">
                <CheckCircle className="h-4 w-4" />
                <p>{uploadSuccess}</p>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-rose-500 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{uploadError}</p>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Category/Folder</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Target Client (Staff only) */}
              {!isClient && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Client Profile</label>
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  >
                    <option value="">Select a Client</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Document Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Invoices May 2026"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Upload Method Toggles */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('local')}
                  className={`flex-1 py-2 text-xs font-bold transition border-b-2 text-center cursor-pointer ${
                    uploadMethod === 'local'
                      ? 'border-indigo-500 text-indigo-500'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Local File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('link')}
                  className={`flex-1 py-2 text-xs font-bold transition border-b-2 text-center cursor-pointer ${
                    uploadMethod === 'link'
                      ? 'border-indigo-500 text-indigo-500'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Web Link (Google Drive / URL)
                </button>
              </div>

              {/* Local File Drop Zone */}
              {uploadMethod === 'local' ? (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Select File (Allowed: PDF, Word, Excel, CSV)</label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition duration-200 ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-500/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 bg-slate-50 dark:bg-slate-900/40'
                    }`}
                    onClick={() => document.getElementById('local-file-input').click()}
                  >
                    <input
                      id="local-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />
                    
                    {!selectedFile ? (
                      <div className="space-y-2">
                        <UploadCloud className="h-8 w-8 mx-auto text-slate-400 animate-pulse" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-indigo-500">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-[10px] text-slate-400">
                          PDF, DOC, DOCX, XLS, XLSX, or CSV (Max 10MB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-left bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-750 dark:text-white truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-650 rounded-lg transition cursor-pointer"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Mock Download Link URL */
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">File Download URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/files/document.pdf"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer"
              >
                {uploading ? 'Uploading Securely...' : 'Complete Upload'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {selectedDocForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <div>
                <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                  Version History
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedDocForHistory.name}</p>
              </div>
              <button
                onClick={() => setSelectedDocForHistory(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1 text-xs">
              {/* Current Version */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.02]">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 dark:text-white">Current Version</span>
                  <p className="text-[10px] text-slate-450">Updated on {new Date(selectedDocForHistory.updatedAt).toLocaleString()}</p>
                </div>
                <a
                  href={selectedDocForHistory.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-indigo-500 text-white font-bold rounded px-2.5 py-1 text-[10px] hover:bg-indigo-600 cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  Get File
                </a>
              </div>

              {/* Previous Versions */}
              {selectedDocForHistory.versions?.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 bg-slate-50/50 dark:border-slate-850/30">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Version v{v.versionNumber}</span>
                    <p className="text-[10px] text-slate-450">Uploaded {new Date(v.createdAt).toLocaleString()}</p>
                  </div>
                  <a
                    href={v.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-405 font-bold rounded px-2.5 py-1 text-[10px] cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Get File
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
