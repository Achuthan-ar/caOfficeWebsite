import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import api from '../../services/api';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  User,
  Building,
  RefreshCw,
  LayoutGrid,
  List,
  Clock,
  ChevronDown,
  Loader2,
  MessageSquare,
  Paperclip,
  History,
  Send,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';

// Reusable Custom Multi-Select Dropdown Component
const MultiSelect = ({ label, options, selectedValues, onChange, displayKey = 'name', valueKey = 'id' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-left flex justify-between items-center cursor-pointer select-none"
      >
        <span className="truncate font-semibold">
          {selectedValues.length === 0
            ? `All ${label}s`
            : `${selectedValues.length} Selected`}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto p-2 space-y-1">
            {options.map((opt) => {
              const val = opt[valueKey];
              const labelText = opt[displayKey];
              const isChecked = selectedValues.includes(val);
              return (
                <label
                  key={val}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-pointer text-xs text-slate-755 dark:text-slate-250 select-none font-medium"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        onChange(selectedValues.filter((v) => v !== val));
                      } else {
                        onChange([...selectedValues, val]);
                      }
                    }}
                    className="rounded border-slate-350 dark:border-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer h-3.5 w-3.5"
                  />
                  <span className="truncate">{labelText}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const TaskTracker = () => {
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();
  const navigate = useNavigate();

  const isManagerOrTL = ['Admin', 'CA Login', 'Manager'].includes(user?.role?.name);
  const isClient = user?.role?.name === 'Client';

  // Layout mode: 'list' (Table) or 'kanban' (Board)
  const [viewMode, setViewMode] = useState('kanban');

  // Data states
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Multi-Select Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [fyFilter, setFyFilter] = useState([]);
  const [clientFilter, setClientFilter] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState([]);
  const [tlFilter, setTlFilter] = useState([]);
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');

  // Modal / Detail states
  const [viewingTask, setViewingTask] = useState(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Comments & Add Attachments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentSaving, setAttachmentSaving] = useState(false);

  // Status updates in details slide-over
  const [inlineStatus, setInlineStatus] = useState('');
  const [inlineProgress, setInlineProgress] = useState(0);
  const [inlineRemarks, setInlineRemarks] = useState('');
  const [inlineSaving, setInlineSaving] = useState(false);

  // Lazy loading limits per Kanban column
  const [visibleLimits, setVisibleLimits] = useState({
    'To Do': 10,
    'In Progress': 10,
    Review: 10,
    Completed: 10,
    'On Hold': 10,
    Cancelled: 10,
  });

  // Track dragging state
  const [activeDragTarget, setActiveDragTarget] = useState(null);

  // Available Filter Options
  const kanbanColumns = ['To Do', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'];
  const allStatuses = ['To Do', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'];
  const allPriorities = ['High', 'Medium', 'Low'];
  const allFYs = ['2023-24', '2024-25', '2025-26', '2026-27', '2027-28', '2028-29'];

  const statusColors = {
    'To Do': 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
    'In Progress': 'bg-indigo-500/10 text-indigo-550 border border-indigo-500/20 dark:text-indigo-400',
    Review: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400',
    Completed: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400',
    'On Hold': 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 dark:text-yellow-450',
    Cancelled: 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:text-rose-400',
  };

  const priorityColors = {
    High: 'bg-rose-500/10 text-rose-650 border border-rose-500/20 dark:text-rose-400',
    Medium: 'bg-indigo-500/10 text-indigo-550 border border-indigo-500/20 dark:text-indigo-400',
    Low: 'bg-slate-100 text-slate-655 dark:bg-slate-900 dark:text-slate-400 border border-slate-250 dark:border-slate-850',
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter.length > 0) params.status = statusFilter.join(',');
      if (priorityFilter.length > 0) params.priority = priorityFilter.join(',');
      if (fyFilter.length > 0) params.financialYear = fyFilter.join(',');
      if (clientFilter.length > 0) params.clientId = clientFilter.join(',');
      if (employeeFilter.length > 0) params.assignedEmployee = employeeFilter.join(',');
      if (tlFilter.length > 0) params.teamLead = tlFilter.join(',');
      if (dueDateStart) params.dueDateStart = dueDateStart;
      if (dueDateEnd) params.dueDateEnd = dueDateEnd;

      const [taskRes, clientRes, empRes, statsRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/clients'),
        api.get('/employees'),
        api.get('/tasks/stats', { params }),
      ]);

      if (taskRes.data?.success) {
        setTasks(taskRes.data.data);
      }
      if (clientRes.data?.success) {
        setClients(clientRes.data.data);
      }
      if (empRes.data?.success) {
        setEmployeesList(empRes.data.data);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching tracker data:', err);
      setError('Failed to fetch tasks registry details.');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    statusFilter,
    priorityFilter,
    fyFilter,
    clientFilter,
    employeeFilter,
    tlFilter,
    dueDateStart,
    dueDateEnd,
  ]);

  // Listen for socket events to update board in real-time
  useEffect(() => {
    fetchData();

    if (socket) {
      const handleTaskCreated = (newTask) => {
        setTasks((prev) => {
          if (prev.some((t) => t._id === newTask._id)) return prev;
          return [...prev, newTask];
        });
      };

      const handleTaskUpdated = (updatedTask) => {
        setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
        setViewingTask((prev) => {
          if (prev?._id === updatedTask._id) {
            setInlineStatus(updatedTask.status);
            setInlineProgress(updatedTask.progress || 0);
            setInlineRemarks(updatedTask.completionRemarks || updatedTask.remarks || '');
            return updatedTask;
          }
          return prev;
        });
      };

      const handleTaskDeleted = ({ taskId }) => {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        setViewingTask((prev) => (prev?._id === taskId ? null : prev));
      };

      socket.on('taskCreated', handleTaskCreated);
      socket.on('taskUpdated', handleTaskUpdated);
      socket.on('taskDeleted', handleTaskDeleted);

      return () => {
        socket.off('taskCreated', handleTaskCreated);
        socket.off('taskUpdated', handleTaskUpdated);
        socket.off('taskDeleted', handleTaskDeleted);
      };
    }
  }, [socket, fetchData]);

  // Load comments when task details drawer is opened
  const handleOpenDetails = async (task) => {
    setViewingTask(task);
    setInlineStatus(task.status);
    setInlineProgress(task.progress || 0);
    setInlineRemarks(task.completionRemarks || task.remarks || '');
    setNewComment('');
    setAttachmentUrl('');
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

  // Submit Comments
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !viewingTask) return;
    setCommentLoading(true);

    try {
      const response = await api.post(`/tasks/${viewingTask._id}/comments`, { comment: newComment.trim() });
      if (response.data?.success) {
        setComments([...comments, response.data.data]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  // Add Attachments link
  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!attachmentUrl.trim() || !viewingTask) return;
    setAttachmentSaving(true);

    try {
      const updatedAttachments = [...(viewingTask.attachments || []), attachmentUrl.trim()];
      const response = await api.put(`/tasks/${viewingTask._id}`, { attachments: updatedAttachments });
      if (response.data?.success) {
        setViewingTask(response.data.data);
        setTasks(tasks.map((t) => (t._id === viewingTask._id ? response.data.data : t)));
        setAttachmentUrl('');
        setSuccess('Attachment link uploaded successfully.');
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      console.error('Error uploading attachment URL:', err);
    } finally {
      setAttachmentSaving(false);
    }
  };

  // Inline save updates from Slide-over drawer
  const handleInlineSave = async () => {
    if (!viewingTask) return;
    setInlineSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/tasks/${viewingTask._id}`, {
        status: inlineStatus,
        progress: inlineStatus === 'Completed' ? 100 : Number(inlineProgress),
        completionRemarks: inlineRemarks,
      });

      if (response.data?.success) {
        setSuccess('Task progress updated successfully.');
        setTasks(tasks.map((t) => (t._id === viewingTask._id ? response.data.data : t)));
        setViewingTask(response.data.data);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error saving inline task edits:', err);
      setError(err.response?.data?.message || 'Failed to save progress update.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setInlineSaving(false);
    }
  };

  // Delete Task
  const handleDelete = async (taskId) => {
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data?.success) {
        setSuccess('Task deleted successfully.');
        setConfirmDeleteTask(null);
        setViewingTask(null);
        setTasks(tasks.filter((t) => t._id !== taskId));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError(err.response?.data?.message || 'Error deleting task.');
    } finally {
      setDeleting(false);
    }
  };

  // Check if task is overdue dynamically
  const isOverdue = (task) => {
    if (task.status === 'Completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  };

  // Group tasks by Kanban status columns locally
  const getColumnTasks = (status) => {
    return tasks.filter((t) => {
      // Local sync filtering
      const matchesSearch =
        t.taskName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.taskId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.taskDescription || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = priorityFilter.length > 0 ? priorityFilter.includes(t.priority) : true;
      const matchesFY = fyFilter.length > 0 ? fyFilter.includes(t.financialYear) : true;
      const matchesClient = clientFilter.length > 0 ? clientFilter.includes(t.clientId?._id || t.clientId) : true;
      const matchesEmployee = employeeFilter.length > 0 ? employeeFilter.includes(t.assignedEmployee?._id || t.assignedEmployee || t.assignedTo?._id || t.assignedTo) : true;
      const matchesTL = tlFilter.length > 0 ? tlFilter.includes(t.assignedTeamLead?._id || t.assignedTeamLead) : true;
      const matchesDateRange =
        (!dueDateStart || new Date(t.dueDate) >= new Date(dueDateStart)) &&
        (!dueDateEnd || new Date(t.dueDate) <= new Date(dueDateEnd).setHours(23, 59, 59, 999));

      return matchesSearch && matchesPriority && matchesFY && matchesClient && matchesEmployee && matchesTL && matchesDateRange && t.status === status;
    });
  };

  // Client-side filtering logic for List/Table view
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.taskName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.taskId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.taskDescription || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.clientId?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedEmployee?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter.length > 0 ? priorityFilter.includes(t.priority) : true;
    const matchesFY = fyFilter.length > 0 ? fyFilter.includes(t.financialYear) : true;
    const matchesClient = clientFilter.length > 0 ? (clientFilter.includes(t.clientId?._id) || clientFilter.includes(t.clientId)) : true;
    const matchesEmployee = employeeFilter.length > 0 ? (employeeFilter.includes(t.assignedEmployee?._id) || employeeFilter.includes(t.assignedEmployee) || employeeFilter.includes(t.assignedTo?._id) || employeeFilter.includes(t.assignedTo)) : true;
    const matchesTL = tlFilter.length > 0 ? (tlFilter.includes(t.assignedTeamLead?._id) || tlFilter.includes(t.assignedTeamLead)) : true;
    const matchesStatus = statusFilter.length > 0 ? statusFilter.includes(t.status) : true;
    
    let matchesDateRange = true;
    if (dueDateStart || dueDateEnd) {
      const taskDate = new Date(t.dueDate);
      if (dueDateStart && taskDate < new Date(dueDateStart)) {
        matchesDateRange = false;
      }
      if (dueDateEnd) {
        const endLimit = new Date(dueDateEnd);
        endLimit.setHours(23, 59, 59, 999);
        if (taskDate > endLimit) {
          matchesDateRange = false;
        }
      }
    }

    return matchesSearch && matchesPriority && matchesFY && matchesClient && matchesEmployee && matchesTL && matchesStatus && matchesDateRange;
  });

  // HTML5 Drag and Drop Handlers with Scope checks
  const handleDragStart = (e, task) => {
    const isAssignee = task.assignedEmployee?._id === user?.id || task.assignedEmployee === user?.id || task.assignedTo?._id === user?.id;
    const dragAllowed = isManagerOrTL || isAssignee;

    if (!dragAllowed) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, status) => {
    e.preventDefault();
    setActiveDragTarget(status);
  };

  const handleDragLeave = () => {
    setActiveDragTarget(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setActiveDragTarget(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const originalStatus = task.status;
    if (originalStatus === targetStatus) return;

    // Optimistically update status locally
    setTasks((prev) =>
      prev.map((t) => {
        if (t._id === taskId) {
          return {
            ...t,
            status: targetStatus,
            completionDate: targetStatus === 'Completed' ? new Date() : undefined,
          };
        }
        return t;
      })
    );

    try {
      const response = await api.put(`/tasks/${taskId}`, { status: targetStatus });
      if (!response.data?.success) {
        throw new Error('API failed to save');
      }
    } catch (err) {
      console.error('Failed to update task status via drop:', err);
      setError('Failed to update task status. Reverting changes.');
      // Revert local state
      setTasks((prev) =>
        prev.map((t) => {
          if (t._id === taskId) {
            return {
              ...t,
              status: originalStatus,
              completionDate: originalStatus === 'Completed' ? task.completionDate : undefined,
            };
          }
          return t;
        })
      );
      setTimeout(() => setError(''), 3000);
    }
  };

  // Mapping Lists for Filters
  const allStaffEmployees = employeesList;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Compliance Task Board
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage tax computation audits, ROC filings, and office task deliverables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-xl bg-slate-200/50 dark:bg-slate-900 border border-slate-350 dark:border-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-855 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-855 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
          </div>

          {isManagerOrTL && (
            <button
              onClick={() => navigate('/task-form')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95 animate-fade-in"
            >
              <Plus className="h-4.5 w-4.5" />
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white font-heading">{stats.total}</span>
              <TrendingUp className="h-4 w-4 text-slate-350" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-500 font-heading">{stats.pending}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Board Queue</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-555 dark:text-indigo-400 uppercase tracking-wider">In Progress</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-indigo-500 dark:text-indigo-400 font-heading">{stats.inProgress}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Completed</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-500 font-heading">{stats.completed}</span>
              <CheckCircle className="h-4 w-4 text-emerald-500/80" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1 flex flex-col justify-between border-rose-500/25 bg-rose-500/[0.01]">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Overdue</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-rose-500 font-heading">{stats.overdue}</span>
              <AlertCircle className="h-4 w-4 text-rose-500 animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Multi-Select Filters Panel */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm space-y-4">
        {/* Search & Date limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search Task ID, name, client, assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                placeholder="Due Start"
                value={dueDateStart}
                onChange={(e) => setDueDateStart(e.target.value)}
                className="w-full bg-slate-55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="date"
                placeholder="Due End"
                value={dueDateEnd}
                onChange={(e) => setDueDateEnd(e.target.value)}
                className="w-full bg-slate-55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter([]);
                setPriorityFilter([]);
                setFyFilter([]);
                setClientFilter([]);
                setEmployeeFilter([]);
                setTlFilter([]);
                setDueDateStart('');
                setDueDateEnd('');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-250 dark:border-slate-800 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer active:scale-95 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Checkbox-based Multi-Select Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 border-t border-slate-100 dark:border-slate-900 pt-3">
          <MultiSelect
            label="Status"
            options={allStatuses.map((s) => ({ id: s, name: s }))}
            selectedValues={statusFilter}
            onChange={setStatusFilter}
          />
          <MultiSelect
            label="Priority"
            options={allPriorities.map((p) => ({ id: p, name: p }))}
            selectedValues={priorityFilter}
            onChange={setPriorityFilter}
          />
          <MultiSelect
            label="Financial Year"
            options={allFYs.map((fy) => ({ id: fy, name: fy }))}
            selectedValues={fyFilter}
            onChange={setFyFilter}
          />
          <MultiSelect
            label="Client"
            options={clients.map((c) => ({ id: c._id, name: c.companyName || c.clientName }))}
            selectedValues={clientFilter}
            onChange={setClientFilter}
          />
          <MultiSelect
            label="Employee"
            options={allStaffEmployees.map((emp) => ({ id: emp._id, name: emp.name }))}
            selectedValues={employeeFilter}
            onChange={setEmployeeFilter}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Main Boards / Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Updating task tracker data...
          </span>
        </div>
      ) : (
        <>
          {/* 1. TABLE LIST VIEW */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850 text-[10px] font-black uppercase text-slate-500 dark:text-slate-455 tracking-wider select-none">
                      <th className="p-4">Task ID</th>
                      <th className="p-4">Financial Year</th>
                      <th className="p-4">Client Name</th>
                      <th className="p-4">Task Name</th>
                      <th className="p-4">Assigned Employee</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-12 text-center text-slate-450 italic font-semibold">
                          No tasks matched current criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const overdue = isOverdue(task);
                        return (
                          <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition">
                            <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{task.taskId || 'N/A'}</td>
                            <td className="p-4">{task.financialYear}</td>
                            <td className="p-4 truncate max-w-[150px] font-bold text-slate-800 dark:text-white">
                              {task.clientId?.companyName || task.clientId?.clientName || 'N/A'}
                            </td>
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-150 truncate max-w-[200px]" title={task.taskName}>
                              {task.taskName}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                                  {task.assignedEmployee?.name?.charAt(0) || '?'}
                                </div>
                                <span className="truncate">{task.assignedEmployee?.name || 'Unassigned'}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span className={`${overdue ? 'text-rose-500 font-bold' : ''}`}>
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                                </span>
                                {overdue && <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-bounce" />}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[task.status]}`}>
                                {task.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenDetails(task)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                                  title="View Task Details"
                                >
                                  <Eye className="h-4 w-4 text-slate-450" />
                                </button>
                                {isManagerOrTL && (
                                  <>
                                    <button
                                      onClick={() => navigate(`/task-form/${task._id}`)}
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-500 transition cursor-pointer"
                                      title="Edit Task"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteTask(task)}
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-rose-500 transition cursor-pointer"
                                      title="Delete Task"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. KANBAN BOARD VIEW */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pb-4 items-start select-none">
              {kanbanColumns.map((colTitle) => {
                const columnTasks = getColumnTasks(colTitle);
                const limit = visibleLimits[colTitle] || 10;
                const slicedTasks = columnTasks.slice(0, limit);
                const hasMore = columnTasks.length > limit;

                const isTarget = activeDragTarget === colTitle;

                return (
                  <div
                    key={colTitle}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, colTitle)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, colTitle)}
                    className={`flex flex-col rounded-2xl p-3 min-h-[480px] border transition-all duration-200 ${
                      isTarget
                        ? 'border-indigo-500 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02] shadow-lg scale-[1.01]'
                        : 'border-slate-200 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-900/10'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-900 mb-3.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-455">
                        {colTitle}
                      </span>
                      <span className="text-[10px] font-black leading-none bg-slate-200/60 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-300/20 dark:border-slate-800">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-0.5">
                      {slicedTasks.length === 0 ? (
                        <div className="border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl py-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          No Tasks
                        </div>
                      ) : (
                        slicedTasks.map((task) => {
                          const overdue = isOverdue(task);
                          const isAssignee = task.assignedEmployee?._id === user?.id || task.assignedEmployee === user?.id || task.assignedTo?._id === user?.id;
                          const dragAllowed = !isClient && (isManagerOrTL || isAssignee);

                          return (
                            <div
                              key={task._id}
                              draggable={dragAllowed}
                              onDragStart={(e) => handleDragStart(e, task)}
                              className={`bg-white dark:bg-slate-950 border rounded-xl p-3.5 shadow-sm hover:shadow transition text-xs space-y-3 transform duration-150 ${
                                dragAllowed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                              } ${
                                overdue
                                  ? 'border-rose-500 shadow shadow-rose-500/5 dark:shadow-rose-500/10'
                                  : 'border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-800'
                              }`}
                            >
                              {/* Top metadata */}
                              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                <span className="font-mono text-slate-450 truncate max-w-[80px]">
                                  {task.taskId || 'T1000'}
                                </span>
                                <div className="flex gap-1 items-center">
                                  {overdue && (
                                    <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded flex items-center gap-0.5 animate-pulse font-bold">
                                      <Clock className="h-2.5 w-2.5" />
                                      Overdue
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.2 rounded ${priorityColors[task.priority]}`}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>

                              {/* Task Name */}
                              <div className="space-y-1">
                                <h4
                                  onClick={() => handleOpenDetails(task)}
                                  className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer transition"
                                >
                                  {task.taskName}
                                </h4>
                                {task.clientId?.companyName && (
                                  <span className="text-[10px] text-slate-400 font-bold block truncate">
                                    {task.clientId.companyName}
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
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

                              {/* Bottom Details */}
                              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-900 text-[10px] text-slate-400 font-semibold">
                                <div className="flex items-center gap-1.5 truncate max-w-[100px]">
                                  <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-450 border border-slate-200 dark:border-slate-900 flex items-center justify-center shrink-0 uppercase">
                                    {task.assignedEmployee?.name?.charAt(0) || '?'}
                                  </div>
                                  <span className="truncate">{task.assignedEmployee?.name || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0 text-slate-450 font-bold">
                                  <Calendar className="h-3 w-3" />
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                                </div>
                              </div>

                              {/* Card Actions menu */}
                              <div className="flex justify-end gap-1.5 pt-1.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition duration-150">
                                <button
                                  onClick={() => handleOpenDetails(task)}
                                  className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                                  title="View detailed drawer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {isManagerOrTL && (
                                  <>
                                    <button
                                      onClick={() => navigate(`/task-form/${task._id}`)}
                                      className="p-1 rounded text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-indigo-500 cursor-pointer"
                                      title="Edit details"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteTask(task)}
                                      className="p-1 rounded text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-red-500 cursor-pointer"
                                      title="Delete task"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}

                      {hasMore && (
                        <button
                          onClick={() =>
                            setVisibleLimits((prev) => ({
                              ...prev,
                              [colTitle]: limit + 10,
                            }))
                          }
                          className="w-full py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-indigo-500 hover:text-indigo-650 rounded-xl text-[10px] font-bold uppercase transition active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1 mt-1"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                          Load More ({columnTasks.length - limit} left)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW DETAILED TASK SLIDE-OVER OVERLAY DRAWER */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-950 h-screen border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col space-y-6 animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-150 dark:border-slate-900 pb-4">
              <div className="space-y-1 max-w-[80%]">
                <div className="flex items-center gap-2 flex-wrap text-[9px] font-bold uppercase tracking-wider">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    ID: {viewingTask.taskId}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-md ${priorityColors[viewingTask.priority]}`}>
                    {viewingTask.priority}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-md ${statusColors[viewingTask.status]}`}>
                    {viewingTask.status}
                  </span>
                  {isOverdue(viewingTask) && (
                    <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold animate-pulse">
                      Overdue
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-slate-850 dark:text-white font-heading mt-1 break-words">
                  {viewingTask.taskName}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Financial Year: <span className="text-slate-600 dark:text-slate-200 font-bold">{viewingTask.financialYear}</span>
                  {viewingTask.estimatedHours > 0 && (
                    <span className="ml-3">
                      Est. Hours: <span className="text-slate-600 dark:text-slate-200 font-bold">{viewingTask.estimatedHours} hrs</span>
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setViewingTask(null)}
                className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 space-y-6 text-xs leading-relaxed">
              {/* Task Description */}
              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">
                  Description / Scope
                </span>
                <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-850 p-4 rounded-xl text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                  {viewingTask.taskDescription || 'No description provided.'}
                </div>
              </div>

              {/* Client & Assignees Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-indigo-500" />
                    Client Account
                  </span>
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-800 dark:text-white">
                      {viewingTask.clientId?.companyName || viewingTask.clientId?.clientName || 'Unknown Client'}
                    </p>
                    <p className="text-[9px] text-slate-450 font-mono font-bold">
                      ID: {viewingTask.clientId?.clientId || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-indigo-500" />
                    Assigned Staff
                  </span>
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-850 dark:text-slate-150">
                      {viewingTask.assignedEmployee?.name || viewingTask.assignedTo?.name || 'Unassigned'}
                    </p>
                    <p className="text-[9px] text-slate-450 font-mono">
                      EMP: {viewingTask.assignedEmployee?.employeeId || viewingTask.assignedTo?.employeeId || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-amber-500" />
                    Manager
                  </span>
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-850 dark:text-slate-150">
                      {viewingTask.assignedTeamLead?.name || 'No Manager Assigned'}
                    </p>
                    {viewingTask.assignedTeamLead && (
                      <p className="text-[9px] text-slate-450 font-mono">
                        Manager ID: {viewingTask.assignedTeamLead?.employeeId || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-slate-100 dark:border-slate-900 py-4">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">
                    Start Date
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {viewingTask.startDate ? new Date(viewingTask.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">
                    Due Date
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className={isOverdue(viewingTask) ? 'text-rose-500 font-bold' : ''}>
                      {viewingTask.dueDate ? new Date(viewingTask.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">
                    Completion Date
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-slate-405" />
                    {viewingTask.completionDate ? new Date(viewingTask.completionDate).toLocaleDateString() : 'Active/Pending'}
                  </p>
                </div>
              </div>

              {/* Internal notes & Client visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Client Visible</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${viewingTask.clientVisible === 'Yes' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
                    {viewingTask.clientVisible === 'Yes' ? 'Yes (Visible to Client)' : 'No (Internal Only)'}
                  </span>
                </div>
                {viewingTask.internalNotes && (
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Internal Notes</span>
                    <p className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-850 p-2.5 rounded-lg text-slate-600 dark:text-slate-405 italic">
                      {viewingTask.internalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress, Remarks, & Status Updater */}
              {!isClient && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-850 rounded-xl space-y-4">
                  <span className="text-slate-800 dark:text-white font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Update Progress, Remarks & Status
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase block">Status</label>
                      <select
                        value={inlineStatus}
                        onChange={(e) => setInlineStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {allStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-450 uppercase block">Progress</label>
                        <span className="font-bold text-indigo-500 text-[10px]">{inlineProgress}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={inlineStatus === 'Completed'}
                        value={inlineStatus === 'Completed' ? 100 : inlineProgress}
                        onChange={(e) => setInlineProgress(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50 mt-1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase block">Remarks / Notes</label>
                      <input
                        type="text"
                        value={inlineRemarks}
                        onChange={(e) => setInlineRemarks(e.target.value)}
                        placeholder="Remarks on completion..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleInlineSave}
                      disabled={inlineSaving}
                      className="py-1.5 px-4 bg-indigo-500 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-indigo-600 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      {inlineSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                      Save Updates
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="space-y-2.5">
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  Task Attachments
                </span>
                
                {/* Upload Form */}
                {!isClient && (
                  <form onSubmit={handleAddAttachment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add document links, Google Sheets, Drive URLs..."
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={attachmentSaving || !attachmentUrl.trim()}
                      className="py-2 px-3.5 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      {attachmentSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                      Add Link
                    </button>
                  </form>
                )}

                {/* Attachments list */}
                <div className="space-y-1.5">
                  {!viewingTask.attachments || viewingTask.attachments.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic">No attachments linked to this task.</p>
                  ) : (
                    viewingTask.attachments.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-150 dark:border-slate-900 text-indigo-550 dark:text-indigo-400 hover:underline truncate"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{link}</span>
                      </a>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Audit log timeline */}
              <div className="space-y-2.5">
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <History className="h-3.5 w-3.5" />
                  Task Activity Log
                </span>
                <div className="bg-slate-50/30 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-850 rounded-xl p-3.5 max-h-48 overflow-y-auto space-y-3">
                  {!viewingTask.activityLogs || viewingTask.activityLogs.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic text-center">No logs recorded.</p>
                  ) : (
                    viewingTask.activityLogs.map((log, idx) => (
                      <div key={idx} className="relative flex gap-3 text-[11px] leading-tight">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                          {idx !== viewingTask.activityLogs.length - 1 && (
                            <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 my-1" />
                          )}
                        </div>
                        <div className="space-y-0.5 pb-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {log.action}
                            {log.oldValue && (
                              <span className="text-slate-400 font-medium ml-1">
                                (from {log.oldValue} to {log.newValue})
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] text-slate-450 font-bold">
                            By {log.userName || 'System'} • {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Task comments Chronological section */}
              <div className="space-y-3">
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments ({comments.length})
                </span>

                {/* Comment box */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask questions or type task updates..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                {/* Comments chronological list */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic text-center py-4">No comments posted yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c._id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-900 bg-slate-50/[0.2] dark:bg-slate-900/[0.2] space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                          <span>{c.user?.name}</span>
                          <span>{new Date(c.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-350 font-semibold">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold font-heading text-slate-800 dark:text-white">Delete Task?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed">
              Are you sure you want to permanently delete task <span className="font-bold font-mono text-slate-700 dark:text-white">{confirmDeleteTask.taskId}</span>? This action is irreversible.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteTask(null)}
                className="py-2 px-4 rounded-xl border border-slate-250 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteTask._id)}
                disabled={deleting}
                className="py-2 px-4 rounded-xl bg-rose-505 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTracker;
