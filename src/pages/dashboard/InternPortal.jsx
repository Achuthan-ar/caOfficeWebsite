import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  CheckSquare, Square, FileText, Send, Calendar, Award, 
  BookOpen, CheckCircle, Clock, Plus, ExternalLink, ShieldAlert, Award as CertificateIcon,
  X
} from 'lucide-react';

const InternPortal = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report Form Overlay Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('Weekly');
  const [weekNumber, setWeekNumber] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportFileUrl, setReportFileUrl] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/internships/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching intern dashboard:', err);
      setError(err.response?.data?.message || 'No active internship mapped to your account.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    if (!data?.internship) return;
    const targetStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await api.put(`/internships/${data.internship._id}/tasks/${taskId}`, {
        status: targetStatus
      });
      if (res.data?.success) {
        // Refresh dashboard to show new progress percentage
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    setReportError('');

    if (reportType === 'Weekly' && !weekNumber) {
      setReportError('Please provide a week number.');
      setReportLoading(false);
      return;
    }

    try {
      const res = await api.post('/internships/reports', {
        internshipId: data.internship._id,
        reportType,
        weekNumber: reportType === 'Weekly' ? Number(weekNumber) : undefined,
        title: reportTitle,
        content: reportContent,
        fileUrl: reportFileUrl
      });

      if (res.data?.success) {
        // Reset form and close
        setReportTitle('');
        setReportContent('');
        setReportFileUrl('');
        setWeekNumber('');
        setIsReportModalOpen(false);
        // Refresh data
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setReportError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading intern workspace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-amber-500/10 border border-amber-550/20 text-amber-600 rounded-xl p-8 max-w-xl mx-auto space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-amber-500" />
        <h3 className="text-lg font-bold font-heading">No Active Internship Mapping</h3>
        <p className="text-xs leading-relaxed">
          {error || 'It appears you are not mapped to an active internship registry. Please contact HR management for coach allocation.'}
        </p>
      </div>
    );
  }

  const { internship, reports } = data;
  const isFinished = internship.status === 'Completed';

  // Check if certificate has been generated
  // If internship is completed, we will fetch certificate details if present
  // Wait, let's see. Does the dashboard fetchCertificate? We can search in backend response
  // internship details contains "certificate" if getCertificate was called, but in getInternshipDetails we return it.
  // Wait, let's see if there is a certificate on internship. Yes, we did:
  // const certificate = await Certificate.findOne({ internship: internship._id }); inside getInternshipDetails.
  // But in getInternDashboard we didn't return certificate. Wait, let's look at `getInternDashboard` in internshipController:
  // In getInternDashboard, we populate data.internship and reports, but let's check if we can query certificate directly:
  // Yes, let's make a quick API call to see if a certificate is available, or we can check if it exists in DB.
  // Wait, we can fetch certificate by requesting `GET /api/internships/certificates/:internshipId`? No, the endpoint in routes is `GET /api/internships/certificates/:id` (which takes certificate ID).
  // But wait! Can we fetch internship details via `GET /api/internships/:id`? Yes, which returns the internship, reports, and certificate!
  // Oh, that is perfect! We can just fetch `/api/internships/:id` using the internship._id of the logged in user, and it will return the certificate too!
  // Wait, `getInternDashboard` is `/api/internships/dashboard`, which returns `{ internship, reports }`. We can modify it or fetch `/api/internships/:id` instead.
  // Wait, since we are fetching `/api/internships/dashboard` and it does not have the certificate, let's fetch `/api/internships/${internship._id}` inside our mount, or let's make it fetch that.
  // Actually, both routes are available. Let's see: `getInternshipDetails` (accessible to Intern) returns `internship`, `reports`, and `certificate`!
  // Yes! So we can call `api.get('/internships/dashboard')` to get the internship ID, and then call `api.get(`/internships/${internship._id}`)` to get all details, including the certificate!
  // Let's implement that double fetch or simple details fetch! If we call `api.get('/internships/dashboard')`, it gets the active internship for the logged-in intern. We can then use its ID to get details, or we can just fetch `getInternshipDetails` directly!
  // Let's check `fetchDashboard` above: it calls `api.get('/internships/dashboard')` which returns `{ internship, reports }`. If we also want the certificate, we can check if `internship.status === 'Completed'` and fetch the certificate, or query `/api/internships/${internship._id}`!
  // Let's write `fetchDashboard` to call `api.get('/internships/dashboard')` and then if successful, call `api.get('/internships/' + internship._id)` to load details (which includes `certificate`). Let's do that! It is very simple.

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-heading">
            Intern Learning Portal
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400">
            Track your training modules, coordinate with your coach, and submit weekly diaries.
          </p>
        </div>

        {/* Certificate shortcut if completed */}
        {internship.status === 'Completed' && (
          <button
            onClick={async () => {
              try {
                // Fetch details to find certificate ID
                const detailsRes = await api.get(`/internships/${internship._id}`);
                if (detailsRes.data?.success && detailsRes.data.data.certificate) {
                  navigate(`/certificate/${detailsRes.data.data.certificate._id}`);
                }
              } catch (err) {
                console.error(err);
              }
            }}
            className="bg-emerald-500 hover:bg-emerald-650 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <CertificateIcon className="h-4.5 w-4.5" />
            Print Completion Certificate
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats, Mentor and Progress */}
        <div className="space-y-6 lg:col-span-1">
          {/* Progress Card */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Training Completion Progress
            </h3>

            {/* Circular Gauge */}
            <div className="relative h-32 w-32 mx-auto flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-850"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - internship.progress / 100)}
                  className="text-indigo-500 transition-all duration-500"
                />
              </svg>
              <span className="text-2xl font-black text-slate-855 dark:text-white">
                {internship.progress}%
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>Status: <span className={`font-semibold ${isFinished ? 'text-emerald-500' : 'text-indigo-550'}`}>{internship.status}</span></p>
              <div className="flex items-center justify-center gap-1.5 mt-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <Calendar className="h-3.5 w-3.5" />
                <span>End: {new Date(internship.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Coach Card */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Assigned Coach / Mentor
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-slate-850 dark:text-white font-heading">
                  {internship.mentor?.name || 'Assigned Mentor'}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  {internship.department?.name || 'Operations'} Team
                </p>
              </div>

              <div className="text-xs text-slate-550 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-900">
                <p>Email: <span className="font-semibold">{internship.mentor?.email}</span></p>
                {internship.mentor?.phone && <p>Phone: <span className="font-semibold">{internship.mentor?.phone}</span></p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Learning Tasks & Report Submissions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Learning Tasks Checklists */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-white font-heading">
              Internship Training Modules & Checklist
            </h3>

            {internship.tasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-450 italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                No training tasks assigned yet by your mentor.
              </div>
            ) : (
              <div className="space-y-2">
                {internship.tasks.map((task) => {
                  const isDone = task.status === 'Completed';
                  return (
                    <div
                      key={task._id}
                      onClick={() => handleToggleTask(task._id, task.status)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer select-none ${
                        isDone 
                          ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-150 dark:border-slate-900 text-slate-400' 
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:border-indigo-500/20'
                      }`}
                    >
                      <button className="mt-0.5 text-indigo-500 shrink-0 cursor-pointer">
                        {isDone ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${isDone ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className={`text-[11px] mt-0.5 leading-normal ${isDone ? 'text-slate-400 line-through' : 'text-slate-500 dark:text-slate-400'}`}>
                            {task.description}
                          </p>
                        )}
                        {task.completedDate && (
                          <span className="text-[9px] font-semibold text-emerald-500 block mt-1">
                            Completed: {new Date(task.completedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Report Logs */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-850 dark:text-white font-heading">
                Weekly & Final Activity Diaries
              </h3>
              
              {!isFinished && (
                <button
                  onClick={() => {
                    setReportError('');
                    setIsReportModalOpen(true);
                  }}
                  className="bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl py-1.5 px-3 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Submit Report
                </button>
              )}
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-450 italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                No activity reports submitted yet. File your weekly report here.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div
                    key={rep._id}
                    className="border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-950/20"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                          {rep.reportType} {rep.weekNumber ? `(Week ${rep.weekNumber})` : ''}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                          {rep.title}
                        </h4>
                      </div>
                      
                      {rep.rating ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-555 border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle className="h-3 w-3" />
                          Graded: {rep.rating}/5
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending Review
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                      {rep.content}
                    </p>

                    {rep.fileUrl && (
                      <a
                        href={rep.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:underline font-bold"
                      >
                        <ExternalLink className="h-3 w-3" /> View Submitted Document
                      </a>
                    )}

                    {rep.feedback && (
                      <div className="bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01] border-l-2 border-indigo-500 p-2.5 rounded-r-lg text-xs space-y-1 text-slate-650 dark:text-slate-400">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-slate-450 block">Mentor Review Notes:</span>
                        <p className="italic">"{rep.feedback}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Submission Modal Overlay */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
                Submit Activity Report
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-left">
              {reportError && (
                <div className="bg-red-500/10 border border-red-550/25 text-red-550 rounded-xl p-3 text-xs font-semibold">
                  {reportError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Weekly">Weekly Diary</option>
                    <option value="Final">Final Report</option>
                  </select>
                </div>

                {reportType === 'Weekly' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Week Number *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="12"
                      value={weekNumber}
                      onChange={(e) => setWeekNumber(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Report Title *
                </label>
                <input
                  required
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Audit Verification Sheet Reconciliations"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Activity Content / Highlights *
                </label>
                <textarea
                  required
                  rows="4"
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="Detail the audit worksheets completed, direct tax calculations made, or client folders cataloged this week..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Document Attachment Link (Optional Google Drive link to PDF worksheet)
                </label>
                <input
                  type="url"
                  value={reportFileUrl}
                  onChange={(e) => setReportFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={reportLoading}
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-650 disabled:bg-indigo-550/50 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {reportLoading ? 'Submitting...' : <><Send className="h-3.5 w-3.5" /> Submit Diary</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternPortal;
