import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Promotion Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Services from '../pages/public/Services';
import Careers from '../pages/public/Careers';
import Contact from '../pages/public/Contact';
import BlogDirectory from '../pages/public/BlogDirectory';
import BlogDetails from '../pages/public/BlogDetails';

// Client Portal & Secure Admin Pages
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Unauthorized from '../pages/Unauthorized';
import Dashboard from '../pages/Dashboard';
import UsersList from '../pages/UsersList';

// Secure Blog Dashboard Pages
import BlogManagement from '../pages/dashboard/BlogManagement';
import BlogForm from '../pages/dashboard/BlogForm';
import CategoryTagManager from '../pages/dashboard/CategoryTagManager';

// Secure Employee & Attendance Dashboard Pages
import EmployeeList from '../pages/dashboard/EmployeeList';
import EmployeeForm from '../pages/dashboard/EmployeeForm';
import AttendanceClock from '../pages/dashboard/AttendanceClock';
import AttendanceReport from '../pages/dashboard/AttendanceReport';

// Secure Leave & Task Dashboard Pages
import LeaveManager from '../pages/dashboard/LeaveManager';
import TaskKanban from '../pages/dashboard/TaskKanban';
import TaskForm from '../pages/dashboard/TaskForm';

// Careers & Internship Management Pages
import ApplicationReviews from '../pages/dashboard/ApplicationReviews';
import InternPortal from '../pages/dashboard/InternPortal';
import MentorWorkspace from '../pages/dashboard/MentorWorkspace';
import CertificateView from '../pages/dashboard/CertificateView';

// Client Portal & Monthly Reports Pages
import ClientDashboard from '../pages/dashboard/ClientDashboard';
import MonthlyReports from '../pages/dashboard/MonthlyReports';

import { useAuthStore } from '../store/authStore';

const AppRoutes = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Promotion Pages (Mapped to PublicLayout) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<BlogDirectory />} />
        <Route path="/blog/:slug" element={<BlogDetails />} />
      </Route>

      {/* Public Auth / Login Pages (Redirects to dashboard if logged in) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Secure Portal Routes (Guarded by ProtectedRoute) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* All staff roles can record attendance & review their calendar */}
          <Route path="/attendance" element={<AttendanceClock />} />

          {/* Leave Management & Tasks (accessible to all authenticated staff roles) */}
          <Route path="/leaves" element={<LeaveManager />} />
          <Route path="/tasks" element={<TaskKanban />} />
          <Route path="/intern-portal" element={<InternPortal />} />
          <Route path="/certificate/:id" element={<CertificateView />} />
          
          {/* Create/Edit Task - Admin, Manager, and TL only */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'TL']} />}>
            <Route path="/task-form" element={<TaskForm />} />
            <Route path="/task-form/:id" element={<TaskForm />} />
          </Route>

          {/* Mentor Workspace & Performance Reports - Admin, Manager, TL, and Employee only */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'TL', 'Employee']} />}>
            <Route path="/mentor-workspace" element={<MentorWorkspace />} />
            <Route path="/monthly-reports" element={<MonthlyReports />} />
          </Route>

          {/* Client Only Pages */}
          <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
            <Route path="/client-dashboard" element={<ClientDashboard />} />
          </Route>
          
          {/* Admin and Manager only pages */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employee-form" element={<EmployeeForm />} />
            <Route path="/employee-form/:id" element={<EmployeeForm />} />
            <Route path="/attendance-report" element={<AttendanceReport />} />
            <Route path="/applications" element={<ApplicationReviews />} />
          </Route>
          
          {/* Admin-Only User Role Management Page */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/users" element={<UsersList />} />
          </Route>

          {/* Secure Blog Administration Pages (Admin, Manager, Team Lead only) */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'TL']} />}>
            <Route path="/blog-admin" element={<BlogManagement />} />
            <Route path="/blog-form" element={<BlogForm />} />
            <Route path="/blog-form/:id" element={<BlogForm />} />
            <Route path="/blog-taxonomy" element={<CategoryTagManager />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Fallback Route */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
