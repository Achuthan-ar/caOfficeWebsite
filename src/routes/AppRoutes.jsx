import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuthStore } from '../store/authStore';
import Loader from '../components/Loader';

// Premium glassmorphic dynamic loader spinner for page transitions
const PageLoader = () => (
  <Loader text="Securing content view..." overlay />
);

// Dynamic Lazy Loading Imports for Code Splitting Optimization
const Home = lazy(() => import('../pages/public/Home'));
const About = lazy(() => import('../pages/public/About'));
const Services = lazy(() => import('../pages/public/Services'));
const Careers = lazy(() => import('../pages/public/Careers'));
const Contact = lazy(() => import('../pages/public/Contact'));
const BlogDirectory = lazy(() => import('../pages/public/BlogDirectory'));
const BlogDetails = lazy(() => import('../pages/public/BlogDetails'));

const Login = lazy(() => import('../pages/Login'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const UsersList = lazy(() => import('../pages/UsersList'));

const BlogManagement = lazy(() => import('../pages/dashboard/BlogManagement'));
const BlogForm = lazy(() => import('../pages/dashboard/BlogForm'));
const CategoryTagManager = lazy(() => import('../pages/dashboard/CategoryTagManager'));

const EmployeeList = lazy(() => import('../pages/dashboard/EmployeeList'));
const EmployeeForm = lazy(() => import('../pages/dashboard/EmployeeForm'));
const AttendanceClock = lazy(() => import('../pages/dashboard/AttendanceClock'));
const AttendanceReport = lazy(() => import('../pages/dashboard/AttendanceReport'));

const LeaveManager = lazy(() => import('../pages/dashboard/LeaveManager'));
const TaskTracker = lazy(() => import('../pages/dashboard/TaskTracker'));
const TaskForm = lazy(() => import('../pages/dashboard/TaskForm'));

const ApplicationReviews = lazy(() => import('../pages/dashboard/ApplicationReviews'));
const InternPortal = lazy(() => import('../pages/dashboard/InternPortal'));
const MentorWorkspace = lazy(() => import('../pages/dashboard/MentorWorkspace'));
const CertificateView = lazy(() => import('../pages/dashboard/CertificateView'));

const ClientDashboard = lazy(() => import('../pages/dashboard/ClientDashboard'));
const MonthlyReports = lazy(() => import('../pages/dashboard/MonthlyReports'));

const DocumentCenter = lazy(() => import('../pages/dashboard/DocumentCenter'));
const DocumentRequests = lazy(() => import('../pages/dashboard/DocumentRequests'));
const PendingDocuments = lazy(() => import('../pages/dashboard/PendingDocuments'));
const ComplianceCalendar = lazy(() => import('../pages/dashboard/ComplianceCalendar'));
const BillingInvoices = lazy(() => import('../pages/dashboard/BillingInvoices'));
const ServiceRequests = lazy(() => import('../pages/dashboard/ServiceRequests'));
const NotificationCenter = lazy(() => import('../pages/dashboard/NotificationCenter'));
const ReportsAnalytics = lazy(() => import('../pages/dashboard/ReportsAnalytics'));
const ProfileSettings = lazy(() => import('../pages/dashboard/ProfileSettings'));

const AppRoutes = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
              <Route path="/tasks" element={<TaskTracker />} />
              <Route path="/intern-portal" element={<InternPortal />} />
              <Route path="/certificate/:id" element={<CertificateView />} />
              
              {/* Shared Document Center, Compliance, Tickets, Profile & Notifications (accessible to all authenticated roles) */}
              <Route path="/document-center" element={<DocumentCenter />} />
              <Route path="/compliance-calendar" element={<ComplianceCalendar />} />
              <Route path="/service-requests" element={<ServiceRequests />} />
              <Route path="/notifications-center" element={<NotificationCenter />} />
              <Route path="/profile-settings" element={<ProfileSettings />} />

              {/* Document Request & Pending Upload Review (accessible to all staff roles) */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'TL', 'Employee']} />}>
                <Route path="/document-requests" element={<DocumentRequests />} />
                <Route path="/pending-documents" element={<PendingDocuments />} />
              </Route>

              {/* Invoices (accessible to Admin, Manager, and Client roles) */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Client']} />}>
                <Route path="/billing-invoices" element={<BillingInvoices />} />
              </Route>

              {/* Reports & Analytics (accessible to Admin, Manager, and Team Lead roles) */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'TL']} />}>
                <Route path="/reports-analytics" element={<ReportsAnalytics />} />
              </Route>
              
              {/* Create/Edit Task - Manager and TL only */}
              <Route element={<ProtectedRoute allowedRoles={['Manager', 'TL']} />}>
                <Route path="/task-form" element={<TaskForm />} />
                <Route path="/task-form/:id" element={<TaskForm />} />
              </Route>

              {/* Mentor Workspace & Performance Reports - Manager, TL, and Employee only */}
              <Route element={<ProtectedRoute allowedRoles={['Manager', 'TL', 'Employee']} />}>
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
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
