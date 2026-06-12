import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, Search, Mail, Phone, Calendar, 
  ExternalLink, CheckCircle, XCircle, UserPlus
} from 'lucide-react';

const ApplicationReviews = () => {
  const [applications, setApplications] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering and Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected applicant detail modal
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Status update modal / form states
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Load applications and dependencies
  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, employeesRes, deptsRes] = await Promise.all([
        api.get('/careers/applications'),
        api.get('/employees'),
        api.get('/departments')
      ]);

      if (appsRes.data?.success) {
        setApplications(appsRes.data.data);
      }
      
      if (employeesRes.data?.success) {
        // Mentors should be Managers, Employees, or CA Logins
        const potentialMentors = employeesRes.data.data.filter(emp => 
          ['Manager', 'Employee', 'CA Login'].includes(emp.role?.name)
        );
        setMentors(potentialMentors);
      }

      if (deptsRes.data?.success) {
        setDepartments(deptsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching application reviews data:', err);
      setError('Failed to load application registry details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openUpdateModal = (app, targetStatus) => {
    setSelectedApp(app);
    setStatusToUpdate(targetStatus);
    setRemarks(app.remarks || '');
    setInterviewDate(app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0, 16) : '');
    setSelectedMentor('');
    setSelectedDept(app.job?.department || '');
    setUpdateError('');
    setIsUpdateModalOpen(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError('');

    // Validation
    if (statusToUpdate === 'Interview Scheduled' && !interviewDate) {
      setUpdateError('Please schedule an interview date and time.');
      setUpdateLoading(false);
      return;
    }
    if (statusToUpdate === 'Approved' && !selectedMentor) {
      setUpdateError('Please allocate a Mentor (Manager or Employee) for this internship.');
      setUpdateLoading(false);
      return;
    }

    try {
      const payload = {
        status: statusToUpdate,
        remarks,
        interviewDate: statusToUpdate === 'Interview Scheduled' ? interviewDate : undefined,
        mentorId: statusToUpdate === 'Approved' ? selectedMentor : undefined,
        departmentId: statusToUpdate === 'Approved' ? selectedDept : undefined
      };

      const res = await api.put(`/careers/applications/${selectedApp._id}/status`, payload);
      
      if (res.data?.success) {
        // Refresh local data
        await fetchData();
        setIsUpdateModalOpen(false);
        setSelectedApp(null);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update applicant status.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (app.job?.title && app.job.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? app.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Under Review': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Shortlisted': return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'Interview Scheduled': return 'bg-indigo-500/10 text-indigo-500 border border-indigo-555/20';
      case 'Approved': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-heading">
            Candidate Application Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review candidate resumes, schedule interviews, and approve intern onboarding.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Approved">Approved / Promoted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading applications...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-550 rounded-xl p-6 text-center text-xs font-bold">
          {error}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 p-8 shadow-xs">
          <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">No Applications Found</h3>
          <p className="text-xs text-slate-550 dark:text-slate-455 mt-1">
            No candidates match the selected filters or search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app._id}
              className={`bg-white dark:bg-slate-950 border rounded-xl p-5 shadow-xs transition-all duration-200 flex flex-col lg:flex-row justify-between gap-6 hover:border-indigo-500/20 ${
                selectedApp?._id === app._id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-850'
              }`}
            >
              {/* Left Column: Basic Info */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
                    {app.name}
                  </h3>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${getStatusBadgeClass(app.status)}`}>
                    {app.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-500">{app.job?.title || 'Unknown Position'}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phone}</span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-350 space-y-1 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-900/50">
                  {app.collegeName && <p><strong>College:</strong> {app.collegeName}</p>}
                  {app.experience && <p><strong>Prior Exp:</strong> {app.experience}</p>}
                  {app.skills && app.skills.length > 0 && (
                    <p>
                      <strong>Skills:</strong>{' '}
                      <span className="inline-flex flex-wrap gap-1 mt-0.5">
                        {app.skills.map((s, idx) => (
                          <span key={idx} className="bg-slate-200/55 dark:bg-slate-800 border border-slate-300/30 text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.2 text-[9px] font-medium">
                            {s}
                          </span>
                        ))}
                      </span>
                    </p>
                  )}
                  {app.coverLetter && (
                    <p className="mt-1 text-slate-500 dark:text-slate-400 italic">
                      "{(app.coverLetter.length > 140) ? `${app.coverLetter.slice(0, 140)}...` : app.coverLetter}"
                    </p>
                  )}
                </div>

                {app.interviewDate && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                    <Calendar className="h-4 w-4" />
                    Interview: {new Date(app.interviewDate).toLocaleString()}
                  </div>
                )}

                {app.remarks && (
                  <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                    <strong>Review remarks:</strong> "{app.remarks}"
                  </div>
                )}
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-col justify-between items-end gap-4 lg:w-48 shrink-0">
                <a
                  href={app.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Resume
                </a>

                {/* State Toggles */}
                {app.status !== 'Approved' && app.status !== 'Rejected' && (
                  <div className="w-full grid grid-cols-1 gap-1.5">
                    {app.status === 'Applied' && (
                      <button
                        onClick={() => openUpdateModal(app, 'Under Review')}
                        className="w-full text-center bg-indigo-500 text-white rounded-lg py-1.5 text-[10px] font-bold hover:bg-indigo-600 transition cursor-pointer shadow-xs"
                      >
                        Begin Review
                      </button>
                    )}
                    {['Applied', 'Under Review'].includes(app.status) && (
                      <button
                        onClick={() => openUpdateModal(app, 'Shortlisted')}
                        className="w-full text-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg py-1.5 text-[10px] font-bold hover:bg-indigo-500 hover:text-white transition cursor-pointer"
                      >
                        Shortlist Profile
                      </button>
                    )}
                    {['Under Review', 'Shortlisted'].includes(app.status) && (
                      <button
                        onClick={() => openUpdateModal(app, 'Interview Scheduled')}
                        className="w-full text-center bg-indigo-500 text-white rounded-lg py-1.5 text-[10px] font-bold hover:bg-indigo-650 transition cursor-pointer"
                      >
                        Schedule Interview
                      </button>
                    )}
                    {['Shortlisted', 'Interview Scheduled'].includes(app.status) && (
                      <button
                        onClick={() => openUpdateModal(app, 'Approved')}
                        className="w-full text-center bg-emerald-500 text-white rounded-lg py-1.5 text-[10px] font-bold hover:bg-emerald-650 transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <UserPlus className="h-3 w-3" /> Approve Intern
                      </button>
                    )}
                    <button
                      onClick={() => openUpdateModal(app, 'Rejected')}
                      className="w-full text-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg py-1.5 text-[10px] font-bold hover:bg-red-500 hover:text-white transition cursor-pointer"
                    >
                      Reject Profile
                    </button>
                  </div>
                )}

                {app.status === 'Approved' && (
                  <div className="w-full text-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Promoted to Intern
                  </div>
                )}
                
                {app.status === 'Rejected' && (
                  <div className="w-full text-center bg-red-500/10 text-red-500 border border-red-550/20 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Rejected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Candidate Status Overlay Modal */}
      {isUpdateModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
                Update Status to: <span className="text-indigo-500 font-extrabold">{statusToUpdate}</span>
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              {updateError && (
                <div className="bg-red-500/10 border border-red-550/25 text-red-500 rounded-xl p-3 text-xs font-semibold">
                  {updateError}
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-xs space-y-1">
                <p><strong>Candidate:</strong> {selectedApp.name}</p>
                <p><strong>Applying For:</strong> {selectedApp.job?.title}</p>
              </div>

              {/* Status Specific Fields */}
              {statusToUpdate === 'Interview Scheduled' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Interview Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              )}

              {statusToUpdate === 'Approved' && (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Assign Mentor (Manager / Coach) *
                    </label>
                    <select
                      required
                      value={selectedMentor}
                      onChange={(e) => setSelectedMentor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Mentor...</option>
                      {mentors.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.role?.name} - {m.department?.name || 'General'})
                        </option>
                      ))}
                    </select>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Approved candidates are promoted to User Accounts with the 'Intern' role and allocated to this Mentor.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Department Allocation
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Review Remarks / Internal Notes
                </label>
                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter comments, interview instructions, or rejection reasons..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={updateLoading}
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-650 disabled:bg-indigo-550/50 text-white rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {updateLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationReviews;
