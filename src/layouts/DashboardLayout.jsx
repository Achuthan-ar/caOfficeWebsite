import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Briefcase,
  FileText,
  Clock,
  Bell,
  Coffee,
  FolderKanban,
  CheckCircle,
  Landmark,
  BarChart2,
  Folder,
  Calendar,
  MessageSquare,
  Receipt,
  Settings,
  User,
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Notification Store
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    connectStream,
    disconnectStream
  } = useNotificationStore();

  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const notifyDropdownRef = useRef(null);
  const [toast, setToast] = useState(null);

  const isDark = user?.role?.name !== 'Client';

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target)) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Establish real-time SSE event stream for live notifications
      connectStream((newNotify) => {
        setToast(newNotify);
        // Autohide toast after 6 seconds
        setTimeout(() => setToast(null), 6000);
      });

      return () => {
        disconnectStream();
      };
    }
  }, [user, fetchNotifications, connectStream, disconnectStream]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    {
      title: 'Attendance Tracker',
      path: '/attendance',
      icon: Clock,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Intern'],
    },
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Intern', 'Client'],
    },
    {
      title: 'Client Master',
      path: '/clients',
      icon: Users,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee'],
    },
    {
      title: 'Document Center',
      path: '/document-center',
      icon: Folder,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Intern', 'Client'],
    },
    {
      title: 'Document Requests',
      path: '/document-requests',
      icon: FileText,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee'],
    },
    {
      title: 'Pending Reviews',
      path: '/pending-documents',
      icon: Briefcase,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee'],
    },
    {
      title: 'Task Board',
      path: '/tasks',
      icon: FolderKanban,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Intern'],
    },
    {
      title: 'Compliance Calendar',
      path: '/compliance-calendar',
      icon: Calendar,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Intern', 'Client'],
    },
    {
      title: 'Billing & Invoices',
      path: '/billing-invoices',
      icon: Receipt,
      roles: ['Admin', 'CA Login', 'Client'],
    },
    {
      title: 'Support Tickets',
      path: '/service-requests',
      icon: MessageSquare,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Client'],
    },
    {
      title: 'Reports & Analytics',
      path: '/reports-analytics',
      icon: BarChart2,
      roles: ['Admin', 'CA Login', 'Manager'],
    },
    {
      title: 'Leave Request',
      path: '/leaves',
      icon: Coffee,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Intern'],
    },
    {
      title: 'Employee Directory',
      path: '/employees',
      icon: Users,
      roles: ['Admin', 'CA Login'],
    },
    {
      title: 'Monthly Worksheet',
      path: '/attendance-report',
      icon: FileText,
      roles: ['Admin', 'CA Login'],
    },
    {
      title: 'Blog Management',
      path: '/blog-admin',
      icon: FileText,
      roles: ['Admin', 'CA Login', 'Manager'],
    },
    {
      title: 'Hiring Requests',
      path: '/applications',
      icon: Briefcase,
      roles: ['Admin', 'CA Login'],
    },
    {
      title: 'Mentor Space',
      path: '/mentor-workspace',
      icon: Users,
      roles: ['Manager', 'Employee', 'Admin', 'CA Login'],
    },
    {
      title: 'Intern Dashboard',
      path: '/intern-portal',
      icon: CheckCircle,
      roles: ['Intern'],
    },
    {
      title: 'Work Reports',
      path: '/monthly-reports',
      icon: BarChart2,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee'],
    },
    {
      title: 'Manage Users',
      path: '/users',
      icon: Users,
      roles: ['Admin'],
    },
    {
      title: 'Master Lists',
      path: '/settings/masters',
      icon: Settings,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee'],
    },
    {
      title: 'Profile Settings',
      path: '/profile-settings',
      icon: Settings,
      roles: ['Admin', 'CA Login', 'Manager', 'Employee', 'Intern', 'Client'],
    },
  ];

  const roleColors = {
    Admin: 'bg-red-500/10 text-red-500 border border-red-500/20',
    'CA Login': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    Manager: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
    Employee: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    Intern: 'bg-sky-500/10 text-sky-500 border border-sky-500/20',
    Client: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
  };

  const currentRoleColor = roleColors[user?.role?.name] || 'bg-slate-500/10 text-slate-500 border border-slate-500/20';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/favicon.png" alt="D.K. NAGARAJAN Logo" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
            <div className="flex flex-col text-left">
              <span className="font-heading text-sm font-black tracking-wide text-slate-800 dark:text-white uppercase leading-none">
                D.K. NAGARAJAN
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none mt-1">
                Chartered Accountant
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navLinks
            .filter((link) => link.roles.includes(user?.role?.name))
            .map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.title}
                </Link>
              );
            })}
        </nav>

        {/* Sidebar Footer (Quick Info) */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active System Status
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-300">
                  Secure Server Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-6 z-30 transition-colors duration-300">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
              {location.pathname === '/users' ? 'Role Management' :
               location.pathname === '/attendance' ? 'Attendance Tracker' :
               location.pathname === '/employees' ? 'Employee Registry' :
               location.pathname === '/clients' ? 'Client Master Registry' :
               location.pathname === '/clients/new' || location.pathname.startsWith('/clients/edit/') ? 'Client Editor' :
               location.pathname.includes('/clients/') ? 'Client Profile Overview' :
               location.pathname === '/employee-form' || location.pathname.startsWith('/employee-form/') ? 'Employee Profile' :
               location.pathname === '/attendance-report' ? 'Attendance Worksheet' :
               location.pathname === '/leaves' ? 'Leave Management' :
               location.pathname === '/tasks' ? 'Compliance Task Board' :
               location.pathname === '/task-form' || location.pathname.startsWith('/task-form/') ? 'Task Editor' :
               location.pathname === '/applications' ? 'Hiring Requests' :
               location.pathname === '/mentor-workspace' ? 'Coaching Workspace' :
               location.pathname === '/intern-portal' ? 'Intern Learning Dashboard' :
               location.pathname.startsWith('/certificate/') ? 'Training Completion Certificate' :
               location.pathname === '/client-dashboard' ? 'Client Compliance Center' :
               location.pathname === '/settings/masters' ? 'Master Lists Settings' :
               location.pathname === '/monthly-reports' ? 'Performance Evaluation Reports' :
               'Dashboard Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notifications Bell Dropdown */}
            <div className="relative" ref={notifyDropdownRef}>
              <button
                onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                className="relative rounded-lg p-2 text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[8px] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {isNotifyOpen && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-2 shadow-xl z-50 transition-colors duration-300">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-900 mb-1 flex justify-between items-center select-none">
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Alerts ({unreadCount} new)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-indigo-500 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-450 italic font-semibold uppercase tracking-wider">
                        No alerts
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => {
                            handleMarkAsRead(item._id);
                            if (item.link) {
                              navigate(item.link);
                              setIsNotifyOpen(false);
                            }
                          }}
                          className={`px-3 py-2 rounded-lg cursor-pointer transition text-left relative text-[11px] leading-tight space-y-1 ${
                            item.isRead 
                              ? 'bg-transparent text-slate-500' 
                              : 'bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02] text-slate-700 dark:text-slate-300 font-medium'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold truncate max-w-[180px] text-slate-850 dark:text-slate-200">
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(item._id, e)}
                                className="text-[8px] font-bold text-indigo-500 hover:text-indigo-650 shrink-0 cursor-pointer"
                                title="Mark as read"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p>{item.message}</p>
                          <span className="text-[8px] text-slate-400 block font-bold">
                            {new Date(item.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user?.name}
                  </p>
                  <span className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold tracking-wide uppercase ${currentRoleColor}`}>
                    {user?.role?.name}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2.5 w-56 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-2 shadow-xl z-50 transition-colors duration-300">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-900 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Role & Access
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <Shield className="h-4 w-4 text-indigo-400" />
                      Role: <span className="font-semibold">{user?.role?.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-[9px] text-slate-400">Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user?.role?.permissions?.map((p) => (
                          <span key={p._id} className="rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-1 py-0.5">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <hr className="my-1 border-slate-100 dark:border-slate-900" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors duration-150 cursor-pointer"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-grow overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Glassmorphic Real-time Toast Alerts */}
        {toast && (
          <div 
            onClick={() => {
              if (toast.link) navigate(toast.link);
              setToast(null);
            }}
            className="fixed bottom-6 right-6 z-50 flex max-w-sm w-full gap-3 overflow-hidden rounded-xl border border-indigo-100 bg-white/90 dark:bg-slate-900/90 dark:border-slate-800 p-4 shadow-2xl glass glow-primary cursor-pointer transition-all duration-300 transform scale-100 hover:scale-[1.02] active:scale-[0.98] animate-bounce"
          >
            <div className="rounded-lg bg-indigo-500 p-2 text-white h-fit shrink-0">
              <Bell className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-white font-heading">
                {toast.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
