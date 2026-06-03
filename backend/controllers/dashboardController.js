import Client from '../models/Client.js';
import ClientDocument from '../models/ClientDocument.js';
import DocumentRequest from '../models/DocumentRequest.js';
import Invoice from '../models/Invoice.js';
import Ticket from '../models/Ticket.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Get Admin Dashboard Data
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
export const getAdminDashboard = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const totalRequests = await DocumentRequest.countDocuments();
    const uploadedDocs = await ClientDocument.countDocuments();
    const pendingDocs = await DocumentRequest.countDocuments({ status: 'Uploaded' });
    const overdueDocs = await DocumentRequest.countDocuments({ status: 'Overdue' });
    const escalatedDocs = await DocumentRequest.countDocuments({ status: 'Escalated' });
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    
    const invoices = await Invoice.find({});
    const totalRevenue = invoices.reduce((sum, inv) => {
      const paid = inv.paymentHistory.reduce((s, p) => s + p.amountPaid, 0);
      return sum + paid;
    }, 0);

    res.json({
      success: true,
      role: 'Admin',
      data: {
        totalClients,
        activeClients: totalClients,
        documentsRequested: totalRequests,
        documentsUploaded: uploadedDocs,
        pendingDocuments: pendingDocs,
        overdueDocuments: overdueDocs,
        escalatedRequests: escalatedDocs,
        tasksCompleted: completedTasks,
        revenueSummary: totalRevenue,
        recentLogs: [
          { time: 'Just now', user: 'admin@company.com', action: 'Compliance check run' },
          { time: '1 hour ago', user: 'manager@company.com', action: 'Invoice generated' },
          { time: '3 hours ago', user: 'client@company.com', action: 'Support ticket submitted' },
        ],
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Manager Dashboard Data
// @route   GET /api/dashboard/manager
// @access  Private (Admin, Manager)
export const getManagerDashboard = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const pendingDocs = await DocumentRequest.countDocuments({ status: 'Uploaded' });
    const escalatedDocs = await DocumentRequest.countDocuments({ status: 'Escalated' });
    const activeTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });

    res.json({
      success: true,
      role: 'Manager',
      data: {
        activeProjects: activeTasks,
        budgetUtilized: '74%',
        deadlinesImpending: escalatedDocs,
        projects: [
          { id: 'PRJ001', name: 'Apex Filing Retainer', progress: 85, status: 'On Track' },
          { id: 'PRJ002', name: 'ITR Filing Audit Check', progress: 40, status: 'At Risk' },
        ],
        teamAllocation: {
          developers: 5,
          interns: 2,
          leads: 2,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Team Lead Dashboard Data
// @route   GET /api/dashboard/tl
// @access  Private (Admin, Manager, TL)
export const getTLDashboard = async (req, res) => {
  try {
    const sprintTasksCount = await Task.countDocuments({ assignedTo: req.user._id });
    res.json({
      success: true,
      role: 'TL',
      data: {
        teamName: 'GST Advisory Squad',
        sprintProgress: '68%',
        blockers: 1,
        sprintTasks: [
          { id: 'TSK-104', title: 'GSTR-2B ITC Matching', assignee: 'Software Employee', status: 'In Progress' },
          { id: 'TSK-105', title: 'Director DIN KYC upload', assignee: 'Intern Apprentice', status: 'Completed' },
        ],
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Employee Dashboard Data
// @route   GET /api/dashboard/employee
// @access  Private (Admin, Manager, TL, Employee)
export const getEmployeeDashboard = async (req, res) => {
  try {
    const assignedTasks = await Task.find({ assignedTo: req.user._id });
    res.json({
      success: true,
      role: 'Employee',
      data: {
        myTasksCount: assignedTasks.length,
        loggedHoursThisWeek: 32.5,
        leaveBalance: 12,
        assignedTasks: assignedTasks.map((t, i) => ({
          id: `TSK-10${i+1}`,
          title: t.title,
          priority: t.priority,
          dueDate: new Date(t.dueDate).toLocaleDateString(),
        })),
        announcements: [
          { title: 'ROC Deadline filing reminder', date: 'Today', sender: 'HR Admin' },
          { title: 'Tax audit checklist release', date: '3 days ago', sender: 'Management' },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Intern Dashboard Data
// @route   GET /api/dashboard/intern
// @access  Private (Admin, Manager, TL, Employee, Intern)
export const getInternDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      role: 'Intern',
      data: {
        mentorName: 'Team Lead',
        learningPathCompletion: '65%',
        hoursLogged: 20,
        learningModules: [
          { module: 'GST Advisory & Return forms', status: 'Completed', grade: 'A' },
          { module: 'Income Tax Computation', status: 'In Progress', grade: 'Pending' },
        ],
        internAssignments: [
          { id: 'INT-01', title: 'Audit asset registers for clients', dueDate: 'Tomorrow' },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Client Dashboard Data
// @route   GET /api/dashboard/client
// @access  Private (Admin, Client)
export const getClientDashboard = async (req, res) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Dynamic stats computation
    const pendingTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });
    
    const pendingDocuments = await DocumentRequest.countDocuments({
      client: client._id,
      status: 'Uploaded',
    });

    const requestedDocuments = await DocumentRequest.countDocuments({
      client: client._id,
      status: { $in: ['Requested', 'Re-upload Required'] },
    });

    const outstandingInvoices = await Invoice.countDocuments({
      client: client._id,
      status: { $ne: 'Paid' },
    });

    const openTickets = await Ticket.countDocuments({
      client: client._id,
      status: { $in: ['Open', 'Assigned', 'In Progress', 'Waiting for Client'] },
    });

    const unreadNotifications = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    const totalOutstanding = await Invoice.find({
      client: client._id,
      status: { $ne: 'Paid' },
    });
    
    const totalOutstandingAmount = totalOutstanding.reduce((sum, inv) => sum + inv.outstandingBalance, 0);

    res.json({
      success: true,
      role: 'Client',
      data: {
        companyName: client.companyName,
        accountManager: 'Advisory Team',
        billingStatus: totalOutstandingAmount > 0 ? `₹${totalOutstandingAmount} Outstanding` : 'Paid',
        stats: {
          activeServices: client.completedFilings?.length || 2,
          pendingTasks,
          pendingDocuments,
          documentsRequested: requestedDocuments,
          filedReturns: client.completedFilings?.length || 0,
          outstandingInvoices,
          openTickets,
          notifications: unreadNotifications,
        },
        recentActivities: [
          { title: 'Tax invoice generated', time: 'Just now' },
          { title: 'Document request generated: "Sales Bills"', time: '1 day ago' },
          { title: 'GST Filing GSTR-3B filed', time: '2 weeks ago' },
        ],
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
