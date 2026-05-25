import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  FolderKanban,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Paperclip,
  Check,
  X,
  FileText,
  User,
  History,
  Send,
  Loader2,
} from 'lucide-react';

const TaskKanban = () => {
  const { user: currentUser } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Modal State
  const [activeTask, setActiveTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Quick Edit States inside modal
  const [taskStatus, setTaskStatus] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);
  const [attachmentLink, setAttachmentLink] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const isPrivileged = ['Admin', 'Manager', 'TL'].includes(currentUser?.role?.name);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedDept) params.department = selectedDept;
      if (selectedPriority) params.priority = selectedPriority;

      const response = await api.get('/tasks', { params });
      if (response.data?.success) {
        setTasks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err.message);
      setError('Failed to fetch tasks registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      if (response.data?.success) {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err.message);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [search, selectedDept, selectedPriority]);

  // Load comments & details when task is opened
  const handleOpenDetails = async (task) => {
    setActiveTask(task);
    setTaskStatus(task.status);
    setTaskProgress(task.progress);
    setAttachmentLink('');
    setComments([]);
    try {
      const response = await api.get(`/tasks/${task._id}/comments`);
      if (response.data?.success) {
        setComments(response.data.data);
      }
    } catch (err) {
      console.error('Error loading comments:', err.message);
    }
  };

  // Move task status directly from card arrow buttons
  const handleMoveStatus = async (taskId, currentStatus, direction) => {
    const statuses = ['Pending', 'In Progress', 'Completed', 'Delayed'];
    const currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= statuses.length) return;
    const newStatus = statuses[nextIndex];

    try {
      const response = await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (response.data?.success) {
        // Update local state
        setTasks(tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus, activityLogs: response.data.data.activityLogs } : t)));
        if (activeTask && activeTask._id === taskId) {
          setActiveTask({ ...activeTask, status: newStatus, activityLogs: response.data.data.activityLogs });
          setTaskStatus(newStatus);
        }
      }
    } catch (err) {
      console.error('Error updating task status:', err.message);
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Save changes from details modal (progress & status)
  const handleSaveDetailsEdits = async () => {
    if (!activeTask) return;
    setEditLoading(true);
    try {
      const payload = {
        status: taskStatus,
        progress: Number(taskProgress),
      };

      if (attachmentLink.trim()) {
        payload.attachments = [...(activeTask.attachments || []), attachmentLink.trim()];
      }

      const response = await api.put(`/tasks/${activeTask._id}`, payload);
      if (response.data?.success) {
        setSuccess('Task progress updated successfully.');
        setAttachmentLink('');
        // Update local collections
        setTasks(tasks.map((t) => (t._id === activeTask._id ? response.data.data : t)));
        setActiveTask(response.data.data);
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Error saving edits:', err.message);
      setError(err.response?.data?.message || 'Failed to save modifications.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setEditLoading(false);
    }
  };

  // Post comments
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTask) return;

    setCommentLoading(true);
    try {
      const response = await api.post(`/tasks/${activeTask._id}/comments`, { comment: newComment.trim() });
      if (response.data?.success) {
        setComments([...comments, response.data.data]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data?.success) {
        setSuccess('Task deleted successfully.');
        setTasks(tasks.filter((t) => t._id !== taskId));
        setActiveTask(null);
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Error deleting task:', err.message);
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Calculate if a task is overdue
  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case 'Medium': return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
    }
  };

  // Group tasks by column status
  const columns = {
    Pending: tasks.filter((t) => t.status === 'Pending'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    Completed: tasks.filter((t) => t.status === 'Completed'),
    Delayed: tasks.filter((t) => t.status === 'Delayed'),
  };

  const colClasses = {
    Pending: 'border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/5',
    'In Progress': 'border-indigo-550/15 bg-indigo-500/[0.01]',
    Completed: 'border-emerald-550/15 bg-emerald-500/[0.01]',
    Delayed: 'border-rose-550/15 bg-rose-500/[0.01]',
  };

  const colBadge = {
    Pending: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400',
    'In Progress': 'bg-indigo-500/10 text-indigo-500',
    Completed: 'bg-emerald-500/10 text-emerald-500',
    Delayed: 'bg-rose-500/10 text-rose-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 border border-indigo-500/20">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
              Compliance Task Board
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review current assignments, sprint progress, and coordinate workloads.
            </p>
          </div>
        </div>

        {isPrivileged && (
          <Link
            to="/task-form"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Task
          </Link>
        )}
      </div>

      {/* Filter and search bars */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-455" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.keys(columns).map((colTitle) => {
            const colTasks = columns[colTitle];
            return (
              <div
                key={colTitle}
                className={`border rounded-xl p-4 flex flex-col space-y-4 min-h-[450px] ${colClasses[colTitle]}`}
              >
                {/* Column Title */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white font-heading text-xs tracking-wider uppercase">
                    {colTitle}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black leading-none ${colBadge[colTitle]}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[500px] pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl py-12 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider select-none">
                      No Tasks
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const overdue = isOverdue(task.dueDate, task.status);
                      const deptName = task.department?.name || 'Cross-Dept';

                      return (
                        <div
                          key={task._id}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm hover:shadow transition space-y-3.5 group cursor-pointer"
                          onClick={() => handleOpenDetails(task)}
                        >
                          {/* Top: dept + Priority */}
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                            <span className="text-slate-450 truncate max-w-[100px]">{deptName}</span>
                            <span className={`px-1.5 py-0.2 rounded-md ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>

                          {/* Title */}
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-snug group-hover:text-indigo-500 transition duration-150 break-words">
                            {task.title}
                          </p>

                          {/* Progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="relative w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 left-0 bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Assignee & Comments metadata */}
                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-900 text-[10px] text-slate-400 font-semibold">
                            <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                              <div className="h-5 w-5 rounded-full bg-slate-150 dark:bg-slate-900 flex items-center justify-center font-bold text-[8px] uppercase text-slate-700 dark:text-slate-300 shrink-0">
                                {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : '?'}
                              </div>
                              <span className="truncate">{task.assignedTo?.name || 'Unassigned'}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {overdue && (
                                <span
                                  className="text-red-500 flex items-center gap-0.5 font-bold"
                                  title="Overdue deadline!"
                                >
                                  <AlertCircle className="h-3.5 w-3.5 animate-bounce" />
                                </span>
                              )}
                              <span className="flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* Card Arrows simulator Controls */}
                          <div
                            className="flex justify-end gap-1.5 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => e.stopPropagation()} // Stop opening details modal
                          >
                            <button
                              onClick={() => handleMoveStatus(task._id, task.status, -1)}
                              className="p-1 rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                              title="Move Left"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveStatus(task._id, task.status, 1)}
                              className="p-1 rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                              title="Move Right"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERLAY PANEL MODAL: TASK DETAILS */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-950 h-screen border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col space-y-5 animate-slide-in"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-150 dark:border-slate-900 pb-4">
              <div className="space-y-1 max-w-[80%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded px-1.5 py-0.2 text-[8px] font-black uppercase ${getPriorityColor(activeTask.priority)}`}>
                    {activeTask.priority}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Dept: {activeTask.department?.name || 'Cross-Dept'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white font-heading leading-tight break-words">
                  {activeTask.title}
                </h3>
                <p className="text-[10px] text-slate-450 font-medium">
                  Created by: <span className="font-semibold">{activeTask.createdBy?.name}</span> | Due {new Date(activeTask.dueDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isPrivileged && (
                  <>
                    <Link
                      to={`/task-form/${activeTask._id}`}
                      className="text-xs font-bold text-indigo-500 hover:underline border border-indigo-550/15 bg-indigo-500/[0.03] px-2.5 py-1 rounded-lg"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteTask(activeTask._id)}
                      className="text-xs font-bold text-rose-500 hover:underline border border-rose-550/15 bg-rose-500/[0.03] px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActiveTask(null)}
                  className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5 text-slate-550" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-6 text-xs leading-relaxed">
              {/* Guidelines */}
              {activeTask.description && (
                <div className="space-y-1.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Guidelines & Scope</span>
                  <p className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/80 p-3.5 rounded-xl font-medium">
                    {activeTask.description}
                  </p>
                </div>
              )}

              {/* Progress and status updater (Assignee / Admin / PM / TL) */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Update Progress & Status</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 block uppercase">Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>

                  {/* Progress slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-455 block uppercase">Progress percentage</label>
                      <span className="font-bold text-indigo-500">{taskProgress}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={taskProgress}
                        onChange={(e) => setTaskProgress(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                  <label className="text-[10px] font-bold text-slate-455 block uppercase">Add Attachment URL</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Google Drive, PDF, or sheets link..."
                        value={attachmentLink}
                        onChange={(e) => setAttachmentLink(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {activeTask.attachments && activeTask.attachments.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Uploaded Attachments</span>
                      {activeTask.attachments.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 font-semibold underline truncate"
                        >
                          <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{link}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveDetailsEdits}
                    disabled={editLoading}
                    className="inline-flex items-center gap-1.5 bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase cursor-pointer hover:bg-indigo-600 transition active:scale-95 disabled:opacity-50"
                  >
                    {editLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save Progress
                  </button>
                </div>
              </div>

              {/* Activity Log logs list */}
              <div className="space-y-2">
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <History className="h-3.5 w-3.5" />
                  Task Activity History Log
                </span>
                <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-3.5 space-y-2 max-h-36 overflow-y-auto">
                  {activeTask.activityLogs?.map((log, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[10px] leading-tight py-0.5 border-b border-slate-100 dark:border-slate-900/50 last:border-b-0">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[8px] font-bold shrink-0 ml-4">
                        {new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-3.5">
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Task Comments ({comments.length})
                </span>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type comments about task updates..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic text-center py-4">No comments posted yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c._id} className="p-3 rounded-lg border border-slate-150 dark:border-slate-900 bg-slate-50/[0.3] dark:bg-slate-900/[0.2] space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                          <span>{c.user?.name}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskKanban;
