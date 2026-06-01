import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Activity,
  HardDrive,
  Server,
  TrendingUp,
  FolderKanban,
  Clock,
  AlertCircle,
  Clock4,
  Award,
  BookOpen,
  Bell,
  Receipt,
  RotateCw,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const roleName = user?.role?.name;
      const roleLower = roleName?.toLowerCase();
      
      const dashboardPromise = api.get(`/dashboard/${roleLower}`);
      let attendancePromise = Promise.resolve(null);

      if (roleName === 'Admin' || roleName === 'Manager') {
        attendancePromise = api.get('/attendance/analytics');
      } else if (roleName === 'TL' || roleName === 'Employee' || roleName === 'Intern') {
        attendancePromise = api.get('/attendance/stats');
      }

      const [dbRes, attRes] = await Promise.all([dashboardPromise, attendancePromise]);

      if (dbRes.data?.success) {
        setDashboardData(dbRes.data.data);
      } else {
        setError('Failed to fetch dashboard data');
      }

      if (attRes && attRes.data?.success) {
        setAttendanceData(attRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err.message);
      setError(err.response?.data?.message || 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role?.name) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-14 w-14 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
          Oops! Error Loading Dashboard
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          {error}
        </p>
        <button
          onClick={fetchDashboardData}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition duration-150 shadow-lg shadow-indigo-500/15 cursor-pointer"
        >
          <RotateCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const roleName = user?.role?.name;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Role: <span className="font-semibold text-indigo-500">{roleName}</span> | CA Office ERP System
          </p>
        </div>
        <div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Render Dynamic Dashboard based on user role */}
      {roleName === 'Admin' && <AdminDashboard data={dashboardData} attendanceData={attendanceData} />}
      {roleName === 'Manager' && <ManagerDashboard data={dashboardData} attendanceData={attendanceData} />}
      {roleName === 'TL' && <TLDashboard data={dashboardData} attendanceData={attendanceData} />}
      {roleName === 'Employee' && <EmployeeDashboard data={dashboardData} attendanceData={attendanceData} />}
      {roleName === 'Intern' && <InternDashboard data={dashboardData} attendanceData={attendanceData} />}
      {roleName === 'Client' && <ClientDashboard data={dashboardData} />}
    </div>
  );
};

/* ============================================================================
   ADMIN DASHBOARD WIDGET
   ============================================================================ */
const AdminDashboard = ({ data, attendanceData }) => {
  const stats = [
    { title: 'System Status', value: data?.systemStatus || 'Healthy', icon: Server, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Active Sessions', value: data?.activeSessions || 0, icon: Activity, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Database Size', value: data?.dbSize || '0 MB', icon: HardDrive, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  ];

  const maxPresent = attendanceData?.weeklyTrend 
    ? Math.max(...attendanceData.weeklyTrend.map(t => t.Present), 1) 
    : 1;

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 font-heading">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg border ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Attendance Overview metrics */}
      {attendanceData && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
            Daily Team Attendance Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/[0.3] dark:bg-slate-900/[0.2] text-center">
              <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">Total Staff</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">{attendanceData.summary?.totalStaff || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-center">
              <span className="text-[10px] font-bold text-emerald-500 block uppercase tracking-wider">Present Today</span>
              <span className="text-xl font-black text-emerald-500 mt-1 block">{attendanceData.summary?.present || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] text-center">
              <span className="text-[10px] font-bold text-amber-500 block uppercase tracking-wider">Late Entry Today</span>
              <span className="text-xl font-black text-amber-500 mt-1 block">{attendanceData.summary?.late || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.02] text-center">
              <span className="text-[10px] font-bold text-rose-500 block uppercase tracking-wider">Absent Today</span>
              <span className="text-xl font-black text-rose-500 mt-1 block">{attendanceData.summary?.absent || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Attendance charts & Absent list */}
      {attendanceData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
              7-Day Staff Attendance Trend
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />
            
            {/* SVG custom Bar Chart */}
            <div className="w-full pt-4">
              <svg className="w-full h-40" viewBox="0 0 400 150">
                {attendanceData.weeklyTrend?.map((t, idx) => {
                  const height = (t.Present / maxPresent) * 100 || 5;
                  const x = 30 + idx * 52;
                  const y = 120 - height;
                  return (
                    <g key={idx}>
                      {/* background track */}
                      <rect x={x} y="20" width="22" height="100" className="fill-slate-50 dark:fill-slate-900/50" rx="3" />
                      {/* active bar */}
                      <rect
                        x={x}
                        y={y}
                        width="22"
                        height={height}
                        fill="url(#indigoGrad)"
                        rx="3"
                        className="transition-all duration-500 hover:opacity-85"
                      />
                      {/* dates */}
                      <text x={x + 11} y="138" textAnchor="middle" className="text-[9px] fill-slate-400 font-bold">{t.date}</text>
                      {/* value */}
                      <text x={x + 11} y={y - 4} textAnchor="middle" className="text-[9px] fill-slate-700 dark:fill-slate-300 font-black">{t.Present}</text>
                    </g>
                  );
                })}
                <defs>
                  <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Absent list */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-rose-500 font-heading">
              Absents Today ({attendanceData.absentEmployees?.length || 0})
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {attendanceData.absentEmployees?.length === 0 ? (
                <p className="text-xs text-slate-450 italic text-center py-6">All staff present today!</p>
              ) : (
                attendanceData.absentEmployees?.map((emp) => (
                  <div key={emp._id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border border-rose-500/10 bg-rose-500/[0.02]">
                    <span className="font-bold text-slate-700 dark:text-slate-350 truncate mr-2">{emp.name}</span>
                    <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider">{emp.employeeId || 'Staff'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Late list & Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Late list */}
        {attendanceData && (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-amber-500 font-heading">
              Late Check-ins Today ({attendanceData.lateEmployees?.length || 0})
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {attendanceData.lateEmployees?.length === 0 ? (
                <p className="text-xs text-slate-450 italic text-center py-6">No late check-ins logged today.</p>
              ) : (
                attendanceData.lateEmployees?.map((emp) => (
                  <div key={emp._id} className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/[0.02] text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-750 dark:text-slate-200 truncate">{emp.name}</span>
                      <span className="text-[9px] font-bold text-amber-500 uppercase">{emp.employeeId}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                      <span>In: {new Date(emp.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black">Late: {emp.lateTime}m</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Audit Logs Table */}
        <div className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm ${attendanceData ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading mb-4">
            Security Audit Logs (Mock Activity)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 font-bold uppercase">Time</th>
                  <th className="py-2.5 font-bold uppercase">User</th>
                  <th className="py-2.5 font-bold uppercase">Action</th>
                  <th className="py-2.5 font-bold uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                {data?.recentLogs?.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3 font-medium text-slate-400">{log.time}</td>
                    <td className="py-3 font-semibold">{log.user}</td>
                    <td className="py-3">{log.action}</td>
                    <td className="py-3 text-right">
                      <span className="inline-block rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold">
                        Success
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ============================================================================
   MANAGER DASHBOARD WIDGET
   ============================================================================ */
const ManagerDashboard = ({ data, attendanceData }) => {
  const stats = [
    { title: 'Active Projects', value: data?.activeProjects || 0, icon: FolderKanban, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Budget Utilized', value: data?.budgetUtilized || '0%', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Impending Deadlines', value: data?.deadlinesImpending || 0, icon: Clock, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  ];

  const maxPresent = attendanceData?.weeklyTrend 
    ? Math.max(...attendanceData.weeklyTrend.map(t => t.Present), 1) 
    : 1;

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 font-heading">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg border ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Attendance metrics */}
      {attendanceData && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
            Daily Team Attendance Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/[0.3] dark:bg-slate-900/[0.2] text-center">
              <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">Total Staff</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">{attendanceData.summary?.totalStaff || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-center">
              <span className="text-[10px] font-bold text-emerald-500 block uppercase tracking-wider">Present Today</span>
              <span className="text-xl font-black text-emerald-500 mt-1 block">{attendanceData.summary?.present || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] text-center">
              <span className="text-[10px] font-bold text-amber-500 block uppercase tracking-wider">Late Entry Today</span>
              <span className="text-xl font-black text-amber-500 mt-1 block">{attendanceData.summary?.late || 0}</span>
            </div>
            <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.02] text-center">
              <span className="text-[10px] font-bold text-rose-500 block uppercase tracking-wider">Absent Today</span>
              <span className="text-xl font-black text-rose-500 mt-1 block">{attendanceData.summary?.absent || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Charts & Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Tracker List */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
            Current Project Deliverables
          </h3>
          <hr className="border-slate-100 dark:border-slate-900" />
          <div className="space-y-4">
            {data?.projects?.map((proj, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 font-medium mr-1.5">{proj.id}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{proj.name}</span>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 font-bold text-[9px] uppercase ${
                    proj.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    proj.status === 'At Risk' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                    'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                  }`}>
                    {proj.status}
                  </span>
                </div>
                <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-550 ${
                      proj.status === 'Completed' ? 'bg-emerald-500' :
                      proj.status === 'At Risk' ? 'bg-rose-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-right font-bold text-slate-500 dark:text-slate-400">{proj.progress}% Completed</p>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Trend Chart */}
        {attendanceData && (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
              Weekly Team Attendance Trend
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />
            <div className="w-full pt-4">
              <svg className="w-full h-36" viewBox="0 0 250 150">
                {attendanceData.weeklyTrend?.map((t, idx) => {
                  const height = (t.Present / maxPresent) * 80 || 5;
                  const x = 15 + idx * 32;
                  const y = 120 - height;
                  return (
                    <g key={idx}>
                      <rect x={x} y="40" width="16" height="80" className="fill-slate-50 dark:fill-slate-900/50" rx="2" />
                      <rect
                        x={x}
                        y={y}
                        width="16"
                        height={height}
                        fill="url(#indigoGrad)"
                        rx="2"
                        className="transition-all duration-500 hover:opacity-85"
                      />
                      <text x={x + 8} y="135" textAnchor="middle" className="text-[8px] fill-slate-400 font-bold">{t.date}</text>
                      <text x={x + 8} y={y - 3} textAnchor="middle" className="text-[8px] fill-slate-700 dark:fill-slate-300 font-black">{t.Present}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Late & Absent lists */}
      {attendanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Late staff today */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-amber-500 font-heading">
              Late Check-ins Today ({attendanceData.lateEmployees?.length || 0})
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {attendanceData.lateEmployees?.length === 0 ? (
                <p className="text-xs text-slate-455 italic text-center py-6">No late entries logged today.</p>
              ) : (
                attendanceData.lateEmployees?.map((emp) => (
                  <div key={emp._id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/[0.02]">
                    <span className="font-bold text-slate-700 dark:text-slate-350 truncate mr-2">{emp.name}</span>
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Late: {emp.lateTime}m</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Absent list */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-rose-500 font-heading">
              Absent Staff Today ({attendanceData.absentEmployees?.length || 0})
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {attendanceData.absentEmployees?.length === 0 ? (
                <p className="text-xs text-slate-455 italic text-center py-6">All staff present today!</p>
              ) : (
                attendanceData.absentEmployees?.map((emp) => (
                  <div key={emp._id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border border-rose-500/10 bg-rose-500/[0.02]">
                    <span className="font-bold text-slate-700 dark:text-slate-350 truncate mr-2">{emp.name}</span>
                    <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider">{emp.employeeId || 'Staff'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   TEAM LEAD (TL) DASHBOARD WIDGET
   ============================================================================ */
const TLDashboard = ({ data, attendanceData }) => {
  return (
    <div className="space-y-6">
      {/* Attendance Stats for Team Lead */}
      {attendanceData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Today's Attendance</p>
            <p className="text-base font-black text-indigo-500 mt-2 font-heading truncate">
              {attendanceData.today?.status || 'Not Checked In'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Attendance Percentage</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.attendancePercentage}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Working Days</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.totalWorkingDays} days
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Leave Balance</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.leaveBalance} days
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint stats panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-1 space-y-5">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
            {data?.teamName || 'My Team'} Overview
          </h3>
          <hr className="border-slate-100 dark:border-slate-900" />
          
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-450 block font-semibold mb-1 uppercase tracking-wider">Sprint Progress</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-150 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: data?.sprintProgress || '0%' }}></div>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{data?.sprintProgress}</span>
              </div>
            </div>
            
            <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wide">Blockers Reported</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-heading mt-0.5">{data?.blockers}</p>
              </div>
              <div className="p-2 rounded bg-rose-500/10 text-rose-500">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Task table panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
            Sprint Tasks Status
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 font-bold uppercase">ID</th>
                  <th className="py-2.5 font-bold uppercase">Title</th>
                  <th className="py-2.5 font-bold uppercase">Assignee</th>
                  <th className="py-2.5 font-bold uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-655 dark:text-slate-350">
                {data?.sprintTasks?.map((task, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3 font-semibold text-slate-400">{task.id}</td>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{task.title}</td>
                    <td className="py-3">{task.assignee}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        task.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        task.status === 'In Review' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-900'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   EMPLOYEE DASHBOARD WIDGET
   ============================================================================ */
const EmployeeDashboard = ({ data, attendanceData }) => {
  return (
    <div className="space-y-6">
      {/* Attendance Stats Cards */}
      {attendanceData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Today's Attendance</p>
            <p className="text-base font-black text-indigo-500 mt-2 font-heading truncate">
              {attendanceData.today?.status || 'Not Checked In'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Attendance Percentage</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.attendancePercentage}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Working Days</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.totalWorkingDays} days
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Leave Balance</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.leaveBalance} days
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Task checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
                My Assigned Tasks
              </h3>
              <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">
                {data?.myTasksCount} Pending
              </span>
            </div>
            <hr className="border-slate-100 dark:border-slate-900" />
            
            <div className="space-y-3">
              {data?.assignedTasks?.map((task, i) => (
                <div key={i} className="flex items-center gap-3.5 p-3 rounded-lg border border-slate-200/60 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
                  <input
                    type="checkbox"
                    className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4 border-slate-300 bg-transparent"
                    defaultChecked={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">{task.id}</span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] text-slate-400">Due {task.dueDate}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    task.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    task.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                    'bg-indigo-500/10 text-indigo-500'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Logged hours & Announcements */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm text-center space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Logged Hours This Week</p>
            <div className="inline-flex items-center justify-center p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-full mt-1.5">
              <Clock4 className="h-8 w-8 text-indigo-500 animate-spin-slow" />
            </div>
            <p className="text-3xl font-black text-slate-850 dark:text-white font-heading">{data?.loggedHoursThisWeek} h</p>
            <p className="text-[11px] text-slate-450">Remaining budget: {40 - (data?.loggedHoursThisWeek || 0)} hours</p>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
                Office Announcements
              </h3>
            </div>
            <hr className="border-slate-100 dark:border-slate-900" />
            <div className="space-y-3.5">
              {data?.announcements?.map((ann, i) => (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>{ann.sender}</span>
                    <span>{ann.date}</span>
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-350">{ann.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   INTERN DASHBOARD WIDGET
   ============================================================================ */
const InternDashboard = ({ data, attendanceData }) => {
  return (
    <div className="space-y-6">
      {/* Attendance Stats Cards */}
      {attendanceData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Today's Attendance</p>
            <p className="text-base font-black text-indigo-500 mt-2 font-heading truncate">
              {attendanceData.today?.status || 'Not Checked In'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Attendance Percentage</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.attendancePercentage}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Working Days</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.totalWorkingDays} days
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Leave Balance</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-1.5 font-heading">
              {attendanceData.leaveBalance} days
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Path widget */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Learning Academy
          </h3>
          <hr className="border-slate-100 dark:border-slate-900" />
          
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Mentor Coach:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{data?.mentorName}</p>
            </div>
            
            <div className="pt-2">
              <span className="text-slate-450 font-semibold mb-1 block uppercase tracking-wider text-[10px]">Learning Completion</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: data?.learningPathCompletion || '0%' }}></div>
                </div>
                <span className="font-bold text-slate-750">{data?.learningPathCompletion}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Courses & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
              Syllabus Modules Status
            </h3>
            <div className="space-y-3.5">
              {data?.learningModules?.map((mod, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="font-bold">{mod.module}</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      mod.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {mod.status}
                    </span>
                    <span className="font-bold text-slate-500">Grade: {mod.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
              Current Assignments
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />
            <div className="space-y-3">
              {data?.internAssignments?.map((ass, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-3 rounded-lg border border-slate-200/50 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/20">
                  <span className="font-bold text-slate-750">{ass.title}</span>
                  <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
                    Due {ass.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   CLIENT PORTAL DASHBOARD WIDGET
   ============================================================================ */
const ClientDashboard = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
            Client Details
          </h3>
          <hr className="border-slate-100 dark:border-slate-900" />
          
          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Company Name:</span>
              <p className="font-bold text-slate-850 dark:text-slate-200 mt-0.5">{data?.companyName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Assigned Auditor:</span>
              <p className="font-bold text-slate-850 dark:text-slate-200 mt-0.5">{data?.accountManager}</p>
            </div>
            <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-900">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Billing Ledger</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5">
                <Receipt className="h-3.5 w-3.5" />
                {data?.billingStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
            Corporate Files Progress
          </h3>
          <hr className="border-slate-100 dark:border-slate-900" />
          
          <div className="space-y-4">
            {data?.projectProgress?.map((file, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{file.serviceName}</span>
                  <span className="text-indigo-500 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                    {file.status}
                  </span>
                </div>
                <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 rounded-full" style={{ width: `${file.progress}%` }}></div>
                </div>
                <p className="text-[10px] text-right font-semibold text-slate-400">{file.progress}% Audited</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading">
            Open Support Queries
          </h3>
          <div className="space-y-3">
            {data?.tickets?.map((t, i) => (
              <div key={i} className="flex justify-between items-center text-xs p-3.5 rounded-lg border border-slate-200/50 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/20">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t.id}</span>
                  <p className="font-bold text-slate-700 dark:text-slate-350">{t.subject}</p>
                </div>
                <div className="flex items-center gap-3.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    t.status === 'Open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-900'
                  }`}>
                    {t.status}
                  </span>
                  <span className="text-[10px] text-slate-400">Updated {t.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
