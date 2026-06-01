import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuthStore } from '../store/authStore';

// Premium glassmorphic dynamic loader spinner for page transitions
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center py-12">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800"></div>
      <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-[10px] font-heading font-black text-slate-500 dark:text-slate-400 tracking-wider uppercase animate-pulse">
      Securing content view...
    </p>
  </div>
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
const TaskKanban = lazy(() => import('../pages/dashboard/TaskKanban'));
const TaskForm = lazy(() => import('../pages/dashboard/TaskForm'));

const ApplicationReviews = lazy(() => import('../pages/dashboard/ApplicationReviews'));
const InternPortal = lazy(() => import('../pages/dashboard/InternPortal'));
const MentorWorkspace = lazy(() => import('../pages/dashboard/MentorWorkspace'));
const CertificateView = lazy(() => import('../pages/dashboard/CertificateView'));

const ClientDashboard = lazy(() => import('../pages/dashboard/ClientDashboard'));
const MonthlyReports = lazy(() => import('../pages/dashboard/MonthlyReports'));

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
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
