import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Calendar,
  AlertCircle,
  TrendingUp,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

const AttendanceReport = () => {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/attendance/report', {
        params: { month },
      });
      if (response.data?.success) {
        setReport(response.data.data);
      } else {
        setError('Failed to fetch attendance report');
      }
    } catch (err) {
      console.error('Error fetching report:', err.message);
      setError(err.response?.data?.message || 'Error occurred while loading report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  // Calculate days in selected month for header columns
  const getDaysInMonth = () => {
    const [year, m] = month.split('-').map(Number);
    // Month is 1-indexed in split, so pass m (which is index of next month) with 0 to get last day of this month
    return new Date(year, m, 0).getDate();
  };

  const daysCount = getDaysInMonth();
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  const getStatusLetter = (status) => {
    switch (status) {
      case 'Present': return 'P';
      case 'Late': return 'L';
      case 'Half-Day': return 'H';
      case 'Absent': return 'A';
      default: return '-';
    }
  };

  const getStatusBgClass = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25';
      case 'Late': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25';
      case 'Half-Day': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/25';
      case 'Absent': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25';
      default: return 'text-slate-350 dark:text-slate-700 bg-transparent';
    }
  };

  const getDayStatus = (emp, day) => {
    const [year, m] = month.split('-');
    const dateKey = `${year}-${m}-${String(day).padStart(2, '0')}`;
    return emp.logs[dateKey] || '';
  };

  // Simple CSV export of monthly metrics
  const exportToCSV = () => {
    if (report.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Employee ID,Name,Presents,Lates,Half-Days,Absents\r\n';

    report.forEach((emp) => {
      csvContent += `"${emp.employeeId || ''}","${emp.name}",${emp.present},${emp.late},${emp.halfDay},${emp.absent}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReport = report.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    (emp.employeeId && emp.employeeId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              Monthly Attendance Report
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Secure spreadsheets detailing days present, lates, half-days and daily matrices.
            </p>
          </div>
        </div>

        {/* Download CSV button */}
        <button
          onClick={exportToCSV}
          disabled={report.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Download className="h-4.5 w-4.5" />
          Export CSV
        </button>
      </div>

      {/* Filter and Date selectors */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Month input */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Report Month:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {/* Spreadsheet Matrix Section */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                {/* Upper headers */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase">
                  <th className="py-3 px-4 font-bold min-w-32 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Employee Details</th>
                  <th className="py-3 px-3 font-bold text-center border-l border-slate-100 dark:border-slate-900">P</th>
                  <th className="py-3 px-3 font-bold text-center">L</th>
                  <th className="py-3 px-3 font-bold text-center">H</th>
                  <th className="py-3 px-3 font-bold text-center">A</th>
                  {daysArray.map((day) => (
                    <th
                      key={day}
                      className="py-3 px-1 border-l border-slate-100 dark:border-slate-900 text-center min-w-[24px]"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-700 dark:text-slate-350">
                {filteredReport.length === 0 ? (
                  <tr>
                    <td colSpan={5 + daysCount} className="py-12 text-center text-xs text-slate-450 font-medium">
                      No records found for the selected parameters.
                    </td>
                  </tr>
                ) : (
                  filteredReport.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all duration-150">
                      {/* Name Details */}
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-950 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="truncate max-w-28">
                          <p className="leading-tight truncate">{emp.name}</p>
                          <span className="text-[8px] text-slate-400 font-semibold uppercase">{emp.employeeId || 'No ID'}</span>
                        </div>
                      </td>

                      {/* Aggregates counts */}
                      <td className="py-3 px-3 text-center font-black text-emerald-500 border-l border-slate-100 dark:border-slate-900">
                        {emp.present}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-amber-500">
                        {emp.late}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-yellow-500">
                        {emp.halfDay}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-rose-500">
                        {emp.absent}
                      </td>

                      {/* Daily Matrix Cells */}
                      {daysArray.map((day) => {
                        const status = getDayStatus(emp, day);
                        const letter = getStatusLetter(status);
                        const bgClass = getStatusBgClass(status);

                        return (
                          <td
                            key={day}
                            className={`py-3 px-0.5 text-center font-black border-l border-slate-100 dark:border-slate-900 ${bgClass}`}
                            title={`Day ${day}: ${status || 'No entry'}`}
                          >
                            {letter}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ledger Legends */}
      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
        <span>* P = Present</span>
        <span>* L = Late Entry</span>
        <span>* H = Half-Day</span>
        <span>* A = Absent</span>
      </div>
    </div>
  );
};

export default AttendanceReport;
