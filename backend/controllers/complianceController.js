import Compliance from '../models/Compliance.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all statutory compliance deadlines
// @route   GET /api/compliance
// @access  Private (All roles)
export const getComplianceDates = async (req, res) => {
  try {
    const deadlines = await Compliance.find({}).sort({ dueDate: 1 });
    res.json({ success: true, count: deadlines.length, data: deadlines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a new compliance deadline
// @route   POST /api/compliance
// @access  Private (Admin & Manager only)
export const createComplianceDeadline = async (req, res) => {
  const { title, category, dueDate, description, colorCode } = req.body;

  if (!title || !category || !dueDate) {
    return res.status(400).json({ success: false, message: 'Title, category, and due date are required.' });
  }

  try {
    const deadline = await Compliance.create({
      title,
      category,
      dueDate: new Date(dueDate),
      description: description || '',
      colorCode: colorCode || '#6366f1',
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Compliance Deadline Created',
      details: `Created deadline: "${title}" for ${category} due ${dueDate}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ success: true, data: deadline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
