import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  List,
  Kanban,
  Calendar,
  Plus,
  Clock,
  User,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  ChevronsUpDown,
} from 'lucide-react';

const TaskTracker = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isClient = user?.role?.name === 'Client';
  const canModify = ['Admin', 'Manager', 'TL'].includes(user?.role?.name);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('kanban'); // 'list', 'kanban', 'timeline'

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Editing state (Quick update modal)
  const [editingTask, setEditingTask] = useState(null);
  const [editStatus, setEditStatus] = useState('Pending');
  const [editProgress, setEditProgress] = useState(0);
  const [updating, setUpdating] = useState(false);

  const statuses = ['Pending', 'In Progress', 'Waiting for Documents', 'Completed', 'Overdue'];
  const statusColors = {
    Pending: 'bg-slate-100 text-slate-650 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
    'In Progress': 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
    'Waiting for Documents': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    Overdue: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse',
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks');
      if (response.data?.success) {
        setTasks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleQuickUpdate = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setUpdating(true);
    try {
      const response = await api.put(`/tasks/${editingTask._id}`, {
        status: editStatus,
        progress: editProgress,
      });
      if (response.data?.success) {
        setEditingTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Task update failed.');
    } finally {
      setUpdating(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Compliance Task Board
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor tax computation audits, ROC resolutions, and individual task checklists.
          </p>
        </div>
        {canModify && (
          <button
            onClick={() => navigate('/task-form')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 uppercase tracking-wider cursor-pointer transition ${
            activeTab === 'kanban'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Kanban className="h-4 w-4" />
          Kanban Board
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 uppercase tracking-wider cursor-pointer transition ${
            activeTab === 'list'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <List className="h-4 w-4" />
          List View
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 uppercase tracking-wider cursor-pointer transition ${
            activeTab === 'timeline'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Timeline View
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative text-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent focus:outline-none focus:border-indigo-500 transition text-slate-850 dark:text-white"
          />
        </div>
        <div className="flex gap-3 text-xs">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          {activeTab !== 'kanban' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Tab Render */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-450">Loading task data board...</div>
      ) : (
        <>
          {/* 1. KANBAN TAB */}
          {activeTab === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {statuses.map((status) => {
                const statusTasks = filteredTasks.filter(t => t.status === status);
                return (
                  <div key={status} className="bg-slate-100/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-4 min-w-[220px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">
                        {status}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-200/55 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">
                        {statusTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                      {statusTasks.map((task) => (
                        <div
                          key={task._id}
                          onClick={() => {
                            if (!isClient) {
                              setEditingTask(task);
                              setEditStatus(task.status);
                              setEditProgress(task.progress || 0);
                            }
                          }}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-sm hover:shadow-md transition text-xs space-y-3 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{task.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-2">{task.description}</p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                              <span>Progress</span>
                              <span>{task.progress || 0}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-900 text-[10px] text-slate-400">
                            <span className={`font-bold px-1 rounded uppercase ${
                              task.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                              task.priority === 'High' ? 'bg-orange-500/10 text-orange-500' :
                              'text-indigo-400'
                            }`}>
                              {task.priority}
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. LIST VIEW TAB */}
          {activeTab === 'list' && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-450">No tasks match your filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="py-2.5 font-bold uppercase">Task Name</th>
                        <th className="py-2.5 font-bold uppercase">Assignee</th>
                        <th className="py-2.5 font-bold uppercase">Due Date</th>
                        <th className="py-2.5 font-bold uppercase">Priority</th>
                        <th className="py-2.5 font-bold uppercase">Progress</th>
                        <th className="py-2.5 font-bold uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-650 dark:text-slate-350">
                      {filteredTasks.map((task) => (
                        <tr
                          key={task._id}
                          onClick={() => {
                            if (!isClient) {
                              setEditingTask(task);
                              setEditStatus(task.status);
                              setEditProgress(task.progress || 0);
                            }
                          }}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer"
                        >
                          <td className="py-4 font-bold text-slate-850 dark:text-slate-250">
                            <p>{task.title}</p>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1 max-w-sm">{task.description}</span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span>{task.assignedTo?.name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="py-4">{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td className="py-4">
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                              task.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              task.priority === 'High' ? 'bg-orange-500/10 text-orange-500' :
                              'bg-indigo-500/10 text-indigo-500'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                              </div>
                              <span className="font-bold">{task.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusColors[task.status] || ''}`}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. TIMELINE VIEW TAB */}
          {activeTab === 'timeline' && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">Task Deadlines Chart</h3>
              <hr className="border-slate-100 dark:border-slate-900" />
              
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-455">No tasks available for timeline mapping.</div>
              ) : (
                <div className="space-y-4 pt-2">
                  {filteredTasks.map((task) => {
                    const diffDays = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 3600 * 24));
                    const isOverdue = diffDays < 0;
                    
                    // Width representation: capped at 100%, minimum 10%
                    const widthPercent = Math.max(12, Math.min(100, 100 - (diffDays * 5)));
                    const barColor = isOverdue ? 'bg-rose-500' : 'bg-indigo-500';

                    return (
                      <div key={task._id} className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{task.title}</span>
                          <span className="text-[10px] text-slate-450 font-semibold">
                            {isOverdue ? `Overdue by ${Math.abs(diffDays)} days` : `Due in ${diffDays} days`} ({new Date(task.dueDate).toLocaleDateString()})
                          </span>
                        </div>
                        <div className="w-full h-4 bg-slate-50 dark:bg-slate-900 rounded-lg relative overflow-hidden border border-slate-200/50 dark:border-slate-800">
                          <div
                            className={`absolute top-0 bottom-0 left-0 transition-all duration-550 rounded-r-lg ${barColor} opacity-85 flex items-center px-2 text-[8px] text-white font-black uppercase tracking-wider`}
                            style={{ width: `${widthPercent}%` }}
                          >
                            Progress: {task.progress}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Quick Status / Progress Update Modal (For Staff) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <div>
                <h3 className="font-heading text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                  Quick Update Task
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[280px]">{editingTask.title}</p>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleQuickUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-400 uppercase tracking-wider">
                  <span>Progress Slider</span>
                  <span className="text-indigo-500">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-800 text-slate-650 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 px-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-bold"
                >
                  {updating ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTracker;
