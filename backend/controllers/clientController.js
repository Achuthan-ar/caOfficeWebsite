import Client from '../models/Client.js';
import ClientDocument from '../models/ClientDocument.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendNotification } from '../utils/notification.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get active client dashboard details
// @route   GET /api/clients/dashboard
// @access  Private (Client only)
export const getClientDashboard = async (req, res) => {
  try {
    const client = await Client.findOne({ user: req.user._id }).populate('user', 'name email phone');

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found. Please contact administration.' });
    }

    const documents = await ClientDocument.find({ client: client._id })
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        client,
        documents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload document for client profile
// @route   POST /api/clients/documents
// @access  Private (Client, Employee, TL, Manager, Admin)
export const uploadDocument = async (req, res) => {
  const { name, documentType, fileUrl, clientId } = req.body;

  if (!name || !documentType || !fileUrl) {
    return res.status(400).json({ success: false, message: 'Please provide document name, type, and URL link.' });
  }

  try {
    let resolvedClientId = clientId;

    // If client is uploading, find their client profile
    if (req.user.role.name === 'Client') {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client profile not found.' });
      }
      resolvedClientId = client._id;
    } else {
      // Staff uploading requires a target client ID
      if (!clientId) {
        return res.status(400).json({ success: false, message: 'Please specify the target client profile ID.' });
      }
    }

    const clientProfile = await Client.findById(resolvedClientId).populate('user', 'name');
    if (!clientProfile) {
      return res.status(404).json({ success: false, message: 'Target client profile not found.' });
    }

    const document = await ClientDocument.create({
      client: resolvedClientId,
      name,
      documentType,
      fileUrl,
      uploadedBy: req.user._id,
      status: req.user.role.name === 'Client' ? 'Uploaded' : 'Approved',
    });

    // Notify receiving side
    if (req.user.role.name === 'Client') {
      // Notify managers
      const managers = await User.find({ role: { $in: await getReviewerRoles() } });
      for (const mgr of managers) {
        await sendNotification({
          recipient: mgr._id,
          title: 'New Document Uploaded by Client',
          message: `${req.user.name} uploaded a file: "${name}" (${documentType}).`,
          type: 'System',
          link: `/applications`, // Redirect to applications/client portal review
        });
      }
    } else {
      // Notify Client
      await sendNotification({
        recipient: clientProfile.user._id,
        title: 'New Document Available',
        message: `CA Office uploaded a document: "${name}" (${documentType}).`,
        type: 'System',
        link: '/client-dashboard',
      });
    }

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Client Document Uploaded',
      details: `Document "${name}" uploaded for client: ${clientProfile.companyName}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: document,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get client documents
// @route   GET /api/clients/documents
// @access  Private (Client, Employee, TL, Manager, Admin)
export const getClientDocuments = async (req, res) => {
  const { clientId } = req.query;

  try {
    let query = {};

    if (req.user.role.name === 'Client') {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client profile not found.' });
      }
      query.client = client._id;
    } else if (clientId) {
      query.client = clientId;
    }

    const documents = await ClientDocument.find(query)
      .populate('uploadedBy', 'name role')
      .populate({
        path: 'client',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review client document (Approve / Request changes)
// @route   PUT /api/clients/documents/:id/review
// @access  Private (Employee, TL, Manager, Admin)
export const reviewDocument = async (req, res) => {
  const { status, remarks } = req.body; // 'Reviewed', 'Action Needed', 'Approved'

  if (!status) {
    return res.status(400).json({ success: false, message: 'Please provide review status.' });
  }

  try {
    const document = await ClientDocument.findById(req.params.id)
      .populate({
        path: 'client',
        populate: { path: 'user', select: 'name' }
      });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    document.status = status;
    if (remarks !== undefined) document.remarks = remarks;
    await document.save();

    // Notify Client
    const clientUser = document.client.user;
    await sendNotification({
      recipient: clientUser._id,
      title: `Document Review Status: ${status}`,
      message: `Your document "${document.name}" was marked: ${status}. Remarks: ${remarks || 'None'}`,
      type: 'System',
      link: '/client-dashboard',
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Client Document Reviewed',
      details: `Document "${document.name}" for client: ${document.client.companyName} set to status: ${status}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Document status updated to: ${status}.`,
      data: document,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client filing trackers, pending works or log completed filings
// @route   PUT /api/clients/:id/filing
// @access  Private (Employee, TL, Manager, Admin)
export const updateFilingStatus = async (req, res) => {
  const { gstStatus, itrStatus, auditStatus, pendingWorks, newCompletedFiling } = req.body;

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found.' });
    }

    // Update filing statuses
    if (gstStatus) client.filingStatus.gstStatus = gstStatus;
    if (itrStatus) client.filingStatus.itrStatus = itrStatus;
    if (auditStatus) client.filingStatus.auditStatus = auditStatus;

    // Update pending works list
    if (pendingWorks !== undefined) {
      client.pendingWorks = Array.isArray(pendingWorks) 
        ? pendingWorks 
        : pendingWorks.split(',').map(w => w.trim()).filter(Boolean);
    }

    // Append a completed filing log
    if (newCompletedFiling && newCompletedFiling.filingType && newCompletedFiling.period) {
      client.completedFilings.push({
        filingType: newCompletedFiling.filingType,
        period: newCompletedFiling.period,
        filedDate: newCompletedFiling.filedDate || new Date(),
        acknowledgmentNumber: newCompletedFiling.acknowledgmentNumber || '',
      });

      // Send alert notification to client
      await sendNotification({
        recipient: client.user,
        title: 'Filing Completed & Logged',
        message: `Your filing for "${newCompletedFiling.filingType}" (${newCompletedFiling.period}) has been successfully filed.`,
        type: 'System',
        link: '/client-dashboard',
      });
    }

    await client.save();

    // Trigger update alert notification to client
    await sendNotification({
      recipient: client.user,
      title: 'Filing Profile Updated',
      message: 'CA Office has updated your active tax filing tracker profiles.',
      type: 'System',
      link: '/client-dashboard',
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Client Filing Updated',
      details: `Filing tracker updated for client: ${client.companyName}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Client filing statuses updated successfully.',
      data: client,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all client profiles list
// @route   GET /api/clients
// @access  Private (Employee, TL, Manager, Admin)
export const getClients = async (req, res) => {
  const { search } = req.query;

  try {
    let query = {};

    if (search) {
      query.companyName = { $regex: search, $options: 'i' };
    }

    const clients = await Client.find(query)
      .populate('user', 'name email phone')
      .sort({ companyName: 1 });

    res.json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Resolve Manager/Admin role IDs
const getReviewerRoles = async () => {
  const roles = await Role.find({ name: { $in: ['Admin', 'Manager'] } });
  return roles.map(r => r._id);
};
