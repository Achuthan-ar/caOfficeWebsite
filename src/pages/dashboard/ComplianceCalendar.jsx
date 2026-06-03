import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
} from 'lucide-react';

const ComplianceCalendar = () => {
  const { user } = useAuthStore();
  const canModify = ['Admin', 'Manager'].includes(user?.role?.name);

  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('monthly'); // 'daily', 'weekly', 'monthly'

  // Modal fields
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GSTR-1');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState('#f59e0b');
  const [submitting, setSubmitting] = useState(false);

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());

  const categories = [
    { name: 'GSTR-1', color: '#f59e0b', desc: 'Monthly GST outward supplies' },
    { name: 'GSTR-3B', color: '#10b981', desc: 'Monthly GST summary return' },
    { name: 'TDS Returns', color: '#3b82f6', desc: 'Quarterly TDS deposits/filings' },
    { name: 'Income Tax Filing', color: '#ef4444', desc: 'ITR filings (Individual/Corporate)' },
    { name: 'ROC Filing', color: '#8b5cf6', desc: 'Annual registrar filing' },
    { name: 'Audit Deadlines', color: '#ec4899', desc: 'Audit report certifications' },
  ];

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/compliance');
      if (response.data?.success) {
        setDeadlines(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching compliance dates:', err);
      setError('Failed to fetch compliance calendar events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    if (!title || !dueDate) {
      setError('Please enter a title and select a due date.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Find category default color if not customized
      const matchedCat = categories.find(c => c.name === category);
      const activeColor = matchedCat ? matchedCat.color : colorCode;

      const response = await api.post('/compliance', {
        title,
        category,
        dueDate,
        description,
        colorCode: activeColor,
      });

      if (response.data?.success) {
        setSuccess('Statutory deadline logged successfully!');
        setTitle('');
        setDueDate('');
        setDescription('');
        fetchDeadlines();
        setTimeout(() => {
          setIsAddOpen(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error adding compliance event:', err);
      setError(err.response?.data?.message || 'Failed to log deadline.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Month Grid helper
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const numDays = new Date(year, month + 1, 0).getDate(); // Total days
    return { firstDay, numDays };
  };

  const { firstDay, numDays } = getDaysInMonth(currentDate);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Find events for a specific calendar date (helper)
  const getEventsForDate = (dayNum) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return deadlines.filter((d) => {
      const eDate = new Date(d.dueDate);
      return eDate.getFullYear() === year &&
             eDate.getMonth() === month &&
             eDate.getDate() === dayNum;
    });
  };

  // Get current month string name
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Statutory Compliance Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track GSTR filings, TDS submissions, corporate ROC accounts, and audit sign-off deadlines.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-850 p-1 bg-white dark:bg-slate-950 text-xs font-bold text-slate-500">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${viewMode === 'monthly' ? 'bg-indigo-500 text-white' : 'hover:text-slate-850 dark:hover:text-white'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${viewMode === 'weekly' ? 'bg-indigo-500 text-white' : 'hover:text-slate-850 dark:hover:text-white'}`}
            >
              Schedule List
            </button>
          </div>
          {canModify && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Deadline
            </button>
          )}
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

      {/* Categories Guide / Color Coding Ledger */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs select-none">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2 p-2 border border-slate-100 dark:border-slate-900 rounded-lg">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">{cat.name}</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-450">Loading compliance scheduler...</div>
      ) : (
        <>
          {/* 1. MONTHLY GRID VIEW */}
          {viewMode === 'monthly' && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
              {/* Calendar controls */}
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm">
                  {monthName}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer text-slate-500 dark:text-slate-400"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer text-slate-500 dark:text-slate-400"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Grid layout */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900 pb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {/* empty tracks for offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`offset-${i}`} className="min-h-[85px] bg-slate-50/[0.3] dark:bg-slate-900/[0.1] rounded-lg" />
                ))}

                {/* Day Blocks */}
                {Array.from({ length: numDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayEvents = getEventsForDate(dayNum);
                  const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum).toDateString();
                  
                  return (
                    <div
                      key={dayNum}
                      className={`min-h-[85px] border p-2 rounded-lg text-left flex flex-col justify-between transition group hover:border-indigo-500/40 ${
                        isToday
                          ? 'border-indigo-500 bg-indigo-500/[0.02]'
                          : 'border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-950'
                      }`}
                    >
                      <span className={`text-[10px] font-black ${isToday ? 'text-indigo-500 font-extrabold' : 'text-slate-400'}`}>
                        {dayNum}
                      </span>
                      <div className="flex-1 flex flex-col gap-1 mt-1 justify-end">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt._id}
                            style={{ borderLeftColor: evt.colorCode }}
                            className="text-[8px] pl-1 border-l-2 py-0.5 truncate font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                            title={`${evt.title} - ${evt.description || ''}`}
                          >
                            {evt.category}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SCHEDULE LIST VIEW */}
          {viewMode === 'weekly' && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading mb-4">
                Statutory Filings Schedule
              </h3>
              <hr className="border-slate-100 dark:border-slate-900 mb-4" />

              {deadlines.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-455">No deadlines logged in the system.</div>
              ) : (
                <div className="space-y-4">
                  {deadlines.map((evt) => {
                    const daysRemaining = Math.ceil((new Date(evt.dueDate) - new Date()) / (1000 * 3600 * 24));
                    const isOverdue = daysRemaining < 0;

                    return (
                      <div key={evt._id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 text-xs">
                        <span className="h-3 w-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: evt.colorCode }} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">{evt.title}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{evt.description || 'No additional specifications provided.'}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-450 font-semibold pt-1">
                            <span className="font-bold uppercase text-indigo-500">{evt.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Due: {new Date(evt.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 select-none ${
                          isOverdue 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {isOverdue ? 'Overdue' : `${daysRemaining} days left`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Log Compliance Deadline Modal (Admin/Manager only) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Log Statutory Deadline
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddDeadline} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Filing Title</label>
                <input
                  type="text"
                  placeholder="e.g. GSTR-1 May Outward Return"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Description / Notes</label>
                <textarea
                  placeholder="Describe standard verification checklist, reference forms, or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Logging Deadline...' : 'Add Deadline to Calendar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceCalendar;
