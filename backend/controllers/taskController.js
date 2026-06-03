import Task from '../models/Task.js';
import TaskComment from '../models/TaskComment.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendNotification } from '../utils/notification.js';
import { sendTaskAssignmentEmail, sendReminderEmail } from '../services/emailService.js';
import AuditLog from '../models/AuditLog.js';

// Helper: Check if user is Admin or Manager
const isManagerOrAdmin = (roleName) => {
  return ['Admin', 'Manager'].includes(roleName);
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin, Manager, TL)
export const createTask = async (req, res) => {
  const { title, description, assignedTo, priority, dueDate, department } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ success: false, message: 'Task title and due date are required' });
  }

  try {
    const task = await Task.create({
      title,
      description,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'Medium',
      dueDate,
      department: department || null,
      activityLogs: [
        {
          user: req.user._id,
          action: 'Task created.',
        },
      ],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId')
      .populate('createdBy', 'name')
      .populate('department', 'name');

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Task Created',
      details: `Task "${title}" created and assigned to ${populatedTask.assignedTo?.name || 'Unassigned'}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Notify assignee if assigned
    if (assignedTo && populatedTask.assignedTo) {
      try {
        await sendTaskAssignmentEmail(
          populatedTask.assignedTo.email,
          populatedTask.assignedTo.name,
          title,
          dueDate,
          req.user.name
        );
      } catch (err) {
        console.error('Failed to send task assignment email:', err.message);
      }

      await sendNotification({
        recipient: assignedTo,
        sender: req.user._id,
        title: 'New Task Assigned',
        message: `You have been assigned task: "${title}". Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'Task',
        link: '/tasks',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: populatedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tasks by role scope
// @route   GET /api/tasks
// @access  Private (All Authenticated users)
export const getTasks = async (req, res) => {
  const { status, priority, department, assignedTo, search } = req.query;

  try {
    const roleDoc = await Role.findById(req.user.role);
    const roleName = roleDoc ? roleDoc.name : 'Employee';

    const query = {};

    // Scope rules:
    // Admin & Manager: See all tasks
    // TL: See tasks created by them, assigned to them, OR tasks in their department
    // Employee & Intern: See only tasks assigned to them
    if (roleName === 'TL') {
      const matchConditions = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
      ];
      if (req.user.department) {
        matchConditions.push({ department: req.user.department });
      }
      query.$or = matchConditions;
    } else if (roleName === 'Employee' || roleName === 'Intern') {
      query.assignedTo = req.user._id;
    }

    // Apply Filter: Status
    if (status) {
      query.status = status;
    }

    // Apply Filter: Priority
    if (priority) {
      query.priority = priority;
    }

    // Apply Filter: Department
    if (department) {
      query.department = department;
    }

    // Apply Filter: AssignedTo
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Apply Filter: Search (title or description)
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email employeeId')
      .populate('createdBy', 'name')
      .populate('department', 'name')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a task (details, status, or progress)
// @route   PUT /api/tasks/:id
// @access  Private (All Authenticated staff)
export const updateTask = async (req, res) => {
  const { title, description, assignedTo, priority, dueDate, status, progress, department, attachments } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const roleDoc = await Role.findById(req.user.role);
    const roleName = roleDoc ? roleDoc.name : 'Employee';

    // Verify role permissions:
    // Employees & Interns can ONLY edit: status, progress, attachments, comments on tasks assigned to them.
    // Managers & Department TLs can edit details. Admin has no task privileges.
    const isSpecialPrivilege = roleName === 'Manager' || (roleName === 'TL' && task.department?.toString() === req.user.department?.toString());
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    if (!isSpecialPrivilege && !isAssignee) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this task' });
    }

    const initialStatus = task.status;
    const initialProgress = task.progress;
    const initialAssignee = task.assignedTo;

    // Enforce limits:
    if (isSpecialPrivilege) {
      // Admin, Manager, and department TLs can edit everything
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (department !== undefined) task.department = department || null;
    }

    // Assignee and Admins/Managers/TL can update status & progress
    if (status !== undefined && status !== initialStatus) {
      task.status = status;
      task.activityLogs.push({
        user: req.user._id,
        action: `Status updated from "${initialStatus}" to "${status}".`,
      });
    }

    if (progress !== undefined && Number(progress) !== initialProgress) {
      task.progress = Number(progress);
      task.activityLogs.push({
        user: req.user._id,
        action: `Progress updated from ${initialProgress}% to ${progress}%.`,
      });
    }

    if (attachments !== undefined) {
      // Merge or overwrite attachments list
      task.attachments = attachments;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId')
      .populate('createdBy', 'name')
      .populate('department', 'name');

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Task Updated',
      details: `Task "${task.title}" updated. Status: ${task.status}, Progress: ${task.progress}%`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Notify assignee if assignment changed
    if (assignedTo && assignedTo.toString() !== initialAssignee?.toString() && updatedTask.assignedTo) {
      try {
        await sendTaskAssignmentEmail(
          updatedTask.assignedTo.email,
          updatedTask.assignedTo.name,
          task.title,
          task.dueDate,
          req.user.name
        );
      } catch (err) {
        console.error('Failed to send task update email:', err.message);
      }

      await sendNotification({
        recipient: assignedTo,
        sender: req.user._id,
        title: 'Task Assignment Update',
        message: `You have been assigned task: "${task.title}".`,
        type: 'Task',
        link: '/tasks',
      });
    }

    // Notify creator if status changed by assignee
    if (isAssignee && !isSpecialPrivilege && status !== initialStatus) {
      await sendNotification({
        recipient: task.createdBy,
        sender: req.user._id,
        title: 'Task Status Update',
        message: `${req.user.name} changed status of "${task.title}" to ${status}`,
        type: 'Task',
        link: '/tasks',
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, Manager only)
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Clean up task comments associated with this task
    await TaskComment.deleteMany({ task: req.params.id });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Task Deleted',
      details: `Task "${task.title}" deleted`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Task and comments deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private (All Authenticated staff)
export const addTaskComment = async (req, res) => {
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ success: false, message: 'Please provide comment text' });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const taskComment = await TaskComment.create({
      task: req.params.id,
      user: req.user._id,
      comment,
    });

    const populatedComment = await TaskComment.findById(taskComment._id).populate('user', 'name email');

    // Notify creator & assignee
    const recipients = new Set();
    if (task.createdBy.toString() !== req.user._id.toString()) {
      recipients.add(task.createdBy.toString());
    }
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      recipients.add(task.assignedTo.toString());
    }

    for (const recipientId of recipients) {
      await sendNotification({
        recipient: recipientId,
        sender: req.user._id,
        title: 'New Task Comment',
        message: `${req.user.name} commented on "${task.title}": "${comment.substring(0, 30)}..."`,
        type: 'Task',
        link: '/tasks',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      data: populatedComment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private (All Authenticated staff)
export const getTaskComments = async (req, res) => {
  try {
    const comments = await TaskComment.find({ task: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger reminder emails for tasks due soon or overdue
// @route   POST /api/tasks/remind-pending
// @access  Private (Admin, Manager, TL)
export const remindPendingTasks = async (req, res) => {
  try {
    const boundaryDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    const tasks = await Task.find({
      status: { $ne: 'Completed' },
      assignedTo: { $ne: null },
      dueDate: { $lte: boundaryDate }
    }).populate('assignedTo', 'name email');

    const sentReminders = [];

    for (const task of tasks) {
      if (task.assignedTo) {
        try {
          const detailStr = `Your assigned task "${task.title}" is due soon (Due Date: ${new Date(task.dueDate).toLocaleDateString()}). Please update your progress on the task board.`;
          await sendReminderEmail(
            task.assignedTo.email,
            task.assignedTo.name,
            'Upcoming Task Deadline',
            detailStr
          );
          
          await sendNotification({
            recipient: task.assignedTo._id,
            sender: req.user._id,
            title: 'Urgent Task Reminder',
            message: `Task "${task.title}" is due soon.`,
            type: 'Task',
            link: '/tasks',
          });

          sentReminders.push({
            taskId: task._id,
            taskTitle: task.title,
            employeeName: task.assignedTo.name,
            employeeEmail: task.assignedTo.email,
          });
        } catch (mailErr) {
          console.error(`Failed to send reminder to ${task.assignedTo.email}:`, mailErr.message);
        }
      }
    }

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Task Reminders Triggered',
      details: `Triggered deadline reminders for ${sentReminders.length} tasks due within 48 hours`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Triggered ${sentReminders.length} task reminders.`,
      data: sentReminders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
