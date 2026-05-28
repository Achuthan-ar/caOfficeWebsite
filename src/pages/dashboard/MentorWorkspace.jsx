import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, User, Award, CheckCircle, FileText, Plus, Send, 
  ExternalLink, Calendar, BookOpen, Clock, X, Star, HelpCircle, FilePlus
} from 'lucide-react';

const MentorWorkspace = () => {
  const navigate = useNavigate();
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected mentee details state
  const [selectedMenteeId, setSelectedMenteeId] = useState('');
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Task form state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

  // Review report form state
  const [activeReportToReview, setActiveReportToReview] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('5');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Certificate form state
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [durationText, setDurationText] = useState('');
  const [officeName, setOfficeName] = useState('CA Office ERP & Advisory');
  const [signatureText, setSignatureText] = useState('Senior Managing CA Partner');
  const [certLoading, setCertLoading] = useState(false);

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/internships/mentees');
      if (res.data?.success) {
        setMentees(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedMenteeId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching mentees:', err);
      setError('Failed to load mentees registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  const fetchMenteeDetails = async (id) => {
    if (!id) return;
    try {
      setDetailsLoading(true);
      const res = await api.get(`/internships/${id}`);
      if (res.data?.success) {
        setSelectedDetails(res.data.data);
        
        // Auto-compute duration text for certificate based on start/end dates
        const start = new Date(res.data.data.internship.startDate);
        const end = new Date(res.data.data.internship.endDate);
        const diffMonths = Math.max(1, Math.round((end - start) / (30 * 24 * 60 * 60 * 1000)));
        const formatOpt = { month: 'long', year: 'numeric' };
        setDurationText(`${diffMonths} Months (${start.toLocaleDateString([], formatOpt)} - ${end.toLocaleDateString([], formatOpt)})`);
      }
    } catch (err) {
      console.error('Error fetching mentee details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMenteeId) {
      fetchMenteeDetails(selectedMenteeId);
    }
  }, [selectedMenteeId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    setTaskLoading(true);
    try {
      const res = await api.post(`/internships/${selectedMenteeId}/tasks`, {
        title: taskTitle,
        description: taskDesc
      });
      if (res.data?.success) {
        setTaskTitle('');
        setTaskDesc('');
        setIsTaskModalOpen(false);
        await fetchMenteeDetails(selectedMenteeId);
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleReviewReport = async (e) => {
    e.preventDefault();
    if (!feedback || !rating) return;
    setReviewLoading(true);
    try {
      const res = await api.put(`/internships/reports/${activeReportToReview._id}/review`, {
        feedback,
        rating: Number(rating)
      });
      if (res.data?.success) {
        setFeedback('');
        setActiveReportToReview(null);
        await fetchMenteeDetails(selectedMenteeId);
      }
    } catch (err) {
      console.error('Error reviewing report:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!durationText) return;
    setCertLoading(true);
    try {
      const res = await api.post(`/internships/${selectedMenteeId}/certificate`, {
        duration: durationText,
        officeName,
        signature: signatureText,
        completionStatus: 'Successful'
      });
      if (res.data?.success) {
        setIsCertModalOpen(false);
        await fetchMenteeDetails(selectedMenteeId);
        // Refresh local mentees list to update status
        const currentId = selectedMenteeId;
        const listRes = await api.get('/internships/mentees');
        if (listRes.data?.success) {
          setMentees(listRes.data.data);
          setSelectedMenteeId(currentId);
        }
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
    } finally {
      setCertLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading coach workspace...</p>
      </div>
    );
  }

  if (error || mentees.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-xs">
        <Users className="h-12 w-12 mx-auto text-slate-400" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">No Active Mentees Assigned</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
          You are currently not assigned as a coach or mentor to any active interns. As soon as HR promotes and matches a candidate to your mentorship, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-heading">
          Mentor Coaching Hub
        </h2>
        <p className="text-xs text-slate-550 dark:text-slate-450">
          Guide your assigned interns, assign tasks, verify weekly log sheets, and issue certifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Intern Mentees List Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Users className="h-4.5 w-4.5 text-indigo-500" />
              Your Mentees List
            </h3>

            <div className="space-y-1">
              {mentees.map((m) => {
                const isActive = m._id === selectedMenteeId;
                return (
                  <button
                    key={m._id}
                    onClick={() => setSelectedMenteeId(m._id)}
                    className={`w-full text-left p-3 rounded-lg border transition duration-150 flex flex-col gap-1 cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/10' 
                        : 'bg-transparent text-slate-700 dark:text-slate-350 border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-xs truncate max-w-[130px]">{m.user?.name}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                        isActive 
                          ? 'bg-white/20 text-white border-white/20' 
                          : m.status === 'Completed' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-555/20' 
                            : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    
                    <span className={`text-[9px] font-medium block truncate ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                      Emp ID: {m.user?.employeeId || 'N/A'} • {m.department?.name || 'General'}
                    </span>

                    <div className="w-full bg-slate-200/50 dark:bg-slate-800/80 rounded-full h-1.5 mt-1.5">
                      <div
                        className={`h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-indigo-500'}`}
                        style={{ width: `${m.progress}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Mentee Details & Action Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {detailsLoading ? (
            <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]"></div>
              <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading mentee records...</p>
            </div>
          ) : selectedDetails ? (
            <>
              {/* Mentee Profile Header */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-850 dark:text-white font-heading">
                    {selectedDetails.internship?.user?.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-indigo-500">Employee ID: {selectedDetails.internship?.user?.employeeId}</span>
                    <span>Email: {selectedDetails.internship?.user?.email}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Duration: {new Date(selectedDetails.internship?.startDate).toLocaleDateString()} to {new Date(selectedDetails.internship?.endDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end justify-between gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block">Training progress</span>
                    <span className="text-xl font-black text-indigo-500">{selectedDetails.internship?.progress}%</span>
                  </div>

                  {selectedDetails.certificate ? (
                    <button
                      onClick={() => navigate(`/certificate/${selectedDetails.certificate._id}`)}
                      className="bg-emerald-500/10 text-emerald-500 border border-emerald-555/20 hover:bg-emerald-500 hover:text-white rounded-lg py-1 px-2.5 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Award className="h-3.5 w-3.5" />
                      View Certificate
                    </button>
                  ) : (
                    selectedDetails.internship?.status !== 'Completed' && (
                      <button
                        onClick={() => setIsCertModalOpen(true)}
                        className="bg-indigo-500 hover:bg-indigo-650 text-white rounded-lg py-1.5 px-3 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Award className="h-3.5 w-3.5" />
                        Generate Certificate
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Task Modules Checklist */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Assigned Training Modules / Tasks
                  </h4>
                  {selectedDetails.internship?.status !== 'Completed' && (
                    <button
                      onClick={() => setIsTaskModalOpen(true)}
                      className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white rounded-lg py-1 px-2.5 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Assign Task
                    </button>
                  )}
                </div>

                {selectedDetails.internship?.tasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-450 italic border border-dashed border-slate-150 dark:border-slate-800 rounded-lg">
                    No learning tasks assigned. Click "Assign Task" to add.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDetails.internship?.tasks.map((t) => (
                      <div
                        key={t._id}
                        className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-150 dark:border-slate-850 p-3 rounded-lg flex gap-2.5"
                      >
                        <div className="mt-0.5 shrink-0">
                          {t.status === 'Completed' ? (
                            <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                          ) : (
                            <Clock className="h-4.5 w-4.5 text-slate-350" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                              {t.description}
                            </p>
                          )}
                          <span className="text-[8px] text-slate-400 block mt-1">
                            Assigned: {new Date(t.assignedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submitted Weekly Diary / Reports & Review Form */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Weekly Activity Reports & Diary Entries
                </h4>

                {selectedDetails.reports.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-450 italic border border-dashed border-slate-150 dark:border-slate-800 rounded-lg">
                    No activity reports submitted yet by this intern.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDetails.reports.map((rep) => (
                      <div
                        key={rep._id}
                        className="border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-950/20"
                      >
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                              {rep.reportType} {rep.weekNumber ? `(Week ${rep.weekNumber})` : ''}
                            </span>
                            <h4 className="text-xs font-bold text-slate-850 dark:text-white mt-0.5">
                              {rep.title}
                            </h4>
                          </div>

                          {rep.rating ? (
                            <div className="flex items-center gap-0.5 bg-emerald-500/10 text-emerald-555 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                              <Star className="h-3.5 w-3.5 fill-emerald-500" />
                              Graded: {rep.rating}/5
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveReportToReview(rep);
                                setFeedback(rep.feedback || '');
                                setRating('5');
                              }}
                              className="bg-amber-500 text-white rounded px-2.5 py-1 text-[10px] font-bold hover:bg-amber-600 cursor-pointer shadow-xs transition"
                            >
                              Review & Grade
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-line">
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
                          <div className="bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01] border-l-2 border-indigo-555 p-2.5 rounded-r-lg text-xs space-y-1 text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-[9px] uppercase tracking-wider text-slate-450 block">Your Review Notes:</span>
                            <p className="italic">"{rep.feedback}"</p>
                          </div>
                        )}

                        {/* Grading Drawer inline if selected */}
                        {activeReportToReview?._id === rep._id && (
                          <form onSubmit={handleReviewReport} className="mt-4 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg space-y-3 text-left">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-white">Submit Report Evaluation</h5>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Review Notes / Feedback
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="e.g. Accurate reconciliation, verified all ITC ledger sheets."
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Score Rating (1-5)
                                </label>
                                <select
                                  value={rating}
                                  onChange={(e) => setRating(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                                >
                                  <option value="5">5 - Excellent</option>
                                  <option value="4">4 - Good</option>
                                  <option value="3">3 - Satisfactory</option>
                                  <option value="2">2 - Poor</option>
                                  <option value="1">1 - Action Needed</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveReportToReview(null)}
                                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-350"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={reviewLoading}
                                type="submit"
                                className="bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold hover:bg-indigo-600 transition"
                              >
                                {reviewLoading ? 'Saving...' : 'Submit Evaluation'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 p-8 shadow-xs">
              <HelpCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">Select an Intern</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose an intern from the left panel to review their dashboard checklist and activity reports.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
                Assign Learning Task
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  required
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit workbook verification"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Task Description / Learning Objectives
                </label>
                <textarea
                  rows="3"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Summarize instructions, file references, or checklists to complete..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={taskLoading}
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-650 disabled:bg-indigo-550/50 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {taskLoading ? 'Assigning...' : <><Send className="h-3.5 w-3.5" /> Assign Task</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Generation Modal */}
      {isCertModalOpen && selectedDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
                Generate Internship Certificate
              </h3>
              <button
                onClick={() => setIsCertModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateCertificate} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Intern Name
                </label>
                <input
                  disabled
                  type="text"
                  value={selectedDetails.internship?.user?.name}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Duration details *
                </label>
                <input
                  required
                  type="text"
                  value={durationText}
                  onChange={(e) => setDurationText(e.target.value)}
                  placeholder="e.g. 3 Months (March 2026 - May 2026)"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Office Issuer Name
                </label>
                <input
                  required
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Signature Authority Title
                </label>
                <input
                  required
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <span className="text-[9px] text-slate-400 block leading-relaxed bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                <strong>Important note:</strong> Issuing the certificate will mark the internship status as <strong>Completed</strong> and automatically sets the training progress metric to 100%. An email and system alert notification will be sent to the intern.
              </span>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={certLoading}
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-650 disabled:bg-emerald-500/50 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {certLoading ? 'Generating...' : <><Award className="h-4.5 w-4.5" /> Issue Certificate</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorWorkspace;
