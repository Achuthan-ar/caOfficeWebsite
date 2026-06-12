import Task from '../models/Task.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Client from '../models/Client.js';
import { sendNotification } from '../utils/notification.js';
import { sendTaskAssignmentEmail, sendReminderEmail } from '../services/emailService.js';
import AuditLog from '../models/AuditLog.js';
import { emitTaskCreated, emitTaskUpdated, emitTaskDeleted } from '../services/socketService.js';
import mongoose from 'mongoose';

// Helper: Check if user is Admin or Manager
const isManagerOrAdmin = (roleName) => {
  return ['Admin', 'CA Login'].includes(roleName);
};

// Helper: Build scoped query for tasks based on user role and request parameters
const getScopedQuery = async (req) => {
  const roleDoc = await Role.findById(req.user.role);
  const roleName = roleDoc ? roleDoc.name : 'Employee';
  const query = {};

  // Scope rules:
  // Admin & CA Login: See all tasks
  // Manager: See tasks created by them, assigned to them (as lead or employee), OR tasks in their department
  // Employee & Intern: See only tasks assigned to them
  if (roleName === 'Manager') {
    const matchConditions = [
      { createdBy: req.user._id },
      { assignedTeamLead: req.user._id },
      { assignedEmployee: req.user._id },
    ];
    if (req.user.department) {
      matchConditions.push({ department: req.user.department });
    }
    query.$or = matchConditions;
  } else if (roleName === 'Employee' || roleName === 'Intern') {
    query.assignedEmployee = req.user._id;
  } else if (roleName === 'Client') {
    const client = await Client.findOne({ user: req.user._id });
    if (client) {
      query.clientId = client._id;
      query.clientVisible = 'Yes';
    } else {
      // Force empty matching
      query._id = new mongoose.Types.ObjectId();
    }
  }

  // Parse filters
  const {
    status,
    priority,
    department,
    assignedEmployee,
    assignedTo,
    financialYear,
    teamLead,
    assignedTeamLead,
    dueDateStart,
    dueDateEnd,
    search,
    clientId,
  } = req.query;

  const applyMultiFilter = (fieldName, queryValue) => {
    if (!queryValue) return;
    if (Array.isArray(queryValue)) {
      query[fieldName] = { $in: queryValue };
    } else if (typeof queryValue === 'string' && queryValue.includes(',')) {
      query[fieldName] = { $in: queryValue.split(',') };
    } else {
      query[fieldName] = queryValue;
    }
  };

  applyMultiFilter('status', status);
  applyMultiFilter('priority', priority);
  applyMultiFilter('financialYear', financialYear);
  applyMultiFilter('assignedEmployee', assignedEmployee || assignedTo);
  applyMultiFilter('assignedTeamLead', teamLead || assignedTeamLead);
  applyMultiFilter('clientId', clientId);

  if (department) {
    query.department = department;
  }

  if (dueDateStart || dueDateEnd) {
    query.dueDate = {};
    if (dueDateStart) {
      query.dueDate.$gte = new Date(dueDateStart);
    }
    if (dueDateEnd) {
      const end = new Date(dueDateEnd);
      end.setHours(23, 59, 59, 999);
      query.dueDate.$lte = end;
    }
  }

  if (search) {
    const matchingUsers = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);

    const matchingClients = await Client.find({
      $or: [
        { companyName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientId: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    const clientIds = matchingClients.map((c) => c._id);

    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { taskId: { $regex: search, $options: 'i' } },
        { taskName: { $regex: search, $options: 'i' } },
        { taskDescription: { $regex: search, $options: 'i' } },
        { assignedEmployee: { $in: userIds } },
        { clientId: { $in: clientIds } },
      ],
    });
  }

  return query;
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin, Manager, TL)
export const createTask = async (req, res) => {
  const {
    taskName,
    financialYear,
    taskDescription,
    clientId,
    assignedTo,
    assignedEmployee,
    assignedTeamLead,
    priority,
    startDate,
    dueDate,
    status,
    estimatedHours,
    internalNotes,
    clientVisible,
    department,
  } = req.body;

  try {
    const activeEmployee = assignedEmployee || assignedTo;

    // Check if client exists
    const clientExists = await Client.findById(clientId);
    if (!clientExists) {
      return res.status(400).json({ success: false, message: 'Invalid Client ID. Client profile not found.' });
    }

    // Check if employee exists
    const employeeExists = await User.findById(activeEmployee);
    if (!employeeExists) {
      return res.status(400).json({ success: false, message: 'Invalid Assigned Employee ID. Employee not found.' });
    }

    if (assignedTeamLead) {
      const tlExists = await User.findById(assignedTeamLead);
      if (!tlExists) {
        return res.status(400).json({ success: false, message: 'Invalid Assigned Team Lead ID. Team Lead not found.' });
      }
    }

    const task = await Task.create({
      taskName,
      financialYear,
      taskDescription,
      clientId,
      assignedBy: req.user._id,
      assignedTeamLead,
      assignedEmployee: activeEmployee,
      priority: priority || 'Medium',
      startDate,
      dueDate,
      estimatedHours: estimatedHours || 0,
      status: status || 'To Do',
      internalNotes,
      clientVisible: clientVisible || 'No',
      createdBy: req.user._id,
      department: department || null,
      activityLogs: [
        {
          user: req.user._id,
          userName: req.user.name,
          action: 'Task Created',
          newValue: taskName,
        },
      ],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedEmployee', 'name email employeeId')
      .populate('assignedTeamLead', 'name email employeeId')
      .populate('clientId', 'companyName clientId')
      .populate('createdBy', 'name')
      .populate('department', 'name');

    // Log Audit Event: Task Created
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role?.name || 'Unknown',
      action: 'Task Created',
      details: `Task "${taskName}" (${populatedTask.taskId}) created.`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // Notify assignee
    if (populatedTask.assignedEmployee) {
      try {
        await sendTaskAssignmentEmail(
          populatedTask.assignedEmployee.email,
          populatedTask.assignedEmployee.name,
          taskName,
          dueDate,
          req.user.name
        );
      } catch (err) {
        console.error('Failed to send task assignment email:', err.message);
      }

      await sendNotification({
        recipient: populatedTask.assignedEmployee._id,
        sender: req.user._id,
        title: 'New Task Assigned',
        message: `You have been assigned task: "${taskName}". Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'Task',
        link: '/tasks',
      });
    }

    emitTaskCreated(populatedTask);

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
  try {
    const query = await getScopedQuery(req);

    const tasks = await Task.find(query)
      .populate('assignedEmployee', 'name email employeeId')
      .populate('assignedTeamLead', 'name email employeeId')
      .populate('clientId', 'companyName clientId')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('department', 'name')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private (All Authenticated users)
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedEmployee', 'name email employeeId')
      .populate('assignedTeamLead', 'name email employeeId')
      .populate('clientId', 'companyName clientId')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('department', 'name');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Scope check:
    const roleDoc = await Role.findById(req.user.role);
    const roleName = roleDoc ? roleDoc.name : 'Employee';

    if (roleName === 'Employee' || roleName === 'Intern') {
      if (task.assignedEmployee?._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
      }
    } else if (roleName === 'Manager') {
      const isCreator = task.createdBy?._id.toString() === req.user._id.toString();
      const isAssignee = task.assignedEmployee?._id.toString() === req.user._id.toString();
      const isLead = task.assignedTeamLead?._id.toString() === req.user._id.toString();
      const isSameDept = task.department?._id.toString() === req.user.department?.toString();
      if (!isCreator && !isAssignee && !isLead && !isSameDept) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
      }
    } else if (roleName === 'Client') {
      const client = await Client.findOne({ user: req.user._id });
      if (!client || task.clientId?._id.toString() !== client._id.toString() || task.clientVisible !== 'Yes') {
        return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
      }
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a task (details, status, or progress)
// @route   PUT /api/tasks/:id
// @access  Private (All Authenticated staff)
export const updateTask = async (req, res) => {
  const {
    taskName,
    financialYear,
    taskDescription,
    clientId,
    assignedTo,
    assignedEmployee,
    assignedTeamLead,
    priority,
    startDate,
    dueDate,
    status,
    completionDate,
    completionRemarks,
    remarks,
    progress,
    attachments,
    internalNotes,
    clientVisible,
    estimatedHours,
    department,
  } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const roleDoc = await Role.findById(req.user.role);
    const roleName = roleDoc ? roleDoc.name : 'Employee';

    // Verify role permissions:
    // Employees can ONLY edit: status, progress, attachments, remarks, completionDate.
    // CA Logins & Department Managers can edit details. Admin has full privileges.
    const isSpecialPrivilege = ['Admin', 'CA Login'].includes(roleName) || 
      (roleName === 'Manager' && (task.assignedTeamLead?.toString() === req.user._id.toString() || task.assignedEmployee?.toString() === req.user._id.toString() || task.createdBy?.toString() === req.user._id.toString() || task.department?.toString() === req.user.department?.toString()));
    const isAssignee = task.assignedEmployee?.toString() === req.user._id.toString();

    if (!isSpecialPrivilege && !isAssignee) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this task' });
    }

    const hasRestrictedEdits =
      taskName !== undefined ||
      financialYear !== undefined ||
      taskDescription !== undefined ||
      clientId !== undefined ||
      assignedEmployee !== undefined ||
      assignedTo !== undefined ||
      assignedTeamLead !== undefined ||
      priority !== undefined ||
      startDate !== undefined ||
      dueDate !== undefined ||
      estimatedHours !== undefined ||
      internalNotes !== undefined ||
      clientVisible !== undefined ||
      department !== undefined;

    if (!isSpecialPrivilege && hasRestrictedEdits) {
      return res.status(403).json({
        success: false,
        message: 'Employees are only authorized to update status, progress, remarks/completionRemarks, comments, and attachments.',
      });
    }

    // Track original states for delta auditing logs
    const initialStatus = task.status;
    const initialPriority = task.priority;
    const initialEmployee = task.assignedEmployee;
    const initialTeamLead = task.assignedTeamLead;
    const initialProgress = task.progress;

    // Validate reference IDs if changed
    if (clientId && clientId !== task.clientId?.toString()) {
      const clientExists = await Client.findById(clientId);
      if (!clientExists) {
        return res.status(400).json({ success: false, message: 'Invalid Client ID. Client not found.' });
      }
    }

    const targetEmployee = assignedEmployee || assignedTo;
    if (targetEmployee && targetEmployee !== task.assignedEmployee?.toString()) {
      const employeeExists = await User.findById(targetEmployee);
      if (!employeeExists) {
        return res.status(400).json({ success: false, message: 'Invalid Assigned Employee. Employee not found.' });
      }
    }

    if (assignedTeamLead && assignedTeamLead !== task.assignedTeamLead?.toString()) {
      const tlExists = await User.findById(assignedTeamLead);
      if (!tlExists) {
        return res.status(400).json({ success: false, message: 'Invalid Assigned Team Lead. TL not found.' });
      }
    }

    // Apply special privilege updates (details)
    if (isSpecialPrivilege) {
      if (taskName !== undefined) task.taskName = taskName;
      if (financialYear !== undefined) task.financialYear = financialYear;
      if (taskDescription !== undefined) task.taskDescription = taskDescription;
      if (clientId !== undefined) task.clientId = clientId;
      if (priority !== undefined) task.priority = priority;
      if (startDate !== undefined) task.startDate = startDate;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (estimatedHours !== undefined) task.estimatedHours = Number(estimatedHours);
      if (internalNotes !== undefined) task.internalNotes = internalNotes;
      if (clientVisible !== undefined) task.clientVisible = clientVisible;
      if (department !== undefined) task.department = department || null;
    }

    // Auditing: assignment changes
    if (targetEmployee !== undefined && targetEmployee !== (initialEmployee || '').toString()) {
      const prevEmp = initialEmployee ? await User.findById(initialEmployee).select('name') : null;
      const nextEmp = targetEmployee ? await User.findById(targetEmployee).select('name') : null;
      task.assignedEmployee = targetEmployee || null;
      task.activityLogs.push({
        user: req.user._id,
        userName: req.user.name,
        action: 'Assignment Changed',
        oldValue: prevEmp?.name || 'Unassigned',
        newValue: nextEmp?.name || 'Unassigned',
      });
    }

    if (assignedTeamLead !== undefined && (assignedTeamLead || '').toString() !== (initialTeamLead || '').toString()) {
      const prevTL = initialTeamLead ? await User.findById(initialTeamLead).select('name') : null;
      const nextTL = assignedTeamLead ? await User.findById(assignedTeamLead).select('name') : null;
      task.assignedTeamLead = assignedTeamLead || null;
      task.activityLogs.push({
        user: req.user._id,
        userName: req.user.name,
        action: 'Team Lead Changed',
        oldValue: prevTL?.name || 'Unassigned',
        newValue: nextTL?.name || 'Unassigned',
      });
    }

    // Common updates (Status, progress, remarks, completionDate, attachments)
    if (status !== undefined && status !== initialStatus) {
      task.status = status;
      if (status === 'Completed') {
        task.completionDate = completionDate || new Date();
        task.progress = 100;
        task.activityLogs.push({
          user: req.user._id,
          userName: req.user.name,
          action: 'Task Completed',
          newValue: completionRemarks || remarks || 'Task finished.',
        });
      } else {
        task.completionDate = undefined;
      }
      task.activityLogs.push({
        user: req.user._id,
        userName: req.user.name,
        action: 'Status Changed',
        oldValue: initialStatus,
        newValue: status,
      });
    } else if (completionDate !== undefined) {
      task.completionDate = completionDate;
    }

    if (completionRemarks !== undefined) {
      task.completionRemarks = completionRemarks;
    } else if (remarks !== undefined) {
      task.completionRemarks = remarks;
    }

    if (progress !== undefined && Number(progress) !== initialProgress) {
      task.progress = Number(progress);
      task.activityLogs.push({
        user: req.user._id,
        userName: req.user.name,
        action: 'Progress Updated',
        oldValue: `${initialProgress}%`,
        newValue: `${progress}%`,
      });
    }

    if (priority !== undefined && priority !== initialPriority) {
      task.activityLogs.push({
        user: req.user._id,
        userName: req.user.name,
        action: 'Priority Changed',
        oldValue: initialPriority,
        newValue: priority,
      });
    }

    if (attachments !== undefined) {
      task.attachments = attachments;
    }

    // Audit Field: updatedBy
    task.updatedBy = req.user._id;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedEmployee', 'name email employeeId')
      .populate('assignedTeamLead', 'name email employeeId')
      .populate('clientId', 'companyName clientId')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('department', 'name');

    // Audit Log DB Record: Status Changed
    if (status !== undefined && status !== initialStatus) {
      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: roleName,
        action: 'Status Changed',
        details: `Task "${updatedTask.taskName}" (${updatedTask.taskId}) status changed from "${initialStatus}" to "${status}".`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });
    }

    // Send assignment updates email/notifications
    const isAssignmentChanged = targetEmployee !== undefined && 
      (targetEmployee || '').toString() !== (initialEmployee || '').toString();
    if (isAssignmentChanged && updatedTask.assignedEmployee) {
      try {
        await sendTaskAssignmentEmail(
          updatedTask.assignedEmployee.email,
          updatedTask.assignedEmployee.name,
          task.taskName,
          task.dueDate,
          req.user.name
        );
      } catch (err) {
        console.error('Failed to send task update email:', err.message);
      }

      await sendNotification({
        recipient: targetEmployee,
        sender: req.user._id,
        title: 'Task Assignment Update',
        message: `You have been assigned task: "${task.taskName}".`,
        type: 'Task',
        link: '/tasks',
      });
    }

    emitTaskUpdated(updatedTask);

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

    const roleDoc = await Role.findById(req.user.role);
    const roleName = roleDoc ? roleDoc.name : 'Employee';
    if (!isManagerOrAdmin(roleName)) {
      return res.status(403).json({ success: false, message: 'Only Managers and Admins are authorized to delete tasks.' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: roleName,
      action: 'Task Deleted',
      details: `Task "${task.taskName}" (${task.taskId}) deleted`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    emitTaskDeleted(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully.',
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

    task.comments.push({
      user: req.user._id,
      comment,
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate('comments.user', 'name email');
    const populatedComment = updatedTask.comments[updatedTask.comments.length - 1];

    // Notify creator & assignee
    const recipients = new Set();
    if (task.createdBy.toString() !== req.user._id.toString()) {
      recipients.add(task.createdBy.toString());
    }
    if (task.assignedEmployee && task.assignedEmployee.toString() !== req.user._id.toString()) {
      recipients.add(task.assignedEmployee.toString());
    }

    for (const recipientId of recipients) {
      await sendNotification({
        recipient: recipientId,
        sender: req.user._id,
        title: 'New Task Comment',
        message: `${req.user.name} commented on "${task.taskName}": "${comment.substring(0, 30)}..."`,
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
    const task = await Task.findById(req.params.id).populate('comments.user', 'name email');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, count: task.comments.length, data: task.comments });
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
      status: { $nin: ['Completed', 'Cancelled'] },
      assignedEmployee: { $ne: null },
      dueDate: { $lte: boundaryDate }
    }).populate('assignedEmployee', 'name email');

    const sentReminders = [];

    for (const task of tasks) {
      if (task.assignedEmployee) {
        try {
          const detailStr = `Your assigned task "${task.taskName}" is due soon (Due Date: ${new Date(task.dueDate).toLocaleDateString()}). Please update your progress on the task board.`;
          await sendReminderEmail(
            task.assignedEmployee.email,
            task.assignedEmployee.name,
            'Upcoming Task Deadline',
            detailStr
          );
          
          await sendNotification({
            recipient: task.assignedEmployee._id,
            sender: req.user._id,
            title: 'Urgent Task Reminder',
            message: `Task "${task.taskName}" is due soon.`,
            type: 'Task',
            link: '/tasks',
          });

          sentReminders.push({
            taskId: task._id,
            taskTitle: task.taskName,
            employeeName: task.assignedEmployee.name,
            employeeEmail: task.assignedEmployee.email,
          });
        } catch (mailErr) {
          console.error(`Failed to send reminder to ${task.assignedEmployee.email}:`, mailErr.message);
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

// @desc    Get Kanban board tasks (grouped by status)
// @route   GET /api/tasks/kanban
// @access  Private (All Authenticated users)
export const getKanbanTasks = async (req, res) => {
  try {
    const query = await getScopedQuery(req);
    const tasks = await Task.find(query)
      .populate('assignedEmployee', 'name email employeeId')
      .populate('assignedTeamLead', 'name email employeeId')
      .populate('clientId', 'companyName clientId')
      .populate('createdBy', 'name')
      .populate('department', 'name')
      .sort({ dueDate: 1 });

    const grouped = {
      'To Do': tasks.filter(t => t.status === 'To Do'),
      'In Progress': tasks.filter(t => t.status === 'In Progress'),
      'Review': tasks.filter(t => t.status === 'Review'),
      'Completed': tasks.filter(t => t.status === 'Completed'),
      'On Hold': tasks.filter(t => t.status === 'On Hold'),
      'Cancelled': tasks.filter(t => t.status === 'Cancelled')
    };

    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tasks by Client ID
// @route   GET /api/tasks/client/:clientId
// @access  Private (All Authenticated users)
export const getTasksByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findOne({ 
      $or: [ 
        { _id: mongoose.Types.ObjectId.isValid(clientId) ? clientId : null }, 
        { clientId } 
      ] 
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const query = { clientId: client._id };

    // Scoping rules: if client is requesting, they only see clientVisible = Yes
    const roleDoc = await Role.findById(req.user.role);
    const roleName = roleDoc ? roleDoc.name : 'Employee';
    if (roleName === 'Client') {
      query.clientVisible = 'Yes';
    }

    const tasks = await Task.find(query)
      .populate('assignedEmployee', 'name email employeeId')
      .populate('assignedTeamLead', 'name email employeeId')
      .populate('clientId', 'companyName clientId')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('department', 'name')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tasks by Employee ID
// @route   GET /api/tasks/employee/:employeeId
// @access  Private (All Authenticated users)
export const getTasksByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findOne({ 
      $or: [ 
        { _id: mongoose.Types.ObjectId.isValid(employeeId) ? employeeId : null }, 
        { employeeId } 
      ] 
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const tasks = await Task.find({ assignedEmployee: employee._id })
      .populate('assignedEmployee', 'name email employeeId')
      .populate('assignedTeamLead', 'name email employeeId')
      .populate('clientId', 'companyName clientId')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('department', 'name')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get statistics cards and charts values for tasks
// @route   GET /api/tasks/stats
// @access  Private (All Authenticated users)
export const getTasksStats = async (req, res) => {
  try {
    const query = await getScopedQuery(req);
    const tasks = await Task.find(query).populate('assignedEmployee', 'name');

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    
    const now = new Date();
    const overdue = tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now).length;
    const pending = tasks.filter(t => ['To Do', 'In Progress', 'Review', 'On Hold'].includes(t.status)).length;

    // Charts data: status distribution
    const statusCounts = {
      'To Do': 0,
      'In Progress': 0,
      'Review': 0,
      'Completed': 0,
      'On Hold': 0,
      'Cancelled': 0
    };
    tasks.forEach(t => {
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
    });

    // Priority distribution
    const priorityCounts = {
      High: 0,
      Medium: 0,
      Low: 0
    };
    tasks.forEach(t => {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
    });

    // Employee distribution
    const employeeCounts = {};
    tasks.forEach(t => {
      const name = t.assignedEmployee?.name || 'Unassigned';
      employeeCounts[name] = (employeeCounts[name] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        overdue,
        statusCounts,
        priorityCounts,
        employeeCounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
