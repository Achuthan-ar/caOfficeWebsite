import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  FileText, Download, Printer, Plus, Calendar, 
  TrendingUp, BarChart2, RefreshCw, X
} from 'lucide-react';

const MonthlyReports = () => {
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generate Report Form States
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genEmployee, setGenEmployee] = useState('');
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-05"
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');

  // Filtering states
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterEmployee, setFilterEmployee] = useState('');

  const isHR = ['Admin', 'Manager'].includes(user?.role?.name);
  const isTL = user?.role?.name === 'TL';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterEmployee) params.employeeId = filterEmployee;

      // Promise queries
      const queries = [api.get('/reports', { params })];

      if (isHR) {
        queries.push(api.get('/employees'));
      }
      if (isHR || isTL) {
        queries.push(api.get(`/reports/teams?month=${filterMonth || new Date().toISOString().slice(0, 7)}`));
      }

      const results = await Promise.all(queries);
      
      if (results[0].data?.success) {
        setReports(results[0].data.data);
      }

      if (isHR && results[1]?.data?.success) {
        setEmployees(results[1].data.data);
      }

      // Map team comparative stats
      const teamIdx = isHR ? 2 : 1;
      if ((isHR || isTL) && results[teamIdx]?.data?.success) {
        setTeamStats(results[teamIdx].data.data);
      }

    } catch (err) {
      console.error('Error fetching monthly reports metrics:', err);
      setError('Failed to load monthly performance records.');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterEmployee, isHR, isTL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError('');

    if (!genEmployee || !genMonth) {
      setGenError('Please select an employee and target month.');
      setGenLoading(false);
      return;
    }

    try {
      const res = await api.post('/reports/generate', {
        employeeId: genEmployee,
        month: genMonth
      });

      if (res.data?.success) {
        setIsGenModalOpen(false);
        setGenEmployee('');
        // Reload reports
        await fetchData();
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setGenError(err.response?.data?.message || 'Failed to execute report calculations.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleCSVExport = () => {
    if (reports.length === 0) return;
    
    // Build CSV Headers
    const headers = ['Month', 'Employee Name', 'Emp ID', 'Department', 'Presents', 'Absents', 'Lates', 'Completed Tasks', 'Pending Tasks', 'Prod Score', 'Perf Score', 'Remarks'];
    
    // Map records to CSV rows
    const rows = reports.map(r => [
      r.month,
      r.employee?.name || 'N/A',
      r.employee?.employeeId || 'N/A',
      r.employee?.department?.name || 'General',
      r.presentDays,
      r.absentDays,
      r.lateDays,
      r.completedTasks,
      r.pendingTasks,
      r.productivityScore,
      r.performanceScore,
      `"${r.remarks || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CA_Office_Performance_Worksheet_${filterMonth || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar - hidden in print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-heading">
            Staff Work & Performance Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor attendance stats, task completions, and department comparative productivity analytics.
          </p>
        </div>

        <div className="flex gap-2">
          {reports.length > 0 && (
            <>
              <button
                onClick={handleCSVExport}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>

              <button
                onClick={handlePrint}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Reports
              </button>
            </>
          )}

          {isHR && (
            <button
              onClick={() => {
                setGenError('');
                setIsGenModalOpen(true);
              }}
              className="bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl py-2 px-4 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
            >
              <Plus className="h-4.5 w-4.5" />
              Generate Report
            </button>
          )}
        </div>
      </div>

      {/* Filter and Selection Panel - hidden in print */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
        <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          {/* Month filter selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Employee filter selector (HR only) */}
          {isHR && (
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={fetchData}
          className="text-indigo-500 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Registry
        </button>
      </div>

      {/* Analytics Visualization Grid - hidden in print */}
      {(isHR || isTL) && teamStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          {/* Chart: Comparative Department Averages */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="h-4.5 w-4.5 text-indigo-500" />
              Department Comparative Index (Performance vs. Productivity)
            </h3>

            <div className="space-y-4 pt-2">
              {teamStats.map((stat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{stat.departmentName}</span>
                    <span className="text-[10px] text-slate-450 font-bold">
                      Perf: {stat.avgPerformance}% • Prod: {stat.avgProductivity}% ({stat.employeeCount} staff)
                    </span>
                  </div>
                  {/* Performance indicator bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stat.avgPerformance}%` }}
                    ></div>
                  </div>
                  {/* Productivity indicator bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1">
                    <div
                      className="bg-emerald-400 h-1 rounded-full transition-all duration-500"
                      style={{ width: `${stat.avgProductivity}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats: Company Top Metrics Summary */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                Monthly Analytics Insights ({filterMonth})
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                Comparative metrics represent the weighted aggregate of task board completion velocities and daily attendance rosters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-900 rounded-lg">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Average Performance</span>
                <span className="text-xl font-black text-indigo-500">
                  {reports.length > 0 ? Math.round(reports.reduce((acc, r) => acc + r.performanceScore, 0) / reports.length) : 0}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-900 rounded-lg">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Average Productivity</span>
                <span className="text-xl font-black text-emerald-500">
                  {reports.length > 0 ? Math.round(reports.reduce((acc, r) => acc + r.productivityScore, 0) / reports.length) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Reports Table/Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading report metrics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-550/20 text-red-500 rounded-xl p-6 text-center text-xs font-bold">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 p-8 shadow-xs">
          <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">No Monthly Reports Logged</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No report snapshots generated for the selected parameters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-850 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold uppercase tracking-wider text-slate-500 text-[10px] select-none">
                <tr>
                  <th className="px-5 py-3.5">Month</th>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5 text-center">Attendance (P/L/A)</th>
                  <th className="px-5 py-3.5 text-center">Tasks (Comp/Pend)</th>
                  <th className="px-5 py-3.5 text-center">Productivity</th>
                  <th className="px-5 py-3.5 text-center">Performance</th>
                  <th className="px-5 py-3.5 print:hidden">Remarks / Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-250 whitespace-nowrap">{report.month}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-800 dark:text-white">{report.employee?.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">ID: {report.employee?.employeeId}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{report.employee?.department?.name || 'General'}</td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="font-bold text-emerald-500">{report.presentDays}d</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span className="font-bold text-amber-500">{report.lateDays}l</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span className="font-bold text-red-500">{report.absentDays}a</span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="font-bold text-indigo-500">{report.completedTasks}</span>
                      <span className="text-slate-350 mx-1">/</span>
                      <span className="text-slate-400 font-semibold">{report.pendingTasks}</span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center font-black rounded-lg bg-emerald-500/10 text-emerald-555 border border-emerald-500/20 px-2 py-0.5 min-w-[45px]">
                        {report.productivityScore}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center font-black rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-555/20 px-2 py-0.5 min-w-[45px]">
                        {report.performanceScore}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 italic max-w-xs truncate print:hidden">
                      {report.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Report Modal overlay */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-855 dark:text-white font-heading">
                Generate Monthly Performance Report
              </h3>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4 text-left">
              {genError && (
                <div className="bg-red-500/10 border border-red-550/25 text-red-555 rounded-xl p-3 text-xs font-semibold">
                  {genError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Employee *
                </label>
                <select
                  required
                  value={genEmployee}
                  onChange={(e) => setGenEmployee(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId} - {emp.role?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Month *
                </label>
                <input
                  required
                  type="month"
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={genLoading}
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-650 disabled:bg-indigo-550/50 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {genLoading ? 'Calculating...' : <><RefreshCw className="h-3.5 w-3.5" /> Compile & Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReports;
