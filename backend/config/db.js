import mongoose from 'mongoose';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import Blog from '../models/Blog.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Task from '../models/Task.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Notification from '../models/Notification.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Internship from '../models/Internship.js';
import Certificate from '../models/Certificate.js';
import InternshipReport from '../models/InternshipReport.js';
import Client from '../models/Client.js';
import ClientDocument from '../models/ClientDocument.js';
import MonthlyReport from '../models/MonthlyReport.js';
import DocumentRequest from '../models/DocumentRequest.js';
import Invoice from '../models/Invoice.js';
import Ticket from '../models/Ticket.js';
import Compliance from '../models/Compliance.js';
import AuditLog from '../models/AuditLog.js';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_office');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed DB
    await seedDB();

    // Migrate roles hierarchy
    await migrateRoles();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const seedDB = async () => {
  try {
    // 1. Seed Permissions
    const permCount = await Permission.countDocuments();
    let permissionsMap = {};

    const defaultPermissions = [
      { name: 'full_access', description: 'Full access to all systems and settings' },
      { name: 'operational_access', description: 'Access to operational management and configurations' },
      { name: 'team_management', description: 'Access to team tasks, sprint review, and assignees' },
      { name: 'limited_work_access', description: 'Limited work access to assigned tasks and tracking' },
      { name: 'internship_access', description: 'Access to learning materials and learning assignments' },
      { name: 'client_portal_access', description: 'Access to billing details, project progress, and support tickets' },
    ];

    if (permCount === 0) {
      console.log('No permissions found. Seeding default permissions...');
      const createdPerms = await Permission.create(defaultPermissions);
      createdPerms.forEach(p => {
        permissionsMap[p.name] = p._id;
      });
      console.log('Permissions seeded.');
    } else {
      console.log('Permissions already exist. Mapping them...');
      const existingPerms = await Permission.find({});
      existingPerms.forEach(p => {
        permissionsMap[p.name] = p._id;
      });
    }

    // 2. Seed Roles
    const roleCount = await Role.countDocuments();
    let rolesMap = {};

    const defaultRoles = [
      {
        name: 'Admin',
        description: 'Administrator role with full controls',
        permissions: [permissionsMap['full_access']],
      },
      {
        name: 'CA Login',
        description: 'CA Login (previously Manager)',
        permissions: [permissionsMap['operational_access']],
      },
      {
        name: 'Manager',
        description: 'Manager (previously Team Lead)',
        permissions: [permissionsMap['team_management']],
      },
      {
        name: 'Employee',
        description: 'Regular Employee role',
        permissions: [permissionsMap['limited_work_access']],
      },
      {
        name: 'Intern',
        description: 'Intern Apprentice role',
        permissions: [permissionsMap['internship_access']],
      },
      {
        name: 'Client',
        description: 'External Client role',
        permissions: [permissionsMap['client_portal_access']],
      },
    ];

    if (roleCount === 0) {
      console.log('No roles found. Seeding default roles...');
      const createdRoles = await Role.create(defaultRoles);
      createdRoles.forEach(r => {
        rolesMap[r.name] = r._id;
      });
      console.log('Roles seeded.');
    } else {
      console.log('Roles already exist. Mapping them...');
      const existingRoles = await Role.find({});
      existingRoles.forEach(r => {
        rolesMap[r.name] = r._id;
      });
    }

    // 3. Seed Departments
    const deptCount = await Department.countDocuments();
    let departmentsMap = {};
    const defaultDepartments = [
      { name: 'Audit & Assurance', description: 'Statutory audit worksheets, tax audits, internal controls verification.' },
      { name: 'Direct Taxation', description: 'Income tax returns filing, advance tax planning, and TDS deposits.' },
      { name: 'Indirect Tax (GST)', description: 'Monthly GSTR returns processing, E-way bill monitoring, refunds.' },
      { name: 'Corporate Advisory', description: 'Company registration incorporation, LLPs, payroll accounting.' },
      { name: 'IT Support & Systems', description: 'Platform software, backups, client cloud portal support.' },
      { name: 'HR Operations', description: 'Staff hiring, stipend registry, intern coaching supervision.' },
    ];

    if (deptCount === 0) {
      console.log('No departments found. Seeding default departments...');
      const createdDepts = await Department.create(defaultDepartments);
      createdDepts.forEach(d => {
        departmentsMap[d.name] = d._id;
      });
      console.log('Departments seeded.');
    } else {
      const existingDepts = await Department.find({});
      existingDepts.forEach(d => {
        departmentsMap[d.name] = d._id;
      });
    }

    // 4. Seed Users
    const userCount = await User.countDocuments();
    let usersList = [];
    if (userCount === 0) {
      console.log('No users found in database. Seeding demo users...');
      
      const demoUsers = [
        {
          name: 'System Administrator',
          email: 'admin@company.com',
          password: 'password123',
          role: rolesMap['Admin'],
          employeeId: 'EMP001',
          phone: '+91 99999 11111',
          department: departmentsMap['IT Support & Systems'],
          joiningDate: new Date('2021-06-01'),
          salary: 120000,
          address: '10, Marine Drive, South Mumbai, MH, 400021',
          emergencyContact: { name: 'Sunita Sharma', phone: '+91 98888 12345' },
          leaveBalance: 15,
        },
        {
          name: 'Project Manager',
          email: 'manager@company.com',
          password: 'password123',
          role: rolesMap['CA Login'],
          employeeId: 'EMP002',
          phone: '+91 99999 22222',
          department: departmentsMap['Audit & Assurance'],
          joiningDate: new Date('2022-02-15'),
          salary: 85000,
          address: 'Block 4B, Emerald Heights, Powai, Mumbai, MH, 400076',
          emergencyContact: { name: 'Kunal Nair', phone: '+91 97777 22222' },
          leaveBalance: 18,
        },
        {
          name: 'Team Lead',
          email: 'tl@company.com',
          password: 'password123',
          role: rolesMap['Manager'],
          employeeId: 'EMP003',
          phone: '+91 99999 33333',
          department: departmentsMap['Indirect Tax (GST)'],
          joiningDate: new Date('2023-01-10'),
          salary: 65050,
          address: '702, Skyline Towers, Thane West, MH, 400601',
          emergencyContact: { name: 'Reena Patel', phone: '+91 96666 33333' },
          leaveBalance: 15,
        },
        {
          name: 'Software Employee',
          email: 'employee@company.com',
          password: 'password123',
          role: rolesMap['Employee'],
          employeeId: 'EMP004',
          phone: '+91 99999 44444',
          department: departmentsMap['Direct Taxation'],
          joiningDate: new Date('2024-04-01'),
          salary: 42000,
          address: 'Flat 101, Om residency, Andheri East, Mumbai, MH, 400069',
          emergencyContact: { name: 'Mukesh Kadam', phone: '+91 95555 44444' },
          leaveBalance: 12,
        },
        {
          name: 'Intern Apprentice',
          email: 'intern@company.com',
          password: 'password123',
          role: rolesMap['Intern'],
          employeeId: 'EMP005',
          phone: '+91 99999 55555',
          department: departmentsMap['Audit & Assurance'],
          joiningDate: new Date('2026-03-01'),
          salary: 15000,
          address: 'A-201, Shanti Niketan, Borivali West, Mumbai, MH, 400091',
          emergencyContact: { name: 'Gopal Joshi', phone: '+91 94444 55555' },
          leaveBalance: 10,
        },
        {
          name: 'External Client',
          email: 'client@company.com',
          password: 'password123',
          role: rolesMap['Client'],
          // Clients do not have employeeId or department
        },
      ];

      usersList = await User.create(demoUsers);
      console.log('Demo users seeded successfully!');
    } else {
      console.log('Users already exist in database. Skipping seeding.');
      usersList = await User.find({});
    }

    // 5. Seed Categories
    const catCount = await Category.countDocuments();
    let categoriesMap = {};
    const defaultCategories = [
      { name: 'GST & Indirect Tax', description: 'Goods and Services Tax filings, modifications, and updates.' },
      { name: 'Direct Taxation', description: 'Income tax, corporate returns, tax planning, and TDS filings.' },
      { name: 'Audit & Compliance', description: 'Internal audits, financial statements, and statutory audits.' },
      { name: 'Business Incorporation', description: 'Company registrations, partnerships, and statutory setups.' },
      { name: 'Corporate Advisory', description: 'Financial bookkeeping, payroll management, and cash flows.' },
    ];

    if (catCount === 0) {
      console.log('No categories found. Seeding default categories...');
      const createdCats = await Category.create(defaultCategories);
      createdCats.forEach(c => {
        categoriesMap[c.name] = c._id;
      });
      console.log('Categories seeded.');
    } else {
      const existingCats = await Category.find({});
      existingCats.forEach(c => {
        categoriesMap[c.name] = c._id;
      });
    }

    // 6. Seed Tags
    const tagCount = await Tag.countDocuments();
    let tagsMap = {};
    const defaultTags = [
      { name: 'GST' },
      { name: 'Income Tax' },
      { name: 'Audit' },
      { name: 'Registration' },
      { name: 'TDS' },
      { name: 'Startup' },
      { name: 'Compliance' },
    ];

    if (tagCount === 0) {
      console.log('No tags found. Seeding default tags...');
      const createdTags = await Tag.create(defaultTags);
      createdTags.forEach(t => {
        tagsMap[t.name] = t._id;
      });
      console.log('Tags seeded.');
    } else {
      const existingTags = await Tag.find({});
      existingTags.forEach(t => {
        tagsMap[t.name] = t._id;
      });
    }

    // 7. Seed Blogs
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      console.log('No blogs found in database. Seeding demo blogs...');
      
      const adminUser = await User.findOne({ email: 'admin@company.com' });
      if (adminUser) {
        const demoBlogs = [
          {
            title: 'A Complete Guide to GST Filing for Businesses in 2026',
            content: `
              <h2>Introduction to GST compliance</h2>
              <p>Filing your Goods and Services Tax (GST) returns correctly is vital to avoid compliance audits, fines, and late fees. This guide provides a detailed outline of monthly and quarterly filing requirements.</p>
              <h3>Types of GST Returns</h3>
              <ul>
                <li><strong>GSTR-1:</strong> Statement of outward supplies (sales).</li>
                <li><strong>GSTR-3B:</strong> Monthly summary return with tax payments.</li>
                <li><strong>GSTR-9:</strong> Annual comprehensive filing.</li>
              </ul>
              <h3>Best Practices</h3>
              <p>Keep your ledgers updated weekly. Always reconcile GSTR-2B data with your purchase invoices before claiming Input Tax Credit (ITC) to ensure accurate calculations.</p>
            `,
            excerpt: 'Learn the monthly, quarterly, and annual GST filing processes, standard forms, and ITC reconciliation tips for 2026.',
            author: adminUser._id,
            category: categoriesMap['GST & Indirect Tax'],
            tags: [tagsMap['GST'], tagsMap['Compliance']],
            status: 'Published',
            isFeatured: true,
            views: 45,
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Understanding the New Income Tax Slab Rates & Planning',
            content: `
              <h2>Direct Taxation changes</h2>
              <p>Income tax compliance changes dynamically every financial year. In this blog post, we review standard exemptions, standard deductions, and slab rates for salaried and business earners.</p>
              <h3>Key Deductions to Claim</h3>
              <p>Review standard tax planning schemes under Section 80C, health policies under Section 80D, and NPS allocations to minimize your tax liability effectively.</p>
            `,
            excerpt: 'A comprehensive review of income tax slab rates, calculations, deductions, and tax planning strategies.',
            author: adminUser._id,
            category: categoriesMap['Direct Taxation'],
            tags: [tagsMap['Income Tax'], tagsMap['TDS']],
            status: 'Published',
            views: 28,
            publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Why Regular Financial Audits are Vital for Small Businesses',
            content: `
              <h2>The Value of Financial Audits</h2>
              <p>Many small businesses view audits solely as a compliance burden. However, structured internal reviews help identify cash flow leaks, optimize budget books, and prepare company reports for capital fundraising.</p>
              <h3>Benefits of Audits</h3>
              <p>Audits build investor trust, ensure tax compliance, detect operational frauds, and improve the accuracy of bookkeeping ledgers.</p>
            `,
            excerpt: 'Discover why statutory and internal audits are important business health diagnostics beyond compliance obligations.',
            author: adminUser._id,
            category: categoriesMap['Audit & Compliance'],
            tags: [tagsMap['Audit'], tagsMap['Compliance']],
            status: 'Published',
            views: 12,
            publishedAt: new Date(),
          },
        ];

        await Blog.create(demoBlogs);
        console.log('Demo blogs seeded successfully!');
      }
    }

    // 8. Seed Attendance logs for past 30 days
    const attendanceCount = await Attendance.countDocuments();
    if (attendanceCount === 0 && usersList.length > 0) {
      console.log('No attendance logs found. Seeding past 30 days of mock logs...');
      const logsToInsert = [];

      // Filter out Clients, seed only staff (Admin, Manager, TL, Employee, Intern)
      const staffUsers = usersList.filter(u => u.employeeId);

      // Loop over past 30 days
      for (let i = 30; i >= 1; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        // Skip Saturday (6) and Sunday (0)
        const day = d.getDay();
        if (day === 0 || day === 6) continue;

        const dateStr = getLocalDateString(d);

        staffUsers.forEach(user => {
          const rand = Math.random();
          
          // 85% Present, 10% Late, 3% Half-Day, 2% Absent
          if (rand < 0.02) {
            // Absent (no record)
            return;
          }

          let status = 'Present';
          let lateTime = 0;
          let checkInHour = 9;
          let checkInMin = Math.floor(Math.random() * 25) + 15; // 09:15 to 09:40 AM

          if (rand >= 0.02 && rand < 0.05) {
            // Half-Day
            status = 'Half-Day';
            checkInHour = 10;
            checkInMin = Math.floor(Math.random() * 15) + 30; // 10:30 to 10:45 AM
          } else if (rand >= 0.05 && rand < 0.15) {
            // Late check-in (past 09:45 AM)
            status = 'Late';
            checkInHour = 10;
            checkInMin = Math.floor(Math.random() * 20) + 5; // 10:05 to 10:25 AM
            lateTime = (checkInHour - 9) * 60 + checkInMin - 45; // Minutes late
          }

          const checkIn = new Date(d);
          checkIn.setHours(checkInHour, checkInMin, 0);

          const checkOut = new Date(d);
          let checkOutHour = 18;
          let checkOutMin = Math.floor(Math.random() * 45) + 30; // 06:30 PM to 07:15 PM (18:30 - 19:15)

          if (status === 'Half-Day') {
            checkOutHour = 14;
            checkOutMin = Math.floor(Math.random() * 30); // 02:00 PM to 02:30 PM
          }

          checkOut.setHours(checkOutHour, checkOutMin, 0);

          // Work hours calculations with 1 hour lunch break deduction
          const diffMs = checkOut - checkIn;
          const lunchBreakMs = 60 * 60 * 1000;
          const netMs = diffMs - lunchBreakMs;
          const workHours = netMs > 0 ? netMs / (1000 * 60 * 60) : 0;

          logsToInsert.push({
            user: user._id,
            date: dateStr,
            checkIn,
            checkOut,
            status,
            workHours: Number(workHours.toFixed(2)),
            lateTime,
          });
        });
      }

      await Attendance.insertMany(logsToInsert);
      console.log('Seeded past 30 days of staff attendance records successfully!');
    }

    // 9. Seed Tasks
    const taskCount = await Task.countDocuments();
    if (taskCount === 0 && usersList.length > 0) {
      console.log('No tasks found. Seeding mock tasks...');
      const admin = usersList.find(u => u.email === 'admin@company.com');
      const PM = usersList.find(u => u.email === 'manager@company.com');
      const TL = usersList.find(u => u.email === 'tl@company.com');
      const employee = usersList.find(u => u.email === 'employee@company.com');
      const intern = usersList.find(u => u.email === 'intern@company.com');

      const auditDept = await Department.findOne({ name: 'Audit & Assurance' });
      const taxDept = await Department.findOne({ name: 'Direct Taxation' });
      const gstDept = await Department.findOne({ name: 'Indirect Tax (GST)' });
      const corpDept = await Department.findOne({ name: 'Corporate Advisory' });

      const mockTasks = [
        {
          title: 'Reconcile GSTR-2B for Q1',
          description: 'Reconcile Input Tax Credit (ITC) from GSTR-2B with purchase ledgers for all active corporate clients.',
          assignedTo: employee?._id,
          createdBy: PM?._id || admin?._id,
          priority: 'High',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'In Progress',
          progress: 40,
          department: gstDept?._id,
          activityLogs: [{ user: PM?._id || admin?._id, action: 'Task created and assigned to employee.' }],
        },
        {
          title: 'Income tax computation checks',
          description: 'Review calculations and standard deductions for individual salary earners under the new slab options.',
          assignedTo: intern?._id,
          createdBy: TL?._id || admin?._id,
          priority: 'Medium',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'Pending',
          progress: 0,
          department: taxDept?._id,
          activityLogs: [{ user: TL?._id || admin?._id, action: 'Task created.' }],
        },
        {
          title: 'Incorporate XYZ Logistics LLP',
          description: 'Prepare LLP agreement and file incorporation documents on MCA V3 portal.',
          assignedTo: TL?._id,
          createdBy: PM?._id || admin?._id,
          priority: 'Critical',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'Pending',
          progress: 0,
          department: corpDept?._id,
          activityLogs: [{ user: PM?._id || admin?._id, action: 'LLP incorporation task launched.' }],
        },
        {
          title: 'Statutory Audit of CA Office Books',
          description: 'Examine ledgers, cash books, bank statements and vouchers for annual filing audit requirements.',
          assignedTo: employee?._id,
          createdBy: PM?._id || admin?._id,
          priority: 'Low',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'Completed',
          progress: 100,
          department: auditDept?._id,
          activityLogs: [
            { user: PM?._id || admin?._id, action: 'Task created.' },
            { user: employee?._id, action: 'Status updated to Completed.' }
          ],
        }
      ];

      await Task.create(mockTasks);
      console.log('Mock tasks seeded successfully!');
    }

    // 10. Seed Leave Requests
    const leaveCount = await LeaveRequest.countDocuments();
    if (leaveCount === 0 && usersList.length > 0) {
      console.log('No leave requests found. Seeding mock leave requests...');
      const employee = usersList.find(u => u.email === 'employee@company.com');
      const intern = usersList.find(u => u.email === 'intern@company.com');
      const TL = usersList.find(u => u.email === 'tl@company.com');
      const PM = usersList.find(u => u.email === 'manager@company.com');

      const mockLeaves = [
        {
          user: employee?._id,
          leaveType: 'Casual Leave',
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          reason: 'Attending family wedding in my hometown.',
          status: 'Approved',
          approvedBy: PM?._id,
          remarks: 'Approved. Ensure tasks are delegated.',
        },
        {
          user: intern?._id,
          leaveType: 'Sick Leave',
          startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          reason: 'Wisdom tooth extraction surgery scheduled.',
          status: 'Pending',
        },
        {
          user: TL?._id,
          leaveType: 'Emergency Leave',
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          reason: 'Severe fever and body ache.',
          status: 'Rejected',
          approvedBy: PM?._id,
          remarks: 'Declined due to statutory tax filing deadlines. Can request alternate dates.',
        }
      ];

      await LeaveRequest.create(mockLeaves);
      console.log('Mock leave requests seeded successfully!');
    }

    // 11. Seed Alerts/Notifications
    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0 && usersList.length > 0) {
      console.log('No notifications found. Seeding mock notifications...');
      const employee = usersList.find(u => u.email === 'employee@company.com');
      const intern = usersList.find(u => u.email === 'intern@company.com');
      const PM = usersList.find(u => u.email === 'manager@company.com');

      const mockNotifications = [
        {
          recipient: employee?._id,
          sender: PM?._id,
          title: 'New Task Assigned',
          message: 'You have been assigned task: "Reconcile GSTR-2B for Q1".',
          type: 'Task',
          isRead: false,
          link: '/tasks',
        },
        {
          recipient: intern?._id,
          sender: PM?._id,
          title: 'New Task Assigned',
          message: 'You have been assigned task: "Income tax computation checks".',
          type: 'Task',
          isRead: false,
          link: '/tasks',
        },
        {
          recipient: PM?._id,
          sender: employee?._id,
          title: 'New Leave Request',
          message: 'Software Employee applied for 3 day(s) of Casual Leave.',
          type: 'Leave',
          isRead: false,
          link: '/leaves',
        }
      ];

      await Notification.create(mockNotifications);
      console.log('Mock notifications seeded successfully!');
    }

    // 12. Seed Jobs
    const jobCount = await Job.countDocuments();
    let jobsList = [];
    if (jobCount === 0) {
      console.log('No jobs found. Seeding mock job listings...');
      const mockJobs = [
        {
          title: 'Direct Tax Executive',
          description: 'Looking for a qualified or semi-qualified assistant to handle corporate income tax computation and file tax returns.',
          type: 'Full-time',
          department: departmentsMap['Direct Taxation'] || null,
          requirements: ['B.Com / M.Com / CA Inter', '1-2 years experience in CA firm', 'Familiarity with tax software'],
          skills: ['Direct Tax', 'Income Tax Filing', 'Tax Planning', 'Excel'],
          location: 'Mumbai',
          salaryRange: '₹3,00,000 - ₹4,50,000 P.A.',
          isOpen: true,
        },
        {
          title: 'Article Trainee (Internship)',
          description: 'Openings for CA Article Assistants or general accounting interns. You will get exposure to audits, taxation, and corporate services.',
          type: 'Internship',
          department: departmentsMap['Audit & Assurance'] || null,
          requirements: ['CA Inter cleared (one or both groups)', 'Good communications and MS Excel skills', 'Ready to travel for client audit audits'],
          skills: ['Statutory Audit', 'GST filing basics', 'Voucher entry', 'Analytical skills'],
          location: 'Thane, Mumbai',
          salaryRange: '₹10,000 - ₹15,000 Stipend/Month',
          isOpen: true,
        },
        {
          title: 'GST Advisory Specialist',
          description: 'Manage GST return preparation (GSTR-1, 3B, 9), ITC reconciliation, and handle GST refund files and department appeals.',
          type: 'Full-time',
          department: departmentsMap['Indirect Tax (GST)'] || null,
          requirements: ['Graduate with 3+ years experience in GST compliance', 'Deep understanding of GST act and reconciliation methods'],
          skills: ['GST Returns', 'GSTR-2B Reconciliation', 'Tally Prime', 'Tax Law'],
          location: 'Powai, Mumbai',
          salaryRange: '₹4,00,000 - ₹5,50,000 P.A.',
          isOpen: true,
        }
      ];

      jobsList = await Job.create(mockJobs);
      console.log('Mock jobs seeded successfully!');
    } else {
      jobsList = await Job.find({});
    }

    // 13. Seed Job Applications
    const appCount = await Application.countDocuments();
    if (appCount === 0 && jobsList.length > 0) {
      console.log('No applications found. Seeding mock candidate applications...');
      const articleJob = jobsList.find(j => j.title.includes('Article Trainee'));
      const taxJob = jobsList.find(j => j.title.includes('Direct Tax'));

      const mockApps = [
        {
          job: articleJob?._id || jobsList[0]._id,
          name: 'Rahul Mehta',
          email: 'rahul.mehta@gmail.com',
          phone: '+91 98333 44555',
          resume: 'https://example-resumes.com/rahul_mehta_resume.pdf',
          coverLetter: 'I am highly interested in pursuing my article-ship training with CA Office ERP & Advisory to gain hands-on experience in audit and direct taxation.',
          collegeName: 'HR College of Commerce, Mumbai',
          skills: ['Statutory Audit', 'MS Excel', 'Tally'],
          experience: 'Fresh Graduate / CA Inter',
          status: 'Applied',
        },
        {
          job: taxJob?._id || jobsList[0]._id,
          name: 'Sneha Deshmukh',
          email: 'sneha.deshmukh@outlook.com',
          phone: '+91 97222 11333',
          resume: 'https://example-resumes.com/sneha_deshmukh_resume.pdf',
          coverLetter: 'With 1.5 years of experience in direct tax computations and filing returns, I am looking for a structured firm to advance my career.',
          collegeName: 'Sydenham College, Mumbai',
          skills: ['Income Tax Filing', 'Tax Computation', 'Direct Tax'],
          experience: '1.5 Years in Local Auditing Firm',
          status: 'Interview Scheduled',
          interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          remarks: 'Shortlisted for technical round. Schedule set.',
        },
        {
          job: articleJob?._id || jobsList[0]._id,
          name: 'Ameya Joshi',
          email: 'intern@company.com', // Active intern user email for tracking
          phone: '+91 99999 55555',
          resume: 'https://example-resumes.com/ameya_joshi_resume.pdf',
          coverLetter: 'I cleared CA Inter Group 1 and I am keen to learn operational audits.',
          collegeName: 'RA Podar College, Mumbai',
          skills: ['Voucher verification', 'Audit worksheets', 'Excel'],
          experience: 'Fresher CA Inter',
          status: 'Approved',
          remarks: 'Cleared technical round, approved by Manager.',
        }
      ];

      await Application.create(mockApps);
      console.log('Mock candidate applications seeded successfully!');
    }

    // 14. Seed Active Internship for intern@company.com
    const internshipCount = await Internship.countDocuments();
    if (internshipCount === 0 && usersList.length > 0) {
      console.log('No internships found. Seeding active internship for intern@company.com...');
      const internUser = usersList.find(u => u.email === 'intern@company.com');
      const tlUser = usersList.find(u => u.email === 'tl@company.com');

      if (internUser && tlUser) {
        const activeInternship = await Internship.create({
          user: internUser._id,
          mentor: tlUser._id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 1 month ago
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Ends in 2 months
          department: departmentsMap['Audit & Assurance'] || internUser.department || usersList[0].department,
          status: 'Active',
          progress: 25,
          tasks: [
            {
              title: 'Setup Direct Tax Portal Account',
              description: 'Configure filing credentials and check clients list.',
              status: 'Completed',
              assignedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
              completedDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Reconcile 3 client accounts for FY 2025-26',
              description: 'Reconcile balance sheets, ledger entries and vouchers.',
              status: 'Pending',
              assignedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Submit Weekly Report 1',
              description: 'Summarize work accomplished in the first week.',
              status: 'Pending',
              assignedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Prepare Tax Exemption Checklist',
              description: 'Create draft checklist sheet of personal investment exemptions.',
              status: 'Pending',
              assignedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            }
          ]
        });

        // Seed some mock reports for this internship
        await InternshipReport.create([
          {
            internship: activeInternship._id,
            reportType: 'Weekly',
            weekNumber: 1,
            title: 'Week 1: Orientation and Tax Portal Setup',
            content: 'In my first week, I completed the orientation with my mentor TL. I set up access to the direct tax filing systems and reviewed the active list of clients. I also prepared access documents for standard verification sheets.',
            fileUrl: 'https://example.com/reports/week1_report.pdf',
            feedback: 'Good start. Ensure you follow standard security guidelines when storing client tax passwords.',
            rating: 4,
          }
        ]);

        console.log('Seeded active internship and report successfully!');
      } else {
        console.log('Unable to seed internship: Intern or Mentor user not found.');
      }
    }

    // 15. Seed Client Profile for client@company.com
    const clientCount = await Client.countDocuments();
    let clientProfile = null;
    const clientUser = usersList.find(u => u.email === 'client@company.com');
    
    if (clientCount === 0 && clientUser) {
      console.log('No client profiles found. Seeding mock Client profile...');
      clientProfile = await Client.create({
        user: clientUser._id,
        clientId: '101020655',
        companyName: 'Apex Logistics & Freight Solutions LLP',
        panNumber: 'AAZPA1234F',
        gstin: '27AAZPA1234F1Z0',
        filingStatus: {
          gstStatus: 'In Progress',
          itrStatus: 'Filed',
          auditStatus: 'In Progress'
        },

        pendingWorks: [
          'Provide GSTR-1 Sales Excel Sheets for May 2026',
          'Confirm Capital Purchase Assets Ledger Entries'
        ],
        completedFilings: [
          {
            filingType: 'ITR-6 (Income Tax)',
            period: 'FY 2024-25',
            filedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            acknowledgmentNumber: 'ACK9988221'
          },
          {
            filingType: 'GSTR-3B (GST)',
            period: 'April 2026',
            filedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            acknowledgmentNumber: 'ACK4433119'
          }
        ]
      });
      console.log('Mock client profile seeded successfully!');
    } else if (clientUser) {
      clientProfile = await Client.findOne({ user: clientUser._id });
    }

    // 16. Seed Client Documents
    const clientDocCount = await ClientDocument.countDocuments();
    let seededClientDoc = null;
    if (clientDocCount === 0 && clientProfile && clientUser) {
      console.log('No client documents found. Seeding mock Client documents...');
      const tlUser = usersList.find(u => u.email === 'tl@company.com');

      const mockDocs = [
        {
          client: clientProfile._id,
          name: 'Q4 Audited Balance Sheet 2025',
          documentType: 'Audit',
          fileUrl: 'https://example-documents.com/apex_q4_balance_sheet.pdf',
          uploadedBy: clientUser._id,
          status: 'Uploaded',
          remarks: 'Uploaded by client for verification.'
        },
        {
          client: clientProfile._id,
          name: 'GST Challan GSTR-3B April',
          documentType: 'GST',
          fileUrl: 'https://example-documents.com/apex_gst_challan_april.pdf',
          uploadedBy: tlUser?._id || clientUser._id,
          status: 'Approved',
          remarks: 'Verified tax payment challan, logged.'
        }
      ];

      const createdDocs = await ClientDocument.create(mockDocs);
      seededClientDoc = createdDocs[0];
      console.log('Mock client documents seeded successfully!');
    } else {
      seededClientDoc = await ClientDocument.findOne({});
    }

    // 17. Seed Employee Monthly Reports
    const reportCount = await MonthlyReport.countDocuments();
    if (reportCount === 0 && usersList.length > 0) {
      console.log('No monthly reports found. Seeding mock Monthly reports...');
      const employeeUser = usersList.find(u => u.email === 'employee@company.com');
      const internUser = usersList.find(u => u.email === 'intern@company.com');
      const managerUser = usersList.find(u => u.email === 'manager@company.com');

      if (employeeUser && managerUser) {
        await MonthlyReport.create([
          {
            employee: employeeUser._id,
            month: '2026-04',
            presentDays: 20,
            absentDays: 2,
            lateDays: 1,
            completedTasks: 8,
            pendingTasks: 2,
            performanceScore: 84,
            productivityScore: 82,
            remarks: 'Good job. Maintain current workflow standards.',
            generatedBy: managerUser._id
          }
        ]);
      }

      if (internUser && managerUser) {
        await MonthlyReport.create([
          {
            employee: internUser._id,
            month: '2026-04',
            presentDays: 22,
            absentDays: 0,
            lateDays: 3,
            completedTasks: 4,
            pendingTasks: 1,
            performanceScore: 78,
            productivityScore: 79,
            remarks: 'Good output, watch out for late punch-ins.',
            generatedBy: managerUser._id
          }
        ]);
      }
      console.log('Mock monthly reports seeded successfully!');
    }

    // 18. Seed Compliance Deadlines
    const complianceCount = await Compliance.countDocuments();
    if (complianceCount === 0) {
      console.log('No compliance deadlines found. Seeding compliance deadlines...');
      const sampleDeadlines = [
        {
          title: 'GSTR-1 GST Return filing (Monthly)',
          category: 'GSTR-1',
          dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 11),
          description: 'Filing of GSTR-1 outward supplies for Apex Logistics & general clients.',
          status: 'Pending',
          colorCode: '#f59e0b'
        },
        {
          title: 'GSTR-3B GST Return summary & tax (Monthly)',
          category: 'GSTR-3B',
          dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
          description: 'Filing summary GSTR-3B tax offset and payment matching.',
          status: 'Pending',
          colorCode: '#10b981'
        },
        {
          title: 'Quarterly TDS Returns filing (Form 24Q/26Q)',
          category: 'TDS Returns',
          dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 31),
          description: 'Quarterly salary and non-salary TDS returns statement filing.',
          status: 'Pending',
          colorCode: '#3b82f6'
        },
        {
          title: 'Income Tax Return (ITR) non-audit filing',
          category: 'Income Tax Filing',
          dueDate: new Date(new Date().getFullYear(), 6, 31), // 31st July
          description: 'Individual non-audit tax return files submission deadline.',
          status: 'Pending',
          colorCode: '#ef4444'
        },
        {
          title: 'ROC annual filing form AOC-4 & MGT-7',
          category: 'ROC Filing',
          dueDate: new Date(new Date().getFullYear(), 9, 30), // 30th October
          description: 'ROC financial disclosures and board director list audits.',
          status: 'Pending',
          colorCode: '#8b5cf6'
        },
        {
          title: 'Statutory Tax Audit Report compliance',
          category: 'Audit Deadlines',
          dueDate: new Date(new Date().getFullYear(), 8, 30), // 30th September
          description: 'Corporate audit reports sign-offs and returns verification.',
          status: 'Pending',
          colorCode: '#ec4899'
        }
      ];
      await Compliance.create(sampleDeadlines);
      console.log('Compliance deadlines seeded successfully!');
    }

    // 19. Seed Billing & Invoices
    const invoiceCount = await Invoice.countDocuments();
    if (invoiceCount === 0 && clientProfile) {
      console.log('No invoices found. Seeding mock Invoices...');
      const sampleInvoices = [
        {
          invoiceNumber: 'INV-2026-001',
          client: clientProfile._id,
          serviceName: 'GSTR-1 & 3B Monthly Filing (April 2026)',
          amount: 2500,
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          status: 'Paid',
          paymentHistory: [{
            amountPaid: 2500,
            paymentDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
            transactionId: 'TXN-902919'
          }],
          outstandingBalance: 0
        },
        {
          invoiceNumber: 'INV-2026-002',
          client: clientProfile._id,
          serviceName: 'Company Advisory Incorporation Services',
          amount: 15000,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          status: 'Unpaid',
          outstandingBalance: 15000
        },
        {
          invoiceNumber: 'INV-2026-003',
          client: clientProfile._id,
          serviceName: 'Statutory Ledger Audit & Tax Return FY 25-26',
          amount: 45000,
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
          status: 'Partially Paid',
          paymentHistory: [{
            amountPaid: 25000,
            paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            transactionId: 'TXN-773909'
          }],
          outstandingBalance: 20000
        }
      ];
      await Invoice.create(sampleInvoices);
      console.log('Invoices seeded successfully!');
    }

    // 20. Seed Document Requests
    const requestCount = await DocumentRequest.countDocuments();
    if (requestCount === 0 && clientProfile && usersList.length > 0) {
      console.log('No document requests found. Seeding mock requests...');
      const adminUser = usersList.find(u => u.email === 'admin@company.com');
      const tlUser = usersList.find(u => u.email === 'tl@company.com');
      const managerUser = usersList.find(u => u.email === 'manager@company.com');

      const sampleRequests = [
        {
          requestId: 'REQ-2026-0001',
          client: clientProfile._id,
          requestedBy: adminUser?._id || usersList[0]._id,
          requestedByRole: 'Admin',
          documentName: 'Sales Bills GST',
          category: 'GST',
          description: 'Sales summaries or spreadsheets for active filings.',
          priority: 'High',
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          status: 'Requested'
        },
        {
          requestId: 'REQ-2026-0002',
          client: clientProfile._id,
          requestedBy: tlUser?._id || usersList[0]._id,
          requestedByRole: 'Manager',
          documentName: 'Q4 Audited Balance Sheet 2025',
          category: 'Audit',
          description: 'Audited assets and capital balances worksheet.',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'Uploaded',
          uploadedDocument: seededClientDoc?._id
        },
        {
          requestId: 'REQ-2026-0003',
          client: clientProfile._id,
          requestedBy: managerUser?._id || usersList[0]._id,
          requestedByRole: 'CA Login',
          documentName: 'Bank Statement FY 25-26',
          category: 'Audit',
          description: 'Consolidated statement of active current accounts.',
          priority: 'Critical',
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Overdue
          status: 'Overdue',
          reminderCount: 2,
          lastReminderSent: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];
      await DocumentRequest.create(sampleRequests);
      console.log('Document requests seeded successfully!');
    }

    // 21. Seed Service Request Tickets
    const ticketCount = await Ticket.countDocuments();
    if (ticketCount === 0 && clientProfile && usersList.length > 0) {
      console.log('No support tickets found. Seeding mock tickets...');
      const tlUser = usersList.find(u => u.email === 'tl@company.com');

      const sampleTickets = [
        {
          ticketNumber: 'TKT-2026-001',
          client: clientProfile._id,
          category: 'GST',
          title: 'ITC Verification Mismatch',
          description: 'GSTR-2B is showing lower Input Tax Credit compared to our ledger registration details. Please verify the matching receipts.',
          status: 'Open',
          activityTimeline: [{
            action: 'Ticket created by client',
            performedBy: clientProfile.user,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }]
        },
        {
          ticketNumber: 'TKT-2026-002',
          client: clientProfile._id,
          category: 'Audit',
          title: 'Capital Reserves audit advice',
          description: 'Please review the reserves reallocation and advise on appropriate disclosures for the directors report.',
          status: 'In Progress',
          assignedTo: tlUser?._id,
          comments: [
            {
              user: tlUser?._id || usersList[0]._id,
              userName: tlUser?.name || 'Manager',
              role: 'Manager',
              comment: 'We have analyzed the reserves transfer entries. It requires a note under Section 135 disclosures. Will send the draft text shortly.',
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
            }
          ],
          activityTimeline: [
            {
              action: 'Ticket created by client',
              performedBy: clientProfile.user,
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
              action: 'Ticket assigned to Manager',
              performedBy: usersList[0]._id, // Admin
              timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000)
            }
          ]
        }
      ];
      const createdTickets = await Ticket.create(sampleTickets);
      console.log('Support tickets seeded successfully!');
    }

    // 22. Seed Master Services, Case Types, & Associates
    const { ServiceMaster, AccountantMaster, CaseTypeMaster } = await import('../models/masterModels.js');
    const adminUser = usersList.find(u => u.email === 'admin@company.com');
    if (adminUser) {
      const servicesCount = await ServiceMaster.countDocuments();
      if (servicesCount === 0) {
        console.log('Seeding default services master options...');
        const defaultServices = [
          'GST GSTR-1',
          'GST GSTR-3B',
          'Income Tax ITR-1/2',
          'Income Tax ITR-3/4',
          'Income Tax ITR-5/6',
          'Tax Audit Form 3CD',
          'Statutory Audit',
          'TDS Returns',
          'ROC Compliances',
        ];
        await ServiceMaster.insertMany(defaultServices.map(name => ({
          name,
          description: `${name} standard service option`,
          status: 'Active',
          createdBy: adminUser._id
        })));
        console.log('Seeded default services successfully!');
      }

      const caseTypesCount = await CaseTypeMaster.countDocuments();
      if (caseTypesCount === 0) {
        console.log('Seeding default case types master options...');
        const defaultCaseTypes = [
          'GST Filing',
          'Income Tax Filing',
          'Statutory Audit',
          'Internal Audit',
          'TDS Filing',
          'Company Registration',
        ];
        await CaseTypeMaster.insertMany(defaultCaseTypes.map(name => ({
          name,
          description: `${name} case type option`,
          status: 'Active',
          createdBy: adminUser._id
        })));
        console.log('Seeded default case types successfully!');
      }

      const accountantsCount = await AccountantMaster.countDocuments();
      if (accountantsCount === 0) {
        console.log('Seeding default associates master options...');
        const defaultAssociates = [
          { associate_name: 'CA Ramesh', email: 'ramesh@company.com', phone_number: '9888877777' },
          { associate_name: 'CA Suresh', email: 'suresh@company.com', phone_number: '9777766666' },
          { associate_name: 'CA Priya', email: 'priya@company.com', phone_number: '9666655555' },
        ];
        await AccountantMaster.insertMany(defaultAssociates.map(assoc => ({
          ...assoc,
          status: 'Active',
          createdBy: adminUser._id
        })));
        console.log('Seeded default associates successfully!');
      }
    }

  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
  }
};

export const migrateRoles = async () => {
  try {
    // Check if the new role hierarchy is already present (from seed or previous migration)
    const caLoginRoleExists = await Role.findOne({ name: 'CA Login' });
    if (caLoginRoleExists) {
      console.log('✓ Role hierarchy is already up-to-date (CA Login exists). Skipping migration.');
      return;
    }

    console.log('Running role hierarchy renaming migration...');

    // 1. Rename 'Manager' -> 'CA Login'
    const managerRole = await Role.findOne({ name: 'Manager' });
    if (managerRole) {
      managerRole.name = 'CA Login';
      managerRole.description = 'CA Login (previously Manager)';
      await managerRole.save();
      console.log("✓ Renamed Role 'Manager' to 'CA Login' in database.");
    }

    // 2. Rename 'TL' -> 'Manager'
    const tlRole = await Role.findOne({ name: 'TL' });
    if (tlRole) {
      tlRole.name = 'Manager';
      tlRole.description = 'Manager (previously Team Lead)';
      await tlRole.save();
      console.log("✓ Renamed Role 'TL' to 'Manager' in database.");
    }

    // 3. Migrate Document Requests requestedByRole string field
    const docReqRes1 = await DocumentRequest.updateMany(
      { requestedByRole: 'Manager' },
      { $set: { requestedByRole: 'CA Login' } }
    );
    const docReqRes2 = await DocumentRequest.updateMany(
      { requestedByRole: 'TL' },
      { $set: { requestedByRole: 'Manager' } }
    );
    
    // Migrate Document Requests approvalHistory array
    const docReqRes3 = await DocumentRequest.updateMany(
      { 'approvalHistory.role': 'Manager' },
      { $set: { 'approvalHistory.$[elem].role': 'CA Login' } },
      { arrayFilters: [{ 'elem.role': 'Manager' }] }
    );
    const docReqRes4 = await DocumentRequest.updateMany(
      { 'approvalHistory.role': 'TL' },
      { $set: { 'approvalHistory.$[elem].role': 'Manager' } },
      { arrayFilters: [{ 'elem.role': 'TL' }] }
    );
    console.log(`✓ Updated Document Requests role strings in database.`);

    // 4. Migrate Support Tickets comments array
    const ticketRes1 = await Ticket.updateMany(
      { 'comments.role': 'Manager' },
      { $set: { 'comments.$[elem].role': 'CA Login' } },
      { arrayFilters: [{ 'elem.role': 'Manager' }] }
    );
    const ticketRes2 = await Ticket.updateMany(
      { 'comments.role': 'TL' },
      { $set: { 'comments.$[elem].role': 'Manager' } },
      { arrayFilters: [{ 'elem.role': 'TL' }] }
    );
    console.log(`✓ Updated Ticket Comments role strings in database.`);

    // 5. Migrate Audit Logs userRole string field
    const auditLogs1 = await AuditLog.updateMany(
      { userRole: 'Manager' },
      { $set: { userRole: 'CA Login' } }
    );
    const auditLogs2 = await AuditLog.updateMany(
      { userRole: 'TL' },
      { $set: { userRole: 'Manager' } }
    );
    console.log(`✓ Updated Audit Logs role strings in database.`);
  } catch (err) {
    console.error(`Migration error: ${err.message}`);
  }
};
