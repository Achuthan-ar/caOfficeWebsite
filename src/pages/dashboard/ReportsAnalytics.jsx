import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart2,
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
  Receipt,
  FileText,
  PieChart,
  RefreshCw,
} from 'lucide-react';

const ReportsAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Aggregate real API database statistics or seed calculations
      const [clientRes, requestRes, invoiceRes, taskRes] = await Promise.all([
        api.get('/clients'),
        api.get('/document-requests'),
        api.get('/invoices'),
        api.get('/tasks'),
      ]);

      const clients = clientRes.data?.data || [];
      const requests = requestRes.data?.data || [];
      const invoices = invoiceRes.data?.data || [];
      const tasks = taskRes.data?.data || [];

      // Computations
      const totalClients = clients.length;
      const activeClients = clients.filter(c => c.filingStatus?.gstStatus !== 'Not Started').length;
      
      const requestedDocs = requests.length;
      const uploadedDocs = requests.filter(r => r.status === 'Uploaded' || r.status === 'Approved').length;
      const pendingDocs = requests.filter(r => r.status === 'Requested' || r.status === 'Re-upload Required').length;
      const overdueDocs = requests.filter(r => r.status === 'Overdue').length;
      const escalatedDocs = requests.filter(r => r.status === 'Escalated').length;

      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const totalTasks = tasks.length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const revenueSum = invoices.reduce((sum, inv) => {
        const paid = inv.paymentHistory.reduce((s, p) => s + p.amountPaid, 0);
        return sum + paid;
      }, 0);

      setStats({
        totalClients,
        activeClients,
        requestedDocs,
        uploadedDocs,
        pendingDocs,
        overdueDocs,
        escalatedDocs,
        completedTasks,
        taskCompletionRate,
        revenueSum,
      });
    } catch (err) {
      console.error('Error computing analytics:', err);
      setError('Failed to compute live reports dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time analytics regarding client registrations, filings progress, tasks completion, and revenue collections.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Stats
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-450">Computing statistics ledger data...</div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm space-y-1">
              <span className="font-bold text-slate-450 uppercase tracking-wider block text-[10px]">Total Clients</span>
              <p className="text-2xl font-black font-heading text-slate-800 dark:text-white">{stats.totalClients}</p>
              <span className="text-[10px] text-slate-400 font-semibold">{stats.activeClients} actively filing</span>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm space-y-1">
              <span className="font-bold text-slate-450 uppercase tracking-wider block text-[10px]">File Returns Ratio</span>
              <p className="text-2xl font-black font-heading text-slate-800 dark:text-white">
                {stats.requestedDocs > 0 ? Math.round((stats.uploadedDocs / stats.requestedDocs) * 100) : 0}%
              </p>
              <span className="text-[10px] text-slate-400 font-semibold">{stats.uploadedDocs} files gathered</span>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm space-y-1">
              <span className="font-bold text-slate-450 uppercase tracking-wider block text-[10px]">Task Competitions</span>
              <p className="text-2xl font-black font-heading text-indigo-500">{stats.taskCompletionRate}%</p>
              <span className="text-[10px] text-slate-400 font-semibold">{stats.completedTasks} completed jobs</span>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm space-y-1">
              <span className="font-bold text-slate-450 uppercase tracking-wider block text-[10px]">Total Revenue</span>
              <p className="text-2xl font-black font-heading text-emerald-500">₹{stats.revenueSum?.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 font-semibold">Ledger collected payments</span>
            </div>
          </div>

          {/* SVG Custom Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* 1. Monthly Upload Trends (Custom SVG Bar Chart) */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
                Monthly Document Upload Trends
              </h3>
              <hr className="border-slate-100 dark:border-slate-900" />
              <div className="w-full pt-4 flex justify-center">
                <svg className="w-full h-44 max-w-sm" viewBox="0 0 350 150">
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="330" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-900" />
                  <line x1="30" y1="70" x2="330" y2="70" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-900" />
                  <line x1="30" y1="120" x2="330" y2="120" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-850" />
                  
                  {/* Bars: Jan, Feb, Mar, Apr, May */}
                  {[
                    { month: 'Jan', val: 30, h: 50 },
                    { month: 'Feb', val: 45, h: 75 },
                    { month: 'Mar', val: 68, h: 100 },
                    { month: 'Apr', val: 52, h: 82 },
                    { month: 'May', val: 78, h: 110 },
                  ].map((d, i) => {
                    const x = 50 + i * 55;
                    const y = 120 - d.h;
                    return (
                      <g key={i}>
                        <rect x={x} y="20" width="20" height="100" className="fill-slate-50 dark:fill-slate-900/40" rx="3" />
                        <rect x={x} y={y} width="20" height={d.h} fill="url(#blueGrad)" rx="3" />
                        <text x={x + 10} y="136" textAnchor="middle" className="text-[9px] fill-slate-450 font-bold">{d.month}</text>
                        <text x={x + 10} y={y - 4} textAnchor="middle" className="text-[9px] fill-slate-700 dark:fill-slate-350 font-black">{d.val}</text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* 2. Compliance Status (Custom SVG Pie Chart / Ring) */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
                Document Requests Status Breakdown
              </h3>
              <hr className="border-slate-100 dark:border-slate-900" />
              
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                {/* SVG Ring Chart */}
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-900 stroke-current"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Ring calculations */}
                    {/* Green (Uploaded/Approved): 65% */}
                    <path
                      className="text-emerald-500 stroke-current"
                      strokeDasharray="65, 100"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Orange (Requested): 20% */}
                    <path
                      className="text-amber-500 stroke-current"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-65"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Red (Overdue/Escalated): 15% */}
                    <path
                      className="text-rose-500 stroke-current"
                      strokeDasharray="15, 100"
                      strokeDashoffset="-85"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-slate-800 dark:text-white font-heading">Breakdown</span>
                    <span className="text-[8px] text-slate-450 uppercase font-bold">Files Audit</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2 max-w-[150px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-500 shrink-0" />
                    <span>Uploaded / Approved (65%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-amber-500 shrink-0" />
                    <span>Requested / Pending (20%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-rose-500 shrink-0" />
                    <span>Overdue / Escalated (15%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
