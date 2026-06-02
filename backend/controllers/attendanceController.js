import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Daily Check-In
// @route   POST /api/attendance/check-in
// @access  Private (All Employees/Staff)
export const checkIn = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    // Check if check-in already exists for today
    const exists = await Attendance.findOne({ user: req.user._id, date: todayStr });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Already checked in for today' });
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    let status = 'Present';
    let lateTime = 0;

    // Check-in after 1:30 PM is marked as Half-Day
    if (hours > 13 || (hours === 13 && minutes >= 30)) {
      status = 'Half-Day';
    }
    // Late threshold: 09:45 AM
    else if (hours > 9 || (hours === 9 && minutes > 45)) {
      status = 'Late';
      // Calculate minutes late past 9:45 AM
      lateTime = (hours - 9) * 60 + minutes - 45;
    }

    const log = await Attendance.create({
      user: req.user._id,
      date: todayStr,
      checkIn: now,
      status,
      lateTime,
    });

    res.status(201).json({
      success: true,
      message: status === 'Half-Day' 
        ? 'Checked in successfully (Late entry marked as Half-Day)'
        : status === 'Late' 
          ? `Checked in successfully (Late by ${lateTime} mins)` 
          : 'Checked in successfully.',
      data: log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Daily Check-Out
// @route   POST /api/attendance/check-out
// @access  Private (All Employees/Staff)
export const checkOut = async (req, res) => {
  try {
    const todayStr = getLocalDateString();

    // Find today's check-in log
    const log = await Attendance.findOne({ user: req.user._id, date: todayStr });
    if (!log) {
      return res.status(400).json({ success: false, message: 'No check-in log found for today. Please check-in first.' });
    }

    if (log.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out for today' });
    }

    const now = new Date();
    log.checkOut = now;

    // If break was started but not ended, end it automatically now at checkout
    if (log.breakStart && !log.breakEnd) {
      log.breakEnd = now;
      const breakMs = log.breakEnd - log.breakStart;
      log.breakDuration = Math.round(breakMs / (1000 * 60));
    }

    // Calculate work hours: checkOut - checkIn
    const diffMs = log.checkOut - log.checkIn;
    // Deduct actual logged break duration
    const breakMs = log.breakDuration ? log.breakDuration * 60 * 1000 : 0;
    const netMs = diffMs - breakMs;

    // Compute net work hours (minimum 0)
    const workHours = netMs > 0 ? netMs / (1000 * 60 * 60) : 0;
    log.workHours = Number(workHours.toFixed(2));

    const checkOutHours = now.getHours();
    const checkOutMinutes = now.getMinutes();
    
    // Check-out threshold: 05:30 PM (17:30)
    const isEarlyCheckOut = checkOutHours < 17 || (checkOutHours === 17 && checkOutMinutes < 30);

    const checkInDate = new Date(log.checkIn);
    const checkInHours = checkInDate.getHours();
    const checkInMinutes = checkInDate.getMinutes();
    const checkedInAfter130 = checkInHours > 13 || (checkInHours === 13 && checkInMinutes >= 30);

    // Half-Day if workHours < 4.0 or checked out before 05:30 PM or checked in after 1:30 PM
    if (log.workHours < 4.0 || isEarlyCheckOut || checkedInAfter130) {
      log.status = 'Half-Day';
    } else {
      // Re-evaluate check-in status (Late vs Present)
      if (checkInHours > 9 || (checkInHours === 9 && checkInMinutes > 45)) {
        log.status = 'Late';
      } else {
        log.status = 'Present';
      }
    }

    await log.save();

    res.json({
      success: true,
      message: log.status === 'Half-Day' 
        ? `Checked out successfully (Logged ${log.workHours} h - marked as Half-Day)` 
        : `Checked out successfully. Logged ${log.workHours} working hours.`,
      data: log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current employee statistics for dashboard
// @route   GET /api/attendance/stats
// @access  Private (All Employees/Staff)
export const getMyAttendanceStats = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    // Find today's log
    const todayLog = await Attendance.findOne({ user: req.user._id, date: todayStr });
    
    // Find all history logs for percentage
    const logs = await Attendance.find({ user: req.user._id });
    const totalDays = logs.length;
    
    // Calculate attendance percentage: (Present + Late) count vs Total days checked in
    const presentDays = logs.filter(l => l.status === 'Present' || l.status === 'Late').length;
    const halfDays = logs.filter(l => l.status === 'Half-Day').length;
    const percentage = totalDays > 0 ? (((presentDays + (halfDays * 0.5)) / totalDays) * 100).toFixed(1) : 100;

    res.json({
      success: true,
      data: {
        today: todayLog || null,
        attendancePercentage: Number(percentage),
        totalWorkingDays: totalDays,
        leaveBalance: req.user.leaveBalance,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get personal attendance history
// @route   GET /api/attendance/my-history
// @access  Private (All Employees/Staff)
export const getMyAttendanceHistory = async (req, res) => {
  try {
    const logs = await Attendance.find({ user: req.user._id }).sort({ date: -1 }).limit(31);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team attendance status for Manager/Admin
// @route   GET /api/attendance/team-today
// @access  Private (Admin, Manager)
export const getTeamAttendanceToday = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    // Fetch all active employees
    const employees = await User.find({ role: { $ne: null } })
      .populate('role', 'name')
      .populate('department', 'name')
      .sort({ name: 1 });

    // Fetch today's logs
    const logs = await Attendance.find({ date: todayStr });

    // Map logs to employees
    const data = employees.map(emp => {
      const log = logs.find(l => l.user.toString() === emp._id.toString());
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        employeeId: emp.employeeId,
        role: emp.role?.name,
        department: emp.department?.name || 'Unallocated',
        attendance: log || { status: 'Absent', checkIn: null, checkOut: null, workHours: 0 }
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Attendance Analytics charts and lists for manager dashboard
// @route   GET /api/attendance/analytics
// @access  Private (Admin, Manager)
export const getAttendanceAnalytics = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    // Total employees (excluding Clients)
    const employeesCount = await User.countDocuments({ employeeId: { $exists: true, $ne: null } });

    // Today's logs
    const logsToday = await Attendance.find({ date: todayStr }).populate('user', 'name employeeId');

    const presentCount = logsToday.filter(l => l.status === 'Present').length;
    const lateCount = logsToday.filter(l => l.status === 'Late').length;
    const halfDayCount = logsToday.filter(l => l.status === 'Half-Day').length;
    const absentCount = employeesCount - logsToday.length;

    // Get list of late employees today
    const lateEmployees = logsToday.filter(l => l.status === 'Late').map(l => ({
      _id: l.user?._id,
      name: l.user?.name,
      employeeId: l.user?.employeeId,
      checkIn: l.checkIn,
      lateTime: l.lateTime,
    }));

    // Get list of absent employees (haven't checked in)
    const activeStaff = await User.find({ employeeId: { $exists: true, $ne: null } }).select('name employeeId');
    const checkedInUserIds = logsToday.map(l => l.user?._id?.toString());
    const absentEmployees = activeStaff.filter(emp => !checkedInUserIds.includes(emp._id.toString()));

    // Seed/Calculate 7-day trend (last 7 days of attendance counts)
    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendDays.push(getLocalDateString(d));
    }

    const trendData = await Promise.all(trendDays.map(async (dateStr) => {
      const count = await Attendance.countDocuments({ date: dateStr, status: { $in: ['Present', 'Late', 'Half-Day'] } });
      return {
        date: dateStr.split('-').slice(1).join('/'), // MM/DD format
        Present: count,
      };
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalStaff: employeesCount,
          present: presentCount + lateCount + halfDayCount,
          late: lateCount,
          halfDay: halfDayCount,
          absent: absentCount > 0 ? absentCount : 0,
        },
        lateEmployees,
        absentEmployees,
        weeklyTrend: trendData,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate monthly attendance report spreadsheet data
// @route   GET /api/attendance/report
// @access  Private (Admin, Manager)
export const getMonthlyAttendanceReport = async (req, res) => {
  const { month } = req.query; // Format: YYYY-MM

  if (!month) {
    return res.status(400).json({ success: false, message: 'Please provide month parameter (YYYY-MM)' });
  }

  try {
    const employees = await User.find({ employeeId: { $exists: true } }).select('name email employeeId').sort({ name: 1 });
    
    // Find all attendance logs for this month
    const startRegex = new RegExp(`^${month}`);
    const logs = await Attendance.find({ date: { $regex: startRegex } });

    const report = employees.map(emp => {
      const empLogs = logs.filter(l => l.user.toString() === emp._id.toString());
      
      const presents = empLogs.filter(l => l.status === 'Present').length;
      const lates = empLogs.filter(l => l.status === 'Late').length;
      const halfDays = empLogs.filter(l => l.status === 'Half-Day').length;
      
      // Calculate active working days in month so far (excluding weekends or standard days)
      const totalChecked = empLogs.length;

      return {
        _id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        present: presents,
        late: lates,
        halfDay: halfDays,
        absent: 22 - totalChecked > 0 ? 22 - totalChecked : 0, // Assumption of 22 working days/month
        logs: empLogs.reduce((acc, current) => {
          acc[current.date] = current.status;
          return acc;
        }, {})
      };
    });

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start Lunch Break
// @route   POST /api/attendance/start-break
// @access  Private (All Employees/Staff)
export const startBreak = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    const log = await Attendance.findOne({ user: req.user._id, date: todayStr });
    if (!log) {
      return res.status(400).json({ success: false, message: 'You must check-in before taking a break.' });
    }
    if (log.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out for today.' });
    }
    if (log.breakStart) {
      return res.status(400).json({ success: false, message: 'Lunch break already started/taken.' });
    }

    log.breakStart = new Date();
    await log.save();

    res.json({
      success: true,
      message: 'Lunch break started successfully.',
      data: log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End Lunch Break
// @route   POST /api/attendance/end-break
// @access  Private (All Employees/Staff)
export const endBreak = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    const log = await Attendance.findOne({ user: req.user._id, date: todayStr });
    if (!log) {
      return res.status(400).json({ success: false, message: 'No attendance log found.' });
    }
    if (!log.breakStart) {
      return res.status(400).json({ success: false, message: 'Lunch break has not been started.' });
    }
    if (log.breakEnd) {
      return res.status(400).json({ success: false, message: 'Lunch break already ended.' });
    }

    log.breakEnd = new Date();
    
    // Calculate break duration in minutes
    const diffMs = log.breakEnd - log.breakStart;
    log.breakDuration = Math.round(diffMs / (1000 * 60)); // In minutes
    
    await log.save();

    res.json({
      success: true,
      message: `Lunch break ended successfully (${log.breakDuration} mins).`,
      data: log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
