import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import {
  MessageSquare,
  Send,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Paperclip,
} from 'lucide-react';

const ServiceRequests = () => {
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();

  const isClient = user?.role?.name === 'Client';
  const canAssignSpecialist = ['CA Login', 'Manager'].includes(user?.role?.name);

  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected Ticket for Chat Timeline
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Typing indicator states
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherTypingName, setOtherTypingName] = useState('');
  const typingTimeoutRef = useRef(null);

  // Chat attachments states
  const [chatAttachments, setChatAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Raised Ticket attachments states
  const [raiseAttachments, setRaiseAttachments] = useState([]);
  const fileInputRaiseRef = useRef(null);

  const chatEndRef = useRef(null);
  const selectedTicketIdRef = useRef(null);

  // Raised Ticket fields (Client only)
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [raiseCategory, setRaiseCategory] = useState('General Support');
  const [raiseTitle, setRaiseTitle] = useState('');
  const [raiseDesc, setRaiseDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status updates & assignments (Staff only)
  const [editStatus, setEditStatus] = useState('Open');
  const [editAssignee, setEditAssignee] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);

  const categories = ['GST', 'Income Tax', 'Audit', 'ROC', 'Registration', 'General Support'];
  const statuses = ['Open', 'Assigned', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed'];

  const statusColors = {
    Open: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
    Assigned: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    'In Progress': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    'Waiting for Client': 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    Resolved: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    Closed: 'bg-slate-100 text-slate-500 dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
  };

  const fetchTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get('/tickets');
      if (response.data?.success) {
        setTickets(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch support tickets.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (isClient) return;
    try {
      const response = await api.get('/employees');
      if (response.data?.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  }, [isClient]);

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, [fetchTickets, fetchEmployees]);

  // Keep tracking ref of selected ticket ID to prevent re-registering socket listeners
  useEffect(() => {
    selectedTicketIdRef.current = selectedTicket?._id;
  }, [selectedTicket?._id]);

  // Scroll chat thread to bottom on initial load and when new comments arrive
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?._id, selectedTicket?.comments?.length]);

  // Sync selected ticket updates from the ticket list without triggering an infinite loop
  useEffect(() => {
    if (selectedTicket && tickets.length > 0) {
      const updated = tickets.find(t => t._id === selectedTicket._id);
      if (updated) {
        const hasChanged = JSON.stringify(updated) !== JSON.stringify(selectedTicket);
        
        if (hasChanged) {
          setSelectedTicket(updated);
          setEditStatus(updated.status);
          setEditAssignee(updated.assignedTo?._id || '');
        }
      }
    }
  }, [tickets, selectedTicket]);

  // Real-time room joining: join ticket chat room and clear state on leave (depends on ID only)
  useEffect(() => {
    if (socket && selectedTicket?._id) {
      socket.emit('joinTicket', { ticketId: selectedTicket._id });
      
      // Silently fetch to load newest read receipts immediately
      fetchTickets(true);

      return () => {
        socket.emit('leaveTicket', { ticketId: selectedTicket._id });
        setIsOtherTyping(false);
        setOtherTypingName('');
      };
    }
  }, [socket, selectedTicket?._id, fetchTickets]);

  // Real-time synchronization: listen for Socket.IO ticket, typing, and commentsRead events
  useEffect(() => {
    if (socket) {
      const handleTicketChange = () => {
        fetchTickets(true);
      };

      const handleTyping = ({ ticketId, userName, isTyping }) => {
        if (selectedTicketIdRef.current === ticketId) {
          setIsOtherTyping(isTyping);
          setOtherTypingName(userName);
        }
      };

      socket.on('ticketCreated', handleTicketChange);
      socket.on('ticketAssigned', handleTicketChange);
      socket.on('ticketUpdated', handleTicketChange);
      socket.on('ticketClosed', handleTicketChange);
      socket.on('newMessage', handleTicketChange);
      socket.on('commentsRead', handleTicketChange);
      socket.on('typing', handleTyping);

      return () => {
        socket.off('ticketCreated', handleTicketChange);
        socket.off('ticketAssigned', handleTicketChange);
        socket.off('ticketUpdated', handleTicketChange);
        socket.off('ticketClosed', handleTicketChange);
        socket.off('newMessage', handleTicketChange);
        socket.off('commentsRead', handleTicketChange);
        socket.off('typing', handleTyping);
      };
    }
  }, [socket, fetchTickets]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!raiseTitle || !raiseDesc) {
      setError('Please fill in title and description.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/tickets', {
        category: raiseCategory,
        title: raiseTitle,
        description: raiseDesc,
        attachments: raiseAttachments,
      });

      if (response.data?.success) {
        setSuccess('Support ticket submitted successfully!');
        setRaiseTitle('');
        setRaiseDesc('');
        setRaiseAttachments([]);
        fetchTickets();
        setTimeout(() => {
          setIsRaiseOpen(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error raising ticket:', err);
      setError(err.response?.data?.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        setRaiseAttachments((prev) => [
          ...prev,
          { name: file.name, fileUrl: response.data.url },
        ]);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploadingFile(false);
      if (fileInputRaiseRef.current) fileInputRaiseRef.current.value = '';
    }
  };

  const removeRaiseAttachment = (index) => {
    setRaiseAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommentTextChange = (e) => {
    setCommentText(e.target.value);

    if (socket && selectedTicket) {
      socket.emit('typing', { ticketId: selectedTicket._id, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { ticketId: selectedTicket._id, isTyping: false });
      }, 2000);
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        setChatAttachments((prev) => [
          ...prev,
          { name: file.name, fileUrl: response.data.url },
        ]);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeChatAttachment = (index) => {
    setChatAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText || !selectedTicket) return;

    setCommenting(true);
    try {
      // Clear typing indicator
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket) {
        socket.emit('typing', { ticketId: selectedTicket._id, isTyping: false });
      }

      const response = await api.post(`/tickets/${selectedTicket._id}/comments`, {
        comment: commentText,
        attachments: chatAttachments,
      });
      if (response.data?.success) {
        setCommentText('');
        setChatAttachments([]);
        fetchTickets(true);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
      setError('Failed to send comment.');
    } finally {
      setCommenting(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdatingTicket(true);
    try {
      const payload = { status: editStatus };
      const currentAssigneeId = selectedTicket.assignedTo?._id || '';
      if (canAssignSpecialist && editAssignee !== currentAssigneeId) {
        payload.assignedToId = editAssignee || undefined;
      }
      const response = await api.put(`/tickets/${selectedTicket._id}`, payload);
      if (response.data?.success) {
        fetchTickets(true);
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      setError('Failed to update ticket metadata.');
    } finally {
      setUpdatingTicket(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Compliance Support Queries
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit tax Advisory requests and consult directly with your assigned accountant.
          </p>
        </div>
        {isClient && (
          <button
            onClick={() => setIsRaiseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Raise Support Ticket
          </button>
        )}
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

      {/* Grid: Tickets List vs. Interactive Chat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left list queue */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4 max-h-[550px] overflow-y-auto pr-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
              Support Tickets Directory
            </h3>
            <hr className="border-slate-100 dark:border-slate-900" />

            {loading && tickets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-455">Loading support folder...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-slate-450 italic">No tickets raised.</div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setEditStatus(t.status);
                      setEditAssignee(t.assignedTo?._id || '');
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-xs space-y-2.5 ${
                      selectedTicket?._id === t._id
                        ? 'border-indigo-500 bg-indigo-500/[0.02]'
                        : 'border-slate-200/50 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-900/10 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.ticketNumber}</span>
                      <span className={`inline-block rounded px-1.5 py-0.2 text-[8px] font-bold uppercase ${statusColors[t.status]}`}>
                        {t.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-750 dark:text-slate-250 line-clamp-1">{t.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Category: {t.category}</p>
                    </div>
                    {!isClient && (
                      <p className="text-[10px] text-slate-450 font-semibold truncate pt-1 border-t border-slate-100 dark:border-slate-900">
                        Client: {t.client?.companyName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right chat logs timeline */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm flex flex-col h-[550px]">
              {/* Timeline Header Info */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-900">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{selectedTicket.ticketNumber}</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">{selectedTicket.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusColors[selectedTicket.status]}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
                {/* Description ticket body */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-850 space-y-1">
                  <span className="font-bold text-[10px] text-indigo-500 block uppercase">Description</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Comment Logs */}
                {selectedTicket.comments?.map((c, i) => {
                  const isCurrentUser = c.user === user.id || c.user === user._id;
                  return (
                    <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${isCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-450 font-bold select-none">
                        <span>{c.userName} ({c.role})</span>
                        <span>•</span>
                        <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-3 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-indigo-500 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-250 rounded-tl-none border border-slate-200/20 dark:border-slate-800'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5 border-t border-white/20 dark:border-slate-800/40 pt-1.5">
                            {c.attachments.map((file, idx) => (
                              <a
                                key={idx}
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 p-1.5 rounded text-[10px] font-bold hover:underline transition max-w-[200px] ${
                                  isCurrentUser
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-850 dark:text-slate-200 border border-slate-300/30 dark:border-slate-700/30'
                                }`}
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="truncate">{file.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {isCurrentUser && (
                        <div className="text-[8px] font-bold uppercase tracking-wider text-right pr-1">
                          {c.read ? (
                            <span className="text-emerald-500 flex items-center justify-end gap-0.5">
                              Read ✓✓
                            </span>
                          ) : (
                            <span className="text-slate-400">Sent ✓</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Actions & Chat Input Footer */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-900 space-y-3.5">
                {/* Staff metadata updates */}
                {!isClient && (
                  <form onSubmit={handleUpdateTicket} className="flex flex-wrap items-end gap-3 text-[10px] bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-850">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wide">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-transparent text-slate-850 dark:text-white cursor-pointer focus:outline-none"
                      >
                        {statuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {canAssignSpecialist && (
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-400 uppercase tracking-wide">Assign Specialist</label>
                        <select
                          value={editAssignee}
                          onChange={(e) => setEditAssignee(e.target.value)}
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-transparent text-slate-850 dark:text-white cursor-pointer focus:outline-none"
                        >
                          <option value="">Choose Specialist</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={updatingTicket}
                      className="py-1.5 px-3 bg-indigo-500 text-white font-bold rounded cursor-pointer hover:bg-indigo-600 disabled:opacity-50 transition"
                    >
                      Save Meta
                    </button>
                  </form>
                )}

                {/* Comment Input */}
                {selectedTicket.status === 'Closed' ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-850 text-center text-slate-500 dark:text-slate-400 font-semibold italic text-[10px] uppercase tracking-wider">
                    This support ticket has been closed. Comments are disabled.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Typing status indicator */}
                    {isOtherTyping && (
                      <p className="text-[10px] text-slate-400 font-semibold animate-pulse italic">
                        {otherTypingName} is typing...
                      </p>
                    )}

                    {/* Chat attachments list */}
                    {chatAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {chatAttachments.map((file, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border border-indigo-100 dark:border-indigo-900/50 rounded-lg px-2 py-0.5 text-[10px] font-bold">
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeChatAttachment(idx)}
                              className="text-indigo-400 hover:text-indigo-650 font-black cursor-pointer ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <button
                        type="button"
                        disabled={uploadingFile || commenting}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition shrink-0 cursor-pointer disabled:opacity-50"
                        title="Attach a file"
                      >
                        <Paperclip className="h-4.5 w-4.5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />

                      <input
                        type="text"
                        placeholder={uploadingFile ? "Uploading file attachment..." : "Type comments, advises, or instructions..."}
                        value={commentText}
                        onChange={handleCommentTextChange}
                        disabled={uploadingFile}
                        className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none focus:border-indigo-500 transition text-slate-800 dark:text-white text-xs disabled:opacity-50"
                        required
                      />

                      <button
                        type="submit"
                        disabled={commenting || uploadingFile}
                        className="p-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="h-4.5 w-4.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-100/50 dark:bg-slate-900/10 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl p-16 text-center space-y-2 text-xs h-[550px] flex flex-col justify-center items-center">
              <MessageSquare className="h-8 w-8 text-slate-400 animate-pulse" />
              <p className="font-bold text-slate-700 dark:text-slate-455">Select a ticket</p>
              <p className="text-slate-450 leading-relaxed max-w-xs">Please select a support ticket from the directory registry on the left to review chat histories.</p>
            </div>
          )}
        </div>

      </div>

      {/* Raise Support Ticket Modal (Client only) */}
      {isRaiseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Submit Support Ticket
              </h3>
              <button
                onClick={() => setIsRaiseOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                <select
                  value={raiseCategory}
                  onChange={(e) => setRaiseCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Summary / Title</label>
                <input
                  type="text"
                  placeholder="e.g. GST portal login authentication issues"
                  value={raiseTitle}
                  onChange={(e) => setRaiseTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Problem Description</label>
                <textarea
                  placeholder="Elaborate details regarding errors, questions, or clarification requirements..."
                  value={raiseDesc}
                  onChange={(e) => setRaiseDesc(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Attachments for raised ticket */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Attachments (Optional)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={uploadingFile}
                    onClick={() => fileInputRaiseRef.current?.click()}
                    className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attach File</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRaiseRef}
                    onChange={handleRaiseAttachmentUpload}
                    className="hidden"
                  />
                  {uploadingFile && <span className="text-[10px] text-slate-400 animate-pulse">Uploading file...</span>}
                </div>
                {raiseAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {raiseAttachments.map((file, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border border-indigo-100 dark:border-indigo-900/50 rounded-lg px-2 py-0.5 text-[10px] font-bold">
                        <Paperclip className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeRaiseAttachment(idx)}
                          className="text-indigo-400 hover:text-indigo-650 font-black cursor-pointer ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting query...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequests;
