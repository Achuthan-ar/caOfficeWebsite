import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import { Bell, CheckCheck, Trash2, Clock, Inbox, ShieldAlert } from 'lucide-react';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (item) => {
    await markAsRead(item._id);
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Notification Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View security audit logs, compliance alerts, document requests, and system updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-500 hover:bg-indigo-500/10 px-4 py-2 text-sm font-semibold transition cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Grid List layout */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-900">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-heading">
            Alert Logs Feed ({notifications.length} total, {unreadCount} unread)
          </h3>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Inbox className="h-10 w-10 text-slate-455 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Inbox is empty</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">You do not have any new compliance alerts or notifications at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
            {notifications.map((item) => (
              <div
                key={item._id}
                onClick={() => handleNotificationClick(item)}
                className={`py-4 flex gap-4 cursor-pointer transition select-none first:pt-0 last:pb-0 ${
                  item.isRead
                    ? 'opacity-65 hover:opacity-100'
                    : 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] font-medium'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 h-fit ${
                  item.isRead
                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-900'
                    : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                }`}>
                  {item.type === 'Leave' || item.type === 'LeaveRequest' ? (
                    <Clock className="h-4.5 w-4.5" />
                  ) : item.type === 'Document' ? (
                    <Bell className="h-4.5 w-4.5 animate-pulse" />
                  ) : (
                    <ShieldAlert className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-655 dark:text-slate-350">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
