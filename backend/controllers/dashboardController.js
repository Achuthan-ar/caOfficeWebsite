// @desc    Get Admin Dashboard Data
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
export const getAdminDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      role: 'Admin',
      data: {
        systemStatus: 'Healthy',
        activeSessions: 42,
        dbSize: '24 MB',
        recentLogs: [
          { time: '10 mins ago', user: 'admin@company.com', action: 'User role updated' },
          { time: '1 hour ago', user: 'manager@company.com', action: 'Project created' },
          { time: '3 hours ago', user: 'client@company.com', action: 'Support ticket submitted' },
        ],
        statistics: {
          totalUsers: 156,
          apiCalls: 8900,
          errorRate: '0.04%',
        }
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
    res.json({
      success: true,
      role: 'Manager',
      data: {
        activeProjects: 8,
        budgetUtilized: '68%',
        deadlinesImpending: 3,
        projects: [
          { id: 'PRJ001', name: 'CA Portal Upgrade', progress: 85, status: 'On Track' },
          { id: 'PRJ002', name: 'Tax Filing Automator', progress: 40, status: 'At Risk' },
          { id: 'PRJ003', name: 'Security Audit v2', progress: 100, status: 'Completed' },
        ],
        teamAllocation: {
          developers: 12,
          interns: 4,
          leads: 3,
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
    res.json({
      success: true,
      role: 'TL',
      data: {
        teamName: 'Alpha Squad',
        sprintProgress: '72%',
        blockers: 2,
        sprintTasks: [
          { id: 'TSK-104', title: 'JWT RBAC Implementation', assignee: 'Software Employee', status: 'In Review' },
          { id: 'TSK-105', title: 'Redux Boilerplate Setup', assignee: 'Intern Apprentice', status: 'In Progress' },
          { id: 'TSK-106', title: 'MongoDB Indexing Rules', assignee: 'Software Employee', status: 'To Do' },
        ],
        recentReviews: [
          { pr: 'PR-89', title: 'Add schema validations', author: 'Software Employee', status: 'Approved' },
          { pr: 'PR-90', title: 'Tailwind config v4 update', author: 'Intern Apprentice', status: 'Pending Review' },
        ]
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
    res.json({
      success: true,
      role: 'Employee',
      data: {
        myTasksCount: 4,
        loggedHoursThisWeek: 37.5,
        leaveBalance: 12,
        assignedTasks: [
          { id: 'TSK-104', title: 'JWT RBAC Implementation', priority: 'High', dueDate: 'May 28, 2026' },
          { id: 'TSK-106', title: 'MongoDB Indexing Rules', priority: 'Medium', dueDate: 'May 30, 2026' },
          { id: 'TSK-109', title: 'Fix Auth Expiry Token Bugs', priority: 'Critical', dueDate: 'Today' },
        ],
        announcements: [
          { title: 'Office closed on Friday', date: 'Yesterday', sender: 'HR Admin' },
          { title: 'Sprint Retrospective Schedule', date: '3 days ago', sender: 'Scrum Master' },
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
        learningPathCompletion: '45%',
        hoursLogged: 24,
        learningModules: [
          { module: 'Node.js & Express Basics', status: 'Completed', grade: 'A' },
          { module: 'MongoDB & Mongoose Schema Designing', status: 'Completed', grade: 'B+' },
          { module: 'React Context API & Hooks', status: 'In Progress', grade: 'Pending' },
        ],
        internAssignments: [
          { id: 'INT-01', title: 'Build mock login visual page using Tailwind', dueDate: 'Tomorrow' },
          { id: 'INT-02', title: 'Write unit tests for authentication controllers', dueDate: 'In 3 days' },
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
    res.json({
      success: true,
      role: 'Client',
      data: {
        companyName: 'Apex Solutions',
        accountManager: 'Project Manager',
        billingStatus: 'Up to Date',
        tickets: [
          { id: 'TCK-401', subject: 'Tax filing form crashes during upload', status: 'Open', lastUpdated: '1 hour ago' },
          { id: 'TCK-392', subject: 'Request for invoice #CA-909', status: 'Closed', lastUpdated: 'Last week' },
        ],
        projectProgress: [
          { serviceName: 'Corporate Tax Return 2025', progress: 90, status: 'Drafting Phase' },
          { serviceName: 'Quarterly Bookkeeping Audit', progress: 50, status: 'Gathering Documents' },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
