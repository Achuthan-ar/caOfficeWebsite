import Job from '../models/Job.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Internship from '../models/Internship.js';
import Department from '../models/Department.js';
import {
  sendApplicationReceivedEmail,
  sendApplicationStatusUpdateEmail,
  sendInternCredentialsEmail,
} from '../services/emailService.js';
import { sendNotification } from '../utils/notification.js';

// @desc    Get all active job/internship listings
// @route   GET /api/careers/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isOpen: true })
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a job opening listing
// @route   POST /api/careers/jobs
// @access  Private (Admin, Manager)
export const createJob = async (req, res) => {
  const { title, description, type, department, requirements, skills, location, salaryRange } = req.body;

  if (!title || !description || !type) {
    return res.status(400).json({ success: false, message: 'Title, description, and type are required' });
  }

  try {
    const job = await Job.create({
      title,
      description,
      type,
      department: department || null,
      requirements: requirements || [],
      skills: skills || [],
      location: location || 'Mumbai',
      salaryRange: salaryRange || '',
    });

    res.status(201).json({ success: true, message: 'Job posting published successfully.', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply online for a job/internship
// @route   POST /api/careers/apply
// @access  Public
export const submitApplication = async (req, res) => {
  const { jobId, name, email, phone, resume, coverLetter, collegeName, skills, experience } = req.body;

  if (!jobId || !name || !email || !phone || !resume) {
    return res.status(400).json({ success: false, message: 'Job ID, name, email, phone, and resume link are required' });
  }

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job position not found' });
    }

    const application = await Application.create({
      job: jobId,
      name,
      email,
      phone,
      resume,
      coverLetter: coverLetter || '',
      collegeName: collegeName || '',
      skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      experience: experience || '',
      status: 'Applied',
    });

    // Email Candidate
    await sendApplicationReceivedEmail(email, name, job.title);

    // Notify Managers/Admins in-app
    const reviewers = await User.find({ role: { $in: await getHRReviewerRoleIds() } });
    for (const reviewer of reviewers) {
      await sendNotification({
        recipient: reviewer._id,
        title: 'New Candidate Application',
        message: `${name} applied for "${job.title}".`,
        type: 'System',
        link: '/applications',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully. A confirmation email has been sent.',
      data: application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all applications
// @route   GET /api/careers/applications
// @access  Private (Admin, Manager)
export const getApplications = async (req, res) => {
  const { status } = req.query;

  try {
    const query = {};
    if (status) {
      query.status = status;
    }

    const apps = await Application.find(query)
      .populate('job', 'title type salaryRange')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: apps.length, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update candidate application status
// @route   PUT /api/careers/applications/:id/status
// @access  Private (Admin, Manager)
export const updateApplicationStatus = async (req, res) => {
  const { status, remarks, interviewDate, mentorId, departmentId } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Please provide status' });
  }

  try {
    const app = await Application.findById(req.params.id).populate('job', 'title type department');
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (app.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'This application is already approved and converted.' });
    }

    app.status = status;
    if (remarks !== undefined) app.remarks = remarks;
    if (interviewDate !== undefined) app.interviewDate = interviewDate;
    await app.save();

    // Trigger transaction emails
    if (['Shortlisted', 'Interview Scheduled', 'Rejected'].includes(status)) {
      const emailNote = status === 'Interview Scheduled' 
        ? `Interview scheduled for: ${new Date(interviewDate).toLocaleString()}. ${remarks || ''}`
        : remarks;
      await sendApplicationStatusUpdateEmail(app.email, app.name, app.job.title, status, emailNote);
    }

    let credentials = null;

    // Convert Candidate to Intern Account on Approval
    if (status === 'Approved') {
      if (!mentorId) {
        return res.status(400).json({ success: false, message: 'Please select a Mentor to approve this internship.' });
      }

      // Check if user account already exists
      let user = await User.findOne({ email: app.email });
      const tempPassword = Math.random().toString(36).substring(2, 10); // Generate random password

      if (!user) {
        // Find Intern Role ID
        const internRole = await Role.findOne({ name: 'Intern' });
        if (!internRole) {
          return res.status(500).json({ success: false, message: 'Intern role not configured in system.' });
        }

        // Generate Intern Employee ID
        const count = await User.countDocuments({ employeeId: { $exists: true } });
        const newEmpId = `INT${String(count + 1).padStart(3, '0')}`;

        user = await User.create({
          name: app.name,
          email: app.email,
          password: tempPassword, // Will encrypt on save pre-hook
          role: internRole._id,
          employeeId: newEmpId,
          phone: app.phone,
          department: departmentId || app.job.department || null,
          joiningDate: new Date(),
          leaveBalance: 10,
        });

        credentials = {
          email: app.email,
          password: tempPassword,
        };

        // Send Welcome Login email
        await sendInternCredentialsEmail(app.email, app.name, tempPassword);
      }

      // Create active Internship document
      const mentorUser = await User.findById(mentorId);
      const mentorDept = mentorUser ? mentorUser.department : null;

      const internship = await Internship.create({
        user: user._id,
        mentor: mentorId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months duration
        department: departmentId || mentorDept || app.job.department,
        status: 'Active',
      });

      // Send in-app notification to the mentor
      await sendNotification({
        recipient: mentorId,
        title: 'New Mentee Assigned',
        message: `You have been assigned to mentor Intern: "${app.name}".`,
        type: 'System',
        link: '/mentor-workspace',
      });
    }

    res.json({
      success: true,
      message: `Candidate application set to: ${status}.`,
      data: app,
      credentials,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Resolve roles for Admins and Managers
const getHRReviewerRoleIds = async () => {
  const roles = await Role.find({ name: { $in: ['Admin', 'Manager'] } });
  return roles.map(r => r._id);
};
