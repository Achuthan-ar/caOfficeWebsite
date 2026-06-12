import MonthlyReport from '../models/MonthlyReport.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Task from '../models/Task.js';
import Department from '../models/Department.js';

// Helper to count weekdays (Mon-Fri) in a given month
const getWeekdaysCount = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  
  let weekdays = 0;
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      weekdays++;
    }
  }
  return weekdays;
};

// @desc    Generate and save employee Monthly Report
// @route   POST /api/reports/generate
// @access  Private (CA Login, Admin)
export const generateMonthlyReport = async (req, res) => {
  const { employeeId, month } = req.body; // month format: "YYYY-MM"

  if (!employeeId || !month) {
    return res.status(400).json({ success: false, message: 'Please provide employeeId and month (YYYY-MM).' });
  }

  try {
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // 1. Calculate Attendance Stats
    // Query attendance records for the month
    const attendanceLogs = await Attendance.find({
      user: employeeId,
      date: { $regex: `^${month}` }
    });

    const presentDays = attendanceLogs.filter(log => ['Present', 'Late', 'Half-Day'].includes(log.status)).length;
    const lateDays = attendanceLogs.filter(log => log.status === 'Late').length;
    const halfDays = attendanceLogs.filter(log => log.status === 'Half-Day').length;

    // Calculate absent days based on total weekdays minus logged present days
    const totalWorkingDays = getWeekdaysCount(month);
    const absentDays = Math.max(0, totalWorkingDays - presentDays);

    // 2. Calculate Task Stats
    const tasks = await Task.find({
      assignedTo: employeeId
    });

    // Filter tasks active/completed during the target month
    // We check if task was updated or due in the month
    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

    const activeTasks = tasks.filter(task => {
      const due = new Date(task.dueDate);
      const updated = new Date(task.updatedAt);
      return (due >= monthStart && due <= monthEnd) || (updated >= monthStart && updated <= monthEnd) || task.status === 'In Progress';
    });

    const completedTasks = activeTasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = activeTasks.filter(t => t.status !== 'Completed').length;

    // 3. Compute Metrics
    // Task Completion Rate (TCR)
    const totalTasks = completedTasks + pendingTasks;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

    // Attendance Score (ATS) - Start at 100. Deduct 3 per Late, 5 per Half-day, 10 per Absent.
    let attendanceScore = 100 - (lateDays * 3) - (halfDays * 5) - (absentDays * 10);
    attendanceScore = Math.max(0, Math.min(100, attendanceScore));

    // Performance Score: 60% Task, 40% Attendance
    const performanceScore = Math.round((taskCompletionRate * 0.6) + (attendanceScore * 0.4));

    // Productivity Score: 70% Task, 30% Attendance
    const productivityScore = Math.round((taskCompletionRate * 0.7) + (attendanceScore * 0.3));

    // Determine remarks based on performance score
    let remarks = 'Good job. Maintain current workflow standards.';
    if (performanceScore >= 90) remarks = 'Excellent performance! Role-model output.';
    else if (performanceScore < 60) remarks = 'Needs improvement. Recommend coordinating with supervisor.';

    // Create or update the Monthly Report in DB
    const report = await MonthlyReport.findOneAndUpdate(
      { employee: employeeId, month },
      {
        presentDays,
        absentDays,
        lateDays,
        completedTasks,
        pendingTasks,
        performanceScore,
        productivityScore,
        remarks,
        generatedBy: req.user._id
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Monthly report generated successfully.',
      data: report
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly reports history
// @route   GET /api/reports
// @access  Private (Employee, Manager, CA Login, Admin)
export const getMonthlyReports = async (req, res) => {
  const { employeeId, month, department } = req.query;

  try {
    let query = {};

    // Restriction filters: Non-Admin/Managers can only see their own reports (unless TL viewing department reports)
    if (!['Admin', 'CA Login'].includes(req.user.role.name)) {
      if (req.user.role.name === 'Manager') {
        // TL can view reports of employees in their department
        if (department) {
          query.department = department;
        } else {
          // Default to TL's own department
          const tlUser = await User.findById(req.user._id);
          if (tlUser && tlUser.department) {
            // Find users in the TL's department
            const deptEmployees = await User.find({ department: tlUser.department });
            const empIds = deptEmployees.map(e => e._id);
            query.employee = { $in: empIds };
          } else {
            query.employee = req.user._id;
          }
        }
      } else {
        query.employee = req.user._id;
      }
    } else {
      // Admin and CA Logins can filter by target employee
      if (employeeId) {
        query.employee = employeeId;
      }
    }

    if (month) {
      query.month = month;
    }

    const reports = await MonthlyReport.find(query)
      .populate({
        path: 'employee',
        select: 'name email employeeId department role',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'role', select: 'name' }
        ]
      })
      .populate('generatedBy', 'name')
      .sort({ month: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comparative team performance statistics grouped by Department
// @route   GET /api/reports/teams
// @access  Private (Manager, CA Login, Admin)
export const getTeamPerformance = async (req, res) => {
  const { month } = req.query;
  
  if (!month) {
    return res.status(400).json({ success: false, message: 'Please specify the month (YYYY-MM).' });
  }

  try {
    // Fetch all monthly reports for the target month
    const reports = await MonthlyReport.find({ month }).populate({
      path: 'employee',
      select: 'department',
      populate: { path: 'department', select: 'name' }
    });

    // Group by department name
    const deptStats = {};

    reports.forEach(report => {
      const deptName = report.employee?.department?.name || 'General Operations';
      if (!deptStats[deptName]) {
        deptStats[deptName] = {
          departmentName: deptName,
          totalScore: 0,
          totalProductivity: 0,
          employeeCount: 0
        };
      }

      deptStats[deptName].totalScore += report.performanceScore;
      deptStats[deptName].totalProductivity += report.productivityScore;
      deptStats[deptName].employeeCount += 1;
    });

    const data = Object.values(deptStats).map(stat => ({
      departmentName: stat.departmentName,
      avgPerformance: Math.round(stat.totalScore / stat.employeeCount),
      avgProductivity: Math.round(stat.totalProductivity / stat.employeeCount),
      employeeCount: stat.employeeCount
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active reports statistics (total counts, averages)
// @route   GET /api/reports/analytics
// @access  Private (CA Login, Admin)
export const getReportAnalytics = async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ success: false, message: 'Please specify the month (YYYY-MM).' });
  }

  try {
    const reports = await MonthlyReport.find({ month });
    
    if (reports.length === 0) {
      return res.json({
        success: true,
        data: {
          avgPerformance: 0,
          avgProductivity: 0,
          totalLates: 0,
          totalAbsences: 0,
          generatedReportsCount: 0
        }
      });
    }

    const totalPerf = reports.reduce((acc, r) => acc + r.performanceScore, 0);
    const totalProd = reports.reduce((acc, r) => acc + r.productivityScore, 0);
    const totalLates = reports.reduce((acc, r) => acc + r.lateDays, 0);
    const totalAbs = reports.reduce((acc, r) => acc + r.absentDays, 0);

    res.json({
      success: true,
      data: {
        avgPerformance: Math.round(totalPerf / reports.length),
        avgProductivity: Math.round(totalProd / reports.length),
        totalLates,
        totalAbsences: totalAbs,
        generatedReportsCount: reports.length
      }
    });

  } catch (error) {
    res.status(550).json({ success: false, message: error.message });
  }
};
