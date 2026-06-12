import Internship from '../models/Internship.js';
import InternshipReport from '../models/InternshipReport.js';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notification.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get active internship for logged-in Intern
// @route   GET /api/internships/dashboard
// @access  Private (Intern)
export const getInternDashboard = async (req, res) => {
  try {
    const internship = await Internship.findOne({ user: req.user._id })
      .populate('mentor', 'name email phone')
      .populate('department', 'name')
      .populate('user', 'name email employeeId phone');

    if (!internship) {
      return res.status(404).json({ success: false, message: 'No active internship found for this user.' });
    }

    const reports = await InternshipReport.find({ internship: internship._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        internship,
        reports,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active mentees (interns) for a Mentor
// @route   GET /api/internships/mentees
// @access  Private (TL, Employee, Admin, Manager)
export const getMentorMentees = async (req, res) => {
  try {
    const query = {};
    
    // Non-Admin/Manager users can only view their assigned mentees
    if (!['Admin', 'CA Login'].includes(req.user.role.name)) {
      query.mentor = req.user._id;
    }

    const internships = await Internship.find(query)
      .populate('user', 'name email employeeId phone')
      .populate('department', 'name')
      .populate('mentor', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: internships.length,
      data: internships,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single internship details
// @route   GET /api/internships/:id
// @access  Private
export const getInternshipDetails = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('user', 'name email employeeId phone')
      .populate('mentor', 'name email phone')
      .populate('department', 'name');

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship details not found.' });
    }

    // Authorization check: Intern, Mentor, Manager, or Admin
    const isIntern = internship.user._id.toString() === req.user._id.toString();
    const isMentor = internship.mentor._id.toString() === req.user._id.toString();
    const isPrivileged = ['Admin', 'CA Login'].includes(req.user.role.name);

    if (!isIntern && !isMentor && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these internship details' });
    }

    const reports = await InternshipReport.find({ internship: internship._id }).sort({ createdAt: -1 });
    const certificate = await Certificate.findOne({ internship: internship._id });

    res.json({
      success: true,
      data: {
        internship,
        reports,
        certificate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit weekly or final internship report
// @route   POST /api/internships/reports
// @access  Private (Intern)
export const submitReport = async (req, res) => {
  const { internshipId, reportType, weekNumber, title, content, fileUrl } = req.body;

  if (!internshipId || !reportType || !title || !content) {
    return res.status(400).json({ success: false, message: 'Please provide internshipId, reportType, title, and content.' });
  }

  try {
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // Verify ownership
    if (internship.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only submit reports for your own internship.' });
    }

    const report = await InternshipReport.create({
      internship: internshipId,
      reportType,
      weekNumber: reportType === 'Weekly' ? weekNumber : undefined,
      title,
      content,
      fileUrl,
    });

    // Notify Mentor
    await sendNotification({
      recipient: internship.mentor,
      title: 'New Internship Report Submitted',
      message: `${req.user.name} submitted a ${reportType} report: "${title}".`,
      type: 'System',
      link: `/mentor-workspace`,
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Intern Report Submitted',
      details: `Intern ${req.user.name} submitted a ${reportType} report: "${title}"`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review and rate a submitted report
// @route   PUT /api/internships/reports/:reportId/review
// @access  Private (TL, Employee, Admin, Manager)
export const reviewReport = async (req, res) => {
  const { feedback, rating } = req.body;

  if (!feedback || !rating) {
    return res.status(400).json({ success: false, message: 'Please provide feedback and a rating (1-5).' });
  }

  try {
    const report = await InternshipReport.findById(req.params.reportId).populate('internship');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify relationship
    const internship = report.internship;
    const isMentor = internship.mentor.toString() === req.user._id.toString();
    const isPrivileged = ['Admin', 'CA Login'].includes(req.user.role.name);

    if (!isMentor && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Only the assigned mentor or HR can review this report.' });
    }

    report.feedback = feedback;
    report.rating = rating;
    await report.save();

    // Notify Intern
    await sendNotification({
      recipient: internship.user,
      title: 'Internship Report Graded',
      message: `Your ${report.reportType} report has been graded with rating ${rating}/5.`,
      type: 'System',
      link: '/intern-portal',
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Intern Report Reviewed',
      details: `Report for internship ID ${internship._id} reviewed and rated ${rating}/5`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Report reviewed and graded successfully.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign training task to intern
// @route   POST /api/internships/:id/tasks
// @access  Private (TL, Employee, Admin, Manager)
export const assignTask = async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Task title is required.' });
  }

  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // Verify ownership
    const isMentor = internship.mentor.toString() === req.user._id.toString();
    const isPrivileged = ['Admin', 'CA Login'].includes(req.user.role.name);

    if (!isMentor && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Only the assigned mentor or HR can assign learning tasks.' });
    }

    internship.tasks.push({
      title,
      description,
      status: 'Pending',
      assignedDate: new Date(),
    });

    // Recalculate progress
    const total = internship.tasks.length;
    const completed = internship.tasks.filter((t) => t.status === 'Completed').length;
    internship.progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await internship.save();

    // Notify Intern
    await sendNotification({
      recipient: internship.user,
      title: 'New Learning Task Assigned',
      message: `Your mentor assigned a new task: "${title}".`,
      type: 'System',
      link: '/intern-portal',
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Mentor Task Assigned',
      details: `Assigned learning task "${title}" to intern user associated with internship ID ${internship._id}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully.',
      data: internship,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status (toggled by Intern)
// @route   PUT /api/internships/:id/tasks/:taskId
// @access  Private (Intern, Mentor, Admin, Manager)
export const updateTaskStatus = async (req, res) => {
  const { status } = req.body; // 'Pending' or 'Completed'

  if (!status || !['Pending', 'Completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid status: Pending or Completed.' });
  }

  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // Auth check
    const isIntern = internship.user.toString() === req.user._id.toString();
    const isMentor = internship.mentor.toString() === req.user._id.toString();
    const isPrivileged = ['Admin', 'CA Login'].includes(req.user.role.name);

    if (!isIntern && !isMentor && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this task.' });
    }

    const task = internship.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found in internship' });
    }

    task.status = status;
    if (status === 'Completed') {
      task.completedDate = new Date();
    } else {
      task.completedDate = undefined;
    }

    // Recalculate progress
    const total = internship.tasks.length;
    const completed = internship.tasks.filter((t) => t.status === 'Completed').length;
    internship.progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await internship.save();

    // If intern completed a task, notify mentor
    if (isIntern && status === 'Completed') {
      await sendNotification({
        recipient: internship.mentor,
        title: 'Task Completed by Intern',
        message: `${req.user.name} completed the task: "${task.title}".`,
        type: 'System',
        link: '/mentor-workspace',
      });
    }

    res.json({
      success: true,
      message: 'Task status updated.',
      data: internship,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate completion certificate for active intern
// @route   POST /api/internships/:id/certificate
// @access  Private (Admin, Manager, TL, Employee)
export const generateCertificate = async (req, res) => {
  const { duration, officeName, signature, completionStatus } = req.body;

  if (!duration) {
    return res.status(400).json({ success: false, message: 'Please provide certificate duration details.' });
  }

  try {
    const internship = await Internship.findById(req.params.id).populate('user', 'name');
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // Auth check
    const isMentor = internship.mentor.toString() === req.user._id.toString();
    const isPrivileged = ['Admin', 'CA Login'].includes(req.user.role.name);

    if (!isMentor && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Only the assigned mentor or HR can generate certificates.' });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ internship: internship._id });
    if (certificate) {
      return res.status(400).json({ success: false, message: 'A certificate has already been generated for this internship.', data: certificate });
    }

    certificate = await Certificate.create({
      internship: internship._id,
      internName: internship.user.name,
      duration,
      officeName: officeName || 'CA Office ERP & Advisory',
      signature: signature || 'Senior Managing CA Partner',
      completionStatus: completionStatus || 'Successful',
    });

    // Mark internship completed and set progress to 100%
    internship.status = 'Completed';
    internship.progress = 100;
    await internship.save();

    // Notify Intern
    await sendNotification({
      recipient: internship.user,
      title: 'Internship Certificate Generated',
      message: `Congratulations! Your internship certificate has been issued. Click here to view.`,
      type: 'System',
      link: `/certificate/${certificate._id}`,
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Intern Certificate Generated',
      details: `Certificate generated for intern: ${internship.user.name} (Internship ID: ${internship._id})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Internship certificate generated successfully.',
      data: certificate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get certificate by ID
// @route   GET /api/internships/certificates/:id
// @access  Private
export const getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate({
        path: 'internship',
        populate: [
          { path: 'user', select: 'name email employeeId' },
          { path: 'mentor', select: 'name email' },
          { path: 'department', select: 'name' }
        ]
      });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Check permission (Intern of this certificate, Mentor, Manager, or Admin)
    const internship = certificate.internship;
    const isIntern = internship.user._id.toString() === req.user._id.toString();
    const isMentor = internship.mentor._id.toString() === req.user._id.toString();
    const isPrivileged = ['Admin', 'CA Login'].includes(req.user.role.name);

    if (!isIntern && !isMentor && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this certificate' });
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
