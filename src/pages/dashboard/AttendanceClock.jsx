import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Clock,
  CheckCircle,
  Calendar,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Coffee,
  HelpCircle,
  LogOut,
  LogIn,
} from 'lucide-react';

const AttendanceClock = () => {
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatsAndHistory = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.get('/attendance/stats'),
        api.get('/attendance/my-history'),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (historyRes.data?.success) {
        setHistory(historyRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err.message);
      setMessage({
        text: err.response?.data?.message || 'Failed to load attendance metrics.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndHistory();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await api.post('/attendance/check-in');
      if (response.data?.success) {
        setMessage({
          text: response.data.message || 'Successfully checked in.',
          type: 'success',
        });
        await fetchStatsAndHistory();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Check-in failed.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!window.confirm('Are you sure you want to check out for today?')) {
      return;
    }
    setActionLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await api.post('/attendance/check-out');
      if (response.data?.success) {
        setMessage({
          text: response.data.message || 'Successfully checked out.',
          type: 'success',
        });
        await fetchStatsAndHistory();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Check-out failed.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (t) => {
    return t.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Helper to build Calendar Grid for current month
  const getCalendarDays = () => {
    const year = time.getFullYear();
    const month = time.getMonth(); // 0-indexed
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Starting day of the week (0 = Sunday, 1 = Monday, etc.)
    const startDay = firstDay.getDay();

    const days = [];
    
    // Fill leading empty cells for alignment
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Fill days of the month
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      // Check if we have logs for this date
      const log = history.find((h) => h.date === dateStr);
      days.push({
        dayNum: day,
        dateStr,
        log: log || null,
      });
    }

    return days;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'Late':
        return 'bg-amber-500 text-white border-amber-600';
      case 'Half-Day':
        return 'bg-yellow-400 text-slate-900 border-yellow-500';
      case 'Absent':
        return 'bg-rose-500 text-white border-rose-600';
      default:
        return 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check current check-in/out states
  const checkedIn = stats?.today?.checkIn;
  const checkedOut = stats?.today?.checkOut;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
            Clock in/out & Attendance Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log your daily entry and review your attendance log for the current month.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`flex items-center gap-2 rounded-lg p-3.5 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' 
            : 'bg-red-500/10 border border-red-500/20 text-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
          {message.text}
        </div>
      )}

      {/* Grid Layout: Left (Live Clock Card), Right (History and stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Clock Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
          
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
              Shift Clock
            </h3>
            <p className="text-xs text-slate-400 font-semibold">{formatDate(time)}</p>
          </div>

          <div className="flex flex-col items-center py-6">
            <div className="text-4xl font-black text-slate-850 dark:text-white font-heading tracking-tight select-none">
              {formatTime(time)}
            </div>
            
            {/* Today status badge */}
            {stats?.today && (
              <span className={`mt-4 rounded-full px-3 py-1 text-xs font-bold border uppercase ${
                stats.today.status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                stats.today.status === 'Late' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                stats.today.status === 'Half-Day' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                'bg-rose-500/10 border-rose-500/20 text-rose-500'
              }`}>
                Today: {stats.today.status} {stats.today.lateTime > 0 && `(Late ${stats.today.lateTime} min)`}
              </span>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-3">
            {!checkedIn ? (
              <button
                disabled={actionLoading}
                onClick={handleCheckIn}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 shadow-lg shadow-indigo-500/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
              >
                <LogIn className="h-5 w-5" />
                Check In
              </button>
            ) : !checkedOut ? (
              <button
                disabled={actionLoading}
                onClick={handleCheckOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 shadow-lg shadow-amber-500/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
              >
                <LogOut className="h-5 w-5" />
                Check Out
              </button>
            ) : (
              <div className="w-full text-center py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl text-slate-500 uppercase tracking-wide">
                Done for today
              </div>
            )}

            {/* Time stamps details */}
            {checkedIn && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-900 grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 block mb-0.5">Checked In</span>
                  <span className="text-slate-700 dark:text-slate-200">
                    {new Date(stats.today.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Checked Out</span>
                  <span className="text-slate-700 dark:text-slate-200">
                    {checkedOut
                      ? new Date(stats.today.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Card 1: Attendance percentage */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Attendance Rate</p>
              <p className="text-2xl font-black text-slate-850 dark:text-white font-heading mt-2">
                {loading ? '--' : `${stats?.attendancePercentage || 0}%`}
              </p>
              <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs font-semibold">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                <span>Presents & Lates count</span>
              </div>
            </div>

            {/* Card 2: Total working days */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Days Tracked</p>
              <p className="text-2xl font-black text-slate-850 dark:text-white font-heading mt-2">
                {loading ? '--' : stats?.totalWorkingDays || 0} days
              </p>
              <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs font-semibold">
                <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                <span>Total logs active</span>
              </div>
            </div>

            {/* Card 3: Leave balance */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Leave Balance</p>
              <p className="text-2xl font-black text-slate-850 dark:text-white font-heading mt-2">
                {loading ? '--' : stats?.leaveBalance || 0} days
              </p>
              <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs font-semibold">
                <Coffee className="h-3.5 w-3.5 text-indigo-500" />
                <span>Available yearly quota</span>
              </div>
            </div>

          </div>

          {/* Attendance Office Rules Alert Card */}
          <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/[0.02] p-4 flex gap-3 text-xs text-indigo-700 dark:text-indigo-400">
            <HelpCircle className="h-5 w-5 shrink-0 text-indigo-500" />
            <div className="space-y-1">
              <p className="font-bold">CA Office Attendance Rules</p>
              <ul className="list-disc list-inside space-y-1 font-semibold text-slate-500 dark:text-slate-400">
                <li>Check-in threshold is <span className="text-indigo-500 font-bold">09:45 AM</span>. Entries later than this are flagged as <span className="text-amber-500 font-bold">Late</span>.</li>
                <li>Check-out threshold is <span className="text-indigo-500 font-bold">06:30 PM</span>. Early checkout will register as a <span className="text-yellow-500 font-bold">Half-Day</span>.</li>
                <li>Net work hours must exceed <span className="text-indigo-500 font-bold">4.0 hours</span>. Otherwise, it logs as a <span className="text-yellow-500 font-bold">Half-Day</span>.</li>
                <li>A 1-hour lunch break is automatically deducted from active work hours on check-out.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Calendar Grid Section */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {time.toLocaleString('en-US', { month: 'long', year: 'numeric' })} Attendance Calendar
            </h3>
          </div>
          
          {/* Status Legends */}
          <div className="flex flex-wrap gap-3.5 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Present</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Late Entry</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-400" />Half-Day</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Absent</span>
          </div>
        </div>

        {/* Days of week titles */}
        <div className="grid grid-cols-7 gap-2.5 mb-2.5 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          {weekDays.map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Grid Cells */}
        {loading ? (
          <div className="h-64 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-lg"></div>
        ) : (
          <div className="grid grid-cols-7 gap-2.5">
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 dark:bg-slate-900/10 rounded-lg" />;
              }

              const statusColor = cell.log ? getStatusColor(cell.log.status) : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-400';
              return (
                <div
                  key={cell.dateStr}
                  className={`aspect-square rounded-xl p-2 flex flex-col justify-between border cursor-default select-none hover:shadow-sm transition-all ${statusColor}`}
                  title={cell.log ? `${cell.log.status} - Logged: ${cell.log.workHours || 0}h` : 'No Entry'}
                >
                  <span className="text-[10px] font-black">{cell.dayNum}</span>
                  {cell.log && (
                    <div className="text-[9px] font-bold text-right leading-none shrink-0 truncate max-w-full">
                      {cell.log.workHours > 0 ? `${cell.log.workHours}h` : cell.log.status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default AttendanceClock;
