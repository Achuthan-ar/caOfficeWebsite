import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Briefcase, MapPin, Award, CheckCircle, FileUp, Send, Search, Filter, X, Phone, BookOpen, Layers } from 'lucide-react';

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Form State
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume: '',
    coverLetter: '',
    collegeName: '',
    skills: '',
    experience: ''
  });

  // Fetch jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/careers/jobs');
        if (res.data?.success) {
          setJobs(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load career listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openApplyModal = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
    setFormError('');
    setApplied(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormError('');
    try {
      const res = await api.post('/careers/apply', {
        jobId: selectedJob._id,
        ...formData
      });
      if (res.data?.success) {
        setApplied(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          resume: '',
          coverLetter: '',
          collegeName: '',
          skills: '',
          experience: ''
        });
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setFormError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter listings
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.skills && job.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesType = typeFilter ? job.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 transition-colors duration-300">
      {/* Title */}
      <section className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
          Join CA Office Advisory
        </h2>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Unlock your potential in audit, corporate compliance, and taxation. We train ICAI article assistants and recruit senior tax specialists. Explore openings below.
        </p>
        <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full"></div>
      </section>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-md border border-slate-200 dark:border-slate-850 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles, descriptions, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Type */}
        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Part-time">Part-time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Career Listings Section */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading careers...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-550/20 text-red-500 rounded-2xl p-6 text-center">
          {error}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 p-8">
          <Briefcase className="h-12 w-12 text-slate-350 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">No Active Openings Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Try adjusting your search criteria or checking back later for new opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-555/10 px-2.5 py-0.5 text-xs font-semibold">
                      {job.type}
                    </span>
                    <h3 className="text-xl font-bold text-slate-850 dark:text-white font-heading mt-2">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Department: {job.department?.name || 'General Operations'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-900/50">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-rose-400" />{job.location}</span>
                  {job.salaryRange && (
                    <span className="flex items-center gap-1"><Award className="h-4 w-4 text-emerald-400" />{job.salaryRange}</span>
                  )}
                </div>

                <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
                  {job.description}
                </p>

                {job.requirements && job.requirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Requirements:</h4>
                    <ul className="text-xs text-slate-550 dark:text-slate-450 space-y-1 pl-4 list-disc">
                      {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.skills && job.skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-left">Key Skills:</h4>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded px-2 py-0.5 text-[10px] font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-900">
                <button
                  onClick={() => openApplyModal(job)}
                  className="w-full bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-indigo-650 shadow-md shadow-indigo-500/10 transition duration-200 cursor-pointer"
                >
                  Apply Online
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Online Application Modal Form Overlay */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-800/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Submit Application</span>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white font-heading mt-0.5">
                  {selectedJob.title}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {applied ? (
              <div className="text-center py-10 space-y-4">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading">Application Received!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Thank you for applying. A confirmation email has been sent to you. Our operations team will review your credentials and get back to you shortly.
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-6 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4 text-left">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Rahul Mehta"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="rahul.mehta@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> College / University
                    </label>
                    <input
                      type="text"
                      name="collegeName"
                      value={formData.collegeName}
                      onChange={handleInputChange}
                      placeholder="HR College of Commerce"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileUp className="h-3 w-3" /> Resume Link (Google Drive/Dropbox URL) *
                  </label>
                  <input
                    required
                    type="url"
                    name="resume"
                    value={formData.resume}
                    onChange={handleInputChange}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Skills (Comma separated)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="Audit, GST, MS Excel, Tally"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Prior Experience (e.g. CA Inter / Fresher / 1 Year)
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="CA Inter cleared / Fresher"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Tell us briefly why you would like to join our CA firm..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={submitLoading}
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-650 disabled:bg-indigo-550/50 text-white rounded-xl py-2.5 text-xs font-bold transition duration-200 cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    {submitLoading ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-middle"></span>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Job Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Careers;
