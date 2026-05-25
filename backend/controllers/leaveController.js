import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notification.js';
import { sendLeaveStatusEmail } from '../services/emailService.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (Employees, Interns, TLs, Managers, Admins)
export const applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    // Calculate days requested
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check if employee has enough leave balance (warn but allow submitting)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const leave = await LeaveRequest.create({
      user: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: 'Pending',
    });

    // Notify Admins and Managers about the new leave request
    const reviewers = await User.find({ role: { $in: await getReviewerRoleIds() } });
    for (const reviewer of reviewers) {
      await sendNotification({
        recipient: reviewer._id,
        sender: req.user._id,
        title: 'New Leave Request',
        message: `${req.user.name} applied for ${diffDays} day(s) of ${leaveType}.`,
        type: 'Leave',
        link: '/leaves',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my leave history
// @route   GET /api/leaves/my
// @access  Private (Any staff)
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ user: req.user._id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all leave requests (for managers/admins)
// @route   GET /api/leaves
// @access  Private (Admin, Manager)
export const getAllLeaves = async (req, res) => {
  const { status } = req.query;

  try {
    const query = {};
    if (status) {
      query.status = status;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('user', 'name email employeeId role leaveBalance')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or Reject leave request
// @route   PUT /api/leaves/:id/status
// @access  Private (Admin, Manager)
export const updateLeaveStatus = async (req, res) => {
  const { status, remarks } = req.body;

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide valid status (Approved or Rejected)' });
  }

  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot change status. Leave request is already ${leave.status}.` });
    }

    const requester = await User.findById(leave.user);
    if (!requester) {
      return res.status(404).json({ success: false, message: 'Employee associated with this leave not found' });
    }

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (status === 'Approved') {
      // Deduct leaves
      requester.leaveBalance = Math.max(0, (requester.leaveBalance || 0) - diffDays);
      await requester.save();
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.remarks = remarks || '';
    await leave.save();

    // Trigger transactional email
    try {
      await sendLeaveStatusEmail(requester.email, requester.name, leave.leaveType, status, remarks, diffDays);
    } catch (err) {
      console.error('Failed to send leave status email:', err.message);
    }

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Leave Decision',
      details: `Leave request for ${requester.name} (${diffDays} days ${leave.leaveType}) set to ${status}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Send notification to the employee
    await sendNotification({
      recipient: leave.user,
      sender: req.user._id,
      title: `Leave Request ${status}`,
      message: `Your request for ${diffDays} day(s) of ${leave.leaveType} has been ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      type: 'Leave',
      link: '/leaves',
    });

    res.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully.`,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a leave request
// @route   PUT /api/leaves/:id/cancel
// @access  Private (Staff who created the request)
export const cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    // Ensure user is the owner of request
    if (leave.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    if (leave.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Leave request is already cancelled' });
    }

    if (leave.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a rejected request' });
    }

    // If approved, we need to credit back the leaves
    if (leave.status === 'Approved') {
      const requester = await User.findById(leave.user);
      if (requester) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        requester.leaveBalance = (requester.leaveBalance || 0) + diffDays;
        await requester.save();
      }
    }

    leave.status = 'Cancelled';
    await leave.save();

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Leave Cancelled',
      details: `Leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} cancelled`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Notify reviewers (Admins and Managers)
    const reviewers = await User.find({ role: { $in: await getReviewerRoleIds() } });
    for (const reviewer of reviewers) {
      await sendNotification({
        recipient: reviewer._id,
        sender: req.user._id,
        title: 'Leave Request Cancelled',
        message: `${req.user.name} cancelled their leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}.`,
        type: 'Leave',
        link: '/leaves',
      });
    }

    res.json({
      success: true,
      message: 'Leave request cancelled successfully.',
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Resolve role ObjectIds for Admin & Manager roles
import Role from '../models/Role.js';
const getReviewerRoleIds = async () => {
  const roles = await Role.find({ name: { $in: ['Admin', 'Manager'] } });
  return roles.map(r => r._id);
};
