import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  Edit2,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  FolderDot,
  Contact,
  Activity,
  CheckCircle2,
  FileText,
  Clock,
  Eye,
  MessageSquare,
  History,
  Send,
  ExternalLink,
  TrendingUp,
  X,
} from 'lucide-react';

const ClientProfile = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab State: 'details' or 'tasks'
  const [activeTab, setActiveTab] = useState('details');

  // Client Tasks States
  const [clientTasks, setClientTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState('');

  // Selected Task Drawer State
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [inlineStatus, setInlineStatus] = useState('');
  const [inlineRemarks, setInlineRemarks] = useState('');
  const [inlineSaving, setInlineSaving] = useState(false);

  const fetchClientDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/clients/${id}`);
      if (response.data?.success) {
        setClient(response.data.data);
      } else {
        setError('Failed to fetch client profile details');
      }
    } catch (err) {
      console.error('Error fetching client details:', err.message);
      setError(err.response?.data?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchClientTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError('');
    try {
      const response = await api.get(`/tasks/client/${id}`);
      if (response.data?.success) {
        setClientTasks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching client tasks:', err);
      setTasksError('Failed to load client tasks.');
    } finally {
      setTasksLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchClientTasks();
    }
  }, [activeTab, fetchClientTasks]);

  const handleDeleteClient = async () => {
    if (!client) return;
    if (!window.confirm(`Are you sure you want to delete client "${client.clientName}" (${client.clientId})? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);
    setError('');
    try {
      const response = await api.delete(`/clients/${client._id}`);
      if (response.data?.success) {
        navigate('/clients');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete client');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open Task Drawer Details
  const handleOpenTaskDrawer = async (task) => {
    setSelectedTask(task);
    setInlineStatus(task.status);
    setInlineRemarks(task.completionRemarks || task.remarks || '');
    setNewComment('');
    setTaskComments([]);

    try {
      const response = await api.get(`/tasks/${task._id}/comments`);
      if (response.data?.success) {
        setTaskComments(response.data.data);
      }
    } catch (err) {
      console.error('Error loading task comments:', err);
    }
  };

  // Submit Comments from Drawer
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    setCommentLoading(true);

    try {
      const response = await api.post(`/tasks/${selectedTask._id}/comments`, { comment: newComment.trim() });
      if (response.data?.success) {
        setTaskComments([...taskComments, response.data.data]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  // Save Progress updates from Client Profile drawer
  const handleSaveProgress = async () => {
    if (!selectedTask) return;
    setInlineSaving(true);
    try {
      const response = await api.put(`/tasks/${selectedTask._id}`, {
        status: inlineStatus,
        completionRemarks: inlineRemarks,
      });

      if (response.data?.success) {
        // Refresh local task details
        setSelectedTask(response.data.data);
        setClientTasks(clientTasks.map((t) => (t._id === selectedTask._id ? response.data.data : t)));
      }
    } catch (err) {
      console.error('Error updating task progress:', err);
      alert(err.response?.data?.message || 'Failed to update progress.');
    } finally {
      setInlineSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Loading client profile...
        </span>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
            Client Details
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5" />
          {error || 'Client profile not found'}
        </div>
      </div>
    );
  }

  const isCALoginOrAdmin = ['Admin', 'CA Login'].includes(currentUser?.role?.name);
  const isManager = currentUser?.role?.name === 'Manager';
  const isClientRole = currentUser?.role?.name === 'Client';
  const canEdit = isCALoginOrAdmin ||
    (isManager && client.assignedTeamLead?._id === currentUser?.id) ||
    (client.assignedEmployee?._id === currentUser?.id);

  // Status and Priority styling config
  const statusColors = {
    'To Do': 'bg-slate-100 text-slate-700 dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
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

  // Check dynamic overdue
  const isTaskOverdue = (task) => {
    if (task.status === 'Completed') return false;
    return task.dueDate && new Date() > new Date(task.dueDate);
  };

  // Compute Client Tasks metrics
  const completedTasksCount = clientTasks.filter((t) => t.status === 'Completed').length;
  const overdueTasksCount = clientTasks.filter((t) => t.status !== 'Completed' && isTaskOverdue(t)).length;
  const openTasksCount = clientTasks.filter((t) => t.status !== 'Completed' && !isTaskOverdue(t)).length;

  // Combined activities feed chronologically
  const recentActivities = [];
  clientTasks.forEach((task) => {
    if (task.activityLogs) {
      task.activityLogs.forEach((log) => {
        recentActivities.push({
          ...log,
          taskName: task.taskName,
          taskId: task.taskId,
        });
      });
    }
  });
  recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const displayedActivities = recentActivities.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            title="Back to List"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
                {client.clientName}
              </h2>
              <span className="text-xs font-bold text-slate-455">({client.clientId})</span>
            </div>
            {client.businessName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {client.businessName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              to={`/clients/edit/${client._id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 text-white px-4 py-2.5 text-xs font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer active:scale-95"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Link>
          )}

          {isCALoginOrAdmin && (
            <button
              onClick={handleDeleteClient}
              disabled={deleteLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-500 px-4 py-2.5 text-xs font-semibold hover:bg-rose-100/50 transition cursor-pointer active:scale-95"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation control */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
            activeTab === 'details'
              ? 'border-indigo-505 border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
            activeTab === 'tasks'
              ? 'border-indigo-505 border-indigo-500 text-indigo-500'
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Tasks Setup & Activity
        </button>
      </div>

      {/* TAB CONTENT: DETAILS */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Card 1: Main Overview Profile */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">


            <div className="flex flex-col items-center py-6 text-center border-y border-slate-100 dark:border-slate-900 my-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/25 mb-4">
                {client.clientName.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-850 dark:text-slate-150 leading-tight">
                {client.clientName}
              </h3>
              <span className="text-[11px] font-bold text-indigo-500 mt-1 block">
                ID: {client.clientId}
              </span>
              {client.fileNumber && (
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  File No: {client.fileNumber}
                </span>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">Client Type:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{client.clientType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">Case Type:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{client.caseType || 'N/A'}</span>
              </div>
              {client.accountantName && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Accountant:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{client.accountantName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">Regularity:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{client.regularityType || 'Regular'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">PAN Number:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono tracking-wider">{client.panNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">Aadhaar UID:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono tracking-wider">{client.aadhaarNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Info & Gov Credentials */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
              <Contact className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Contact & Registrations
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                  Primary Phone
                </span>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-250">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{client.phoneNumber}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                  WhatsApp contact
                </span>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-250">
                  <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{client.whatsappNumber || <span className="text-slate-400 font-medium italic">Not provided</span>}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                  Email Address
                </span>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-250">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{client.email || <span className="text-slate-400 font-medium italic">Not logged</span>}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                  DOB / Date of Incorporation
                </span>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-250">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{client.dobDof ? new Date(client.dobDof).toLocaleDateString(undefined, { dateStyle: 'medium' }) : <span className="text-slate-400 font-medium italic">Not logged</span>}</span>
                </div>
              </div>



              <div className="space-y-1 sm:col-span-2 border-t border-slate-100 dark:border-slate-900 pt-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                  Physical Street Address
                </span>
                <p className="font-semibold text-slate-650 dark:text-slate-355 leading-relaxed">
                  {client.address || <span className="text-slate-400 font-medium italic">No address description logged</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Assignees Handler Info */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
              <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Management & Assignment
              </h3>
            </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
                <span className="inline-block rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-1.5 py-0.2 text-[8px] font-bold uppercase">
                  Assigned Team Lead
                </span>
                {client.assignedTeamLead ? (
                  <div className="space-y-1 mt-1">
                    <p className="font-bold text-slate-855 dark:text-slate-150">
                      {client.assignedTeamLead.name} <span className="text-[10px] text-slate-400 font-semibold">({client.assignedTeamLead.role?.name || 'Manager'})</span>
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Mail className="h-3 w-3" />
                      {client.assignedTeamLead.email}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic font-semibold mt-1">No Team Lead assigned yet.</p>
                )}
              </div>
          </div>

          {/* Card 4: Services Opted Checklist */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
              <FolderDot className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Service Setup Details
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                  Opted Work Programs
                </span>
                {client.servicesOpted && client.servicesOpted.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {client.servicesOpted.map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-500/[0.04] text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400 px-3 py-1 font-bold text-[11px]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic font-medium">No active services checked under this profile.</p>
                )}
              </div>



              <div className="space-y-1 border-t border-slate-100 dark:border-slate-900 pt-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                  General Notes / Remarks
                </span>
                <p className="font-semibold text-slate-650 dark:text-slate-350 italic">
                  {client.remarks || 'No notes logged.'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Audit timelines */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4 md:col-span-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Profile Audit Timeline
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div>
                <span>Record Created: </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold ml-1">
                  {new Date(client.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span>Last Modified: </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold ml-1">
                  {new Date(client.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              {client.user && (
                <div className="text-emerald-500 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Portal Login Provisioned</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TASKS SETUP & ACTIVITY */}
      {activeTab === 'tasks' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tasks statistics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Tasks</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-indigo-505 dark:text-indigo-400 font-heading">{openTasksCount}</span>
                <TrendingUp className="h-4 w-4 text-indigo-500/80" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Completed Tasks</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-emerald-500 font-heading">{completedTasksCount}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-rose-500/25 bg-rose-500/[0.01] rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-rose-505 uppercase tracking-wider">Overdue Tasks</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-rose-500 font-heading">{overdueTasksCount}</span>
                <AlertCircle className="h-4 w-4 text-rose-500 animate-bounce" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Ledger table list (2 cols span) */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850/80 rounded-xl p-4 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Associated Task Registry
                </h3>
              </div>

              {tasksLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
              ) : tasksError ? (
                <p className="text-xs text-rose-500 text-center font-bold py-6">{tasksError}</p>
              ) : clientTasks.length === 0 ? (
                <p className="text-xs text-slate-450 italic py-12 text-center">No compliance tasks assigned for this client.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-900 text-[10px] font-black uppercase text-slate-400 select-none">
                        <th className="pb-2">Task ID</th>
                        <th className="pb-2">Task Name</th>
                        <th className="pb-2">Assignee</th>
                        <th className="pb-2">Priority</th>
                        <th className="pb-2">Due Date</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium">
                      {clientTasks.map((t) => {
                        const overdue = isTaskOverdue(t);
                        return (
                          <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/5 transition">
                            <td className="py-3 font-mono font-bold text-slate-800 dark:text-slate-250">{t.taskId}</td>
                            <td className="py-3 truncate max-w-[150px] font-bold text-slate-800 dark:text-slate-100" title={t.taskName}>
                              {t.taskName}
                            </td>
                            <td className="py-3 text-slate-500 dark:text-slate-400">{t.assignedEmployee?.name || 'Unassigned'}</td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${priorityColors[t.priority]}`}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={overdue ? 'text-rose-500 font-bold' : ''}>
                                {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${statusColors[t.status]}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleOpenTaskDrawer(t)}
                                className="p-1 rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                                title="View details slide-over"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-500" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Combined Recent Activities Log feed */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850/80 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-3">
                <History className="h-4.5 w-4.5 text-indigo-505" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Recent Activities Timeline
                </h3>
              </div>

              <div className="space-y-3.5 overflow-y-auto max-h-96 pr-0.5">
                {displayedActivities.length === 0 ? (
                  <p className="text-[10px] text-slate-450 italic py-8 text-center">No tasks logs recorded yet.</p>
                ) : (
                  displayedActivities.map((log, idx) => (
                    <div key={idx} className="relative flex gap-2 text-[10px] leading-tight">
                      <div className="flex flex-col items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                        {idx !== displayedActivities.length - 1 && (
                          <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 my-1" />
                        )}
                      </div>
                      <div className="space-y-0.5 pb-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-350">
                          {log.action} for task <span className="font-mono text-slate-500 font-bold">{log.taskId}</span>
                        </p>
                        <p className="text-[9px] text-slate-450 font-bold">
                          By {log.userName || 'System'} • {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER MODAL OVERLAY: SELECTED TASK DETAILS */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-950 h-screen border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col space-y-6 animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-150 dark:border-slate-900 pb-4">
              <div className="space-y-1 max-w-[85%]">
                <div className="flex items-center gap-2 flex-wrap text-[9px] font-bold uppercase tracking-wider">
                  <span className="font-mono text-slate-500 dark:text-slate-400">ID: {selectedTask.taskId}</span>
                  <span className={`px-1.5 py-0.2 rounded ${priorityColors[selectedTask.priority]}`}>
                    {selectedTask.priority}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded ${statusColors[selectedTask.status]}`}>
                    {selectedTask.status}
                  </span>
                  {isTaskOverdue(selectedTask) && (
                    <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold animate-pulse">
                      Overdue
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-slate-850 dark:text-white font-heading mt-1 break-words leading-tight">
                  {selectedTask.taskName}
                </h3>
                {selectedTask.financialYear && (
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Financial Year: <span className="text-slate-600 dark:text-slate-250 font-bold">{selectedTask.financialYear}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 text-xs leading-relaxed">
              {/* Scope Description */}
              {selectedTask.taskDescription && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Guidelines & Scope</span>
                  <p className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-850 p-3.5 rounded-xl font-medium text-slate-700 dark:text-slate-350">
                    {selectedTask.taskDescription}
                  </p>
                </div>
              )}

              {/* Assignments & estimated hours */}
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="p-3 bg-slate-50/20 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-850 rounded-xl">
                  <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Assigned Staff</span>
                  <p className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedTask.assignedEmployee?.name || 'Unassigned'}</p>
                </div>
                <div className="p-3 bg-slate-50/20 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-850 rounded-xl">
                  <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Estimated Effort</span>
                  <p className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedTask.estimatedHours || 0} Hours</p>
                </div>
              </div>

              {/* Progress & remarks editor (for assigned employee / managers only) */}
              {!isClientRole && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-850 rounded-xl space-y-3">
                  <span className="text-slate-800 dark:text-white font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Update Progress & Status
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase block">Status</label>
                      <select
                        value={inlineStatus}
                        onChange={(e) => setInlineStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {Object.keys(statusColors).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase block">Remarks / Notes</label>
                      <input
                        type="text"
                        value={inlineRemarks}
                        onChange={(e) => setInlineRemarks(e.target.value)}
                        placeholder="Add updates..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveProgress}
                      disabled={inlineSaving}
                      className="py-1.5 px-4 bg-indigo-500 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-indigo-600 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      {inlineSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                      Save Updates
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments links */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Linked Deliverables</span>
                  <div className="space-y-1">
                    {selectedTask.attachments.map((link, idx) => (
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
                    ))}
                  </div>
                </div>
              )}

              {/* Activity log details */}
              <div className="space-y-2">
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <History className="h-3.5 w-3.5" />
                  Task Audit Log
                </span>
                <div className="bg-slate-50/20 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-850 rounded-xl p-3.5 max-h-36 overflow-y-auto space-y-2">
                  {!selectedTask.activityLogs || selectedTask.activityLogs.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic text-center">No activity logged.</p>
                  ) : (
                    selectedTask.activityLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-start text-[10px] py-0.5 border-b border-slate-100 dark:border-slate-900/55 last:border-b-0">
                        <span className="text-slate-700 dark:text-slate-350">{log.action}</span>
                        <span className="text-[8px] text-slate-400 ml-4 font-bold shrink-0">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Task Comments history */}
              <div className="space-y-3">
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Task Comments History ({taskComments.length})
                </span>

                {/* Comment box */}
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add comments or task clarifications..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="p-1.5 rounded-lg bg-indigo-505 bg-indigo-500 text-white hover:bg-indigo-600 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Chronological list */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {taskComments.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic text-center py-2">No comments posted.</p>
                  ) : (
                    taskComments.map((c) => (
                      <div key={c._id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-900 bg-slate-50/[0.2] dark:bg-slate-900/[0.2] space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase">
                          <span>{c.user?.name}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
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
    </div>
  );
};

export default ClientProfile;
