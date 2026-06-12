import DocumentRequest from '../models/DocumentRequest.js';
import ClientDocument from '../models/ClientDocument.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendNotification } from '../utils/notification.js';
import { sendMail } from '../utils/mailer.js';
import AuditLog from '../models/AuditLog.js';

// Helper to generate sequential Request ID
const generateRequestId = async () => {
  const count = await DocumentRequest.countDocuments();
  const serial = String(count + 1).padStart(4, '0');
  const year = new Date().getFullYear();
  return `REQ-${year}-${serial}`;
};

// Templates dictionary
const TEMPLATES = {
  GST: [
    { name: 'Sales Bills', category: 'GST', description: 'Monthly sales/outward invoice excel or summary sheet.' },
    { name: 'Purchase Bills', category: 'GST', description: 'Monthly purchase/inward invoices or summary sheet.' },
    { name: 'E-Way Bills', category: 'GST', description: 'E-way bills summary or transport copies for verification.' },
    { name: 'Bank Statement', category: 'GST', description: 'Bank statement for indirect tax reconciliation.' },
  ],
  'Income Tax': [
    { name: 'Form 16', category: 'Income Tax', description: 'Salary income tax certificate from employer.' },
    { name: 'Aadhaar', category: 'KYC', description: 'Updated Aadhaar card copy.' },
    { name: 'PAN', category: 'KYC', description: 'Permanent Account Number card copy.' },
    { name: 'Bank Statement', category: 'Income Tax', description: 'Financial year bank savings/current statements.' },
    { name: 'Investment Proofs', category: 'Income Tax', description: 'LIC premium, mutual funds, rent receipts, tax saver certificate.' },
  ],
  Audit: [
    { name: 'Trial Balance', category: 'Audit', description: 'Consolidated trial balance sheet for audit period.' },
    { name: 'Ledger', category: 'Audit', description: 'Detailed account ledgers in Excel or Tally format.' },
    { name: 'Bank Statements', category: 'Audit', description: 'All active bank accounts bank statements.' },
    { name: 'Fixed Asset Register', category: 'Audit', description: 'Fixed asset registers showing purchase bills and depreciation rates.' },
  ],
  ROC: [
    { name: 'Director Details', category: 'ROC', description: 'KYC, DIN numbers, and active emails of active directors.' },
    { name: 'Shareholding Details', category: 'ROC', description: 'Equity share distributions and transfer forms.' },
    { name: 'Board Resolutions', category: 'ROC', description: 'Certified copies of board minutes and resolutions.' },
  ],
};

// @desc    Create a single document request
// @route   POST /api/document-requests
// @access  Private (Staff only)
export const createRequest = async (req, res) => {
  const { clientId, documentName, category, description, priority, dueDate } = req.body;

  if (!clientId || !documentName || !category || !dueDate) {
    return res.status(400).json({ success: false, message: 'Client ID, document name, category, and due date are required.' });
  }

  try {
    const client = await Client.findById(clientId).populate('user', 'name email');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const requestId = await generateRequestId();

    const newRequest = await DocumentRequest.create({
      requestId,
      client: clientId,
      requestedBy: req.user._id,
      requestedByRole: req.user.role.name,
      documentName,
      category,
      description,
      priority: priority || 'Medium',
      dueDate: new Date(dueDate),
      status: 'Requested',
    });

    // Notify client (In-App)
    await sendNotification({
      recipient: client.user._id,
      sender: req.user._id,
      title: 'New Document Requested',
      message: `CA Office requested document: "${documentName}" for ${category}. Due: ${new Date(dueDate).toLocaleDateString()}`,
      type: 'Document',
      link: '/client-dashboard',
    });

    // Send immediate email
    await sendMail({
      to: client.user.email,
      subject: `[ACTION REQUIRED] Document Requested: ${documentName}`,
      html: `
        <h3>Dear ${client.user.name},</h3>
        <p>A new document has been requested from you by <strong>${req.user.name}</strong> (${req.user.role.name}) in the CA Office Client Portal.</p>
        <table border="1" cellpadding="6" style="border-collapse: collapse;">
          <tr><td><strong>Request ID</strong></td><td>${requestId}</td></tr>
          <tr><td><strong>Document Name</strong></td><td>${documentName}</td></tr>
          <tr><td><strong>Category</strong></td><td>${category}</td></tr>
          <tr><td><strong>Description</strong></td><td>${description || 'None'}</td></tr>
          <tr><td><strong>Priority</strong></td><td>${priority || 'Medium'}</td></tr>
          <tr><td><strong>Due Date</strong></td><td>${new Date(dueDate).toLocaleDateString()}</td></tr>
        </table>
        <p>Please log in to the Client Portal to upload the requested file.</p>
        <p>Best regards,<br/>CA Office ERP Team</p>
      `,
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Document Request Created',
      details: `Created request ${requestId} ("${documentName}") for client: ${client.companyName}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create requests using a template (GST, Income Tax, Audit, ROC)
// @route   POST /api/document-requests/template
// @access  Private (Staff only)
export const createRequestFromTemplate = async (req, res) => {
  const { clientId, templateName, dueDate } = req.body;

  if (!clientId || !templateName || !dueDate) {
    return res.status(400).json({ success: false, message: 'Client ID, template name, and due date are required.' });
  }

  const files = TEMPLATES[templateName];
  if (!files) {
    return res.status(400).json({ success: false, message: `Invalid template name. Choose from: ${Object.keys(TEMPLATES).join(', ')}` });
  }

  try {
    const client = await Client.findById(clientId).populate('user', 'name email');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const createdRequests = [];

    for (const file of files) {
      const requestId = await generateRequestId();
      const newRequest = await DocumentRequest.create({
        requestId,
        client: clientId,
        requestedBy: req.user._id,
        requestedByRole: req.user.role.name,
        documentName: file.name,
        category: file.category,
        description: file.description,
        priority: 'High',
        dueDate: new Date(dueDate),
        status: 'Requested',
      });
      createdRequests.push(newRequest);

      // Notify client (In-App)
      await sendNotification({
        recipient: client.user._id,
        sender: req.user._id,
        title: 'New Document Requested (Template)',
        message: `CA Office requested document: "${file.name}" for ${file.category}. Due: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'Document',
        link: '/client-dashboard',
      });
    }

    // Send summary email to client
    const tableRows = createdRequests
      .map(r => `<tr><td>${r.requestId}</td><td>${r.documentName}</td><td>${r.category}</td></tr>`)
      .join('');

    await sendMail({
      to: client.user.email,
      subject: `[ACTION REQUIRED] Multiple Documents Requested - ${templateName}`,
      html: `
        <h3>Dear ${client.user.name},</h3>
        <p>The CA Office team has generated a set of document requests for <strong>${templateName}</strong> compliance filing.</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        <table border="1" cellpadding="6" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;"><th>Request ID</th><th>Document Name</th><th>Category</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p>Please log in to the Client Portal to upload these files as soon as possible.</p>
        <p>Best regards,<br/>CA Office ERP Team</p>
      `,
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Document Request Template Applied',
      details: `Applied template ${templateName} for client: ${client.companyName} generating ${createdRequests.length} requests`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ success: true, count: createdRequests.length, data: createdRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all document requests
// @route   GET /api/document-requests
// @access  Private (All roles)
export const getRequests = async (req, res) => {
  const { clientId, status, priority, category } = req.query;

  try {
    let query = {};

    // Roll-based restriction
    if (req.user.role.name === 'Client') {
      const clientProfile = await Client.findOne({ user: req.user._id });
      if (!clientProfile) {
        return res.status(404).json({ success: false, message: 'Client profile not found' });
      }
      query.client = clientProfile._id;
    } else {
      // Internal staff filters
      if (clientId) {
        query.client = clientId;
      }
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const requests = await DocumentRequest.find(query)
      .populate('requestedBy', 'name role')
      .populate({
        path: 'client',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('uploadedDocument')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload document response for a request
// @route   PUT /api/document-requests/:id/upload
// @access  Private (Client or Staff on behalf)
export const uploadRequestDocument = async (req, res) => {
  const { fileUrl, fileName } = req.body;

  if (!fileUrl || !fileName) {
    return res.status(400).json({ success: false, message: 'File URL and name are required.' });
  }

  try {
    const request = await DocumentRequest.findById(req.params.id)
      .populate('requestedBy')
      .populate({
        path: 'client',
        populate: { path: 'user', select: 'name email' }
      });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Document request not found' });
    }

    // Check if client document already exists for this request (for versioning)
    let clientDoc;
    if (request.uploadedDocument) {
      clientDoc = await ClientDocument.findById(request.uploadedDocument);
    }

    if (clientDoc) {
      // Append version
      const nextVerNum = clientDoc.versions.length + 1;
      clientDoc.versions.push({
        versionNumber: nextVerNum,
        fileUrl: clientDoc.fileUrl,
        uploadedBy: clientDoc.uploadedBy,
        createdAt: clientDoc.updatedAt,
      });

      clientDoc.fileUrl = fileUrl;
      clientDoc.name = fileName;
      clientDoc.uploadedBy = req.user._id;
      clientDoc.status = 'Uploaded';
      await clientDoc.save();
    } else {
      // Create new client document
      clientDoc = await ClientDocument.create({
        client: request.client._id,
        name: fileName,
        documentType: request.category,
        fileUrl,
        uploadedBy: req.user._id,
        status: 'Uploaded',
      });
    }

    request.uploadedDocument = clientDoc._id;
    request.status = 'Uploaded';
    await request.save();

    // Notify requester (Staff)
    await sendNotification({
      recipient: request.requestedBy._id,
      sender: req.user._id,
      title: 'Document Uploaded by Client',
      message: `${request.client.companyName} uploaded file for request: "${request.documentName}".`,
      type: 'Document',
      link: '/document-requests', // reviews center
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Document Request Responded',
      details: `Uploaded document for request ${request.requestId} ("${request.documentName}")`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ success: true, message: 'Document uploaded successfully.', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review request response (Approve, Reject, Request Re-upload)
// @route   PUT /api/document-requests/:id/review
// @access  Private (Staff only)
export const reviewRequest = async (req, res) => {
  const { action, comments } = req.body; // action: 'Approve', 'Reject', 'Request Re-upload'

  if (!action) {
    return res.status(400).json({ success: false, message: 'Please specify the review action.' });
  }

  const statusMap = {
    Approve: 'Approved',
    Reject: 'Rejected',
    'Request Re-upload': 'Re-upload Required',
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return res.status(400).json({ success: false, message: 'Invalid review action.' });
  }

  try {
    const request = await DocumentRequest.findById(req.params.id)
      .populate('uploadedDocument')
      .populate({
        path: 'client',
        populate: { path: 'user', select: 'name email' }
      });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Document request not found' });
    }

    // Update request details
    request.status = newStatus;
    request.approvalHistory.push({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role.name,
      date: new Date(),
      actionTaken: action,
      comments: comments || '',
    });
    await request.save();

    // Update the associated ClientDocument status
    if (request.uploadedDocument) {
      const doc = await ClientDocument.findById(request.uploadedDocument._id);
      if (doc) {
        doc.status = newStatus;
        doc.remarks = comments || '';
        await doc.save();
      }
    }

    // Notify client (In-App)
    await sendNotification({
      recipient: request.client.user._id,
      sender: req.user._id,
      title: `Document Request: ${newStatus}`,
      message: `Your document for "${request.documentName}" was marked: ${newStatus}. Remarks: ${comments || 'None'}`,
      type: 'Document',
      link: '/client-dashboard',
    });

    // Send email to client
    await sendMail({
      to: request.client.user.email,
      subject: `[UPDATE] Document Review Status: ${newStatus}`,
      html: `
        <h3>Dear ${request.client.user.name},</h3>
        <p>Your document upload for <strong>"${request.documentName}"</strong> (${request.requestId}) has been reviewed by <strong>${req.user.name}</strong>.</p>
        <p><strong>Status:</strong> ${newStatus}</p>
        <p><strong>Comments/Remarks:</strong> ${comments || 'None'}</p>
        ${action === 'Request Re-upload' ? '<p>Please log in to the Client Portal and upload the correct file.</p>' : ''}
        <p>Best regards,<br/>CA Office ERP Team</p>
      `,
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Document Request Reviewed',
      details: `Reviewed request ${request.requestId} ("${request.documentName}") set to status ${newStatus}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ success: true, message: `Document request updated to ${newStatus}.`, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Run automated reminders check and escalation logic
// @route   POST /api/document-requests/run-reminders
// @access  Private (Staff only / Cron simulated)
export const runRemindersCheck = async (req, res) => {
  try {
    const today = new Date();
    
    // Find all requests that are NOT Approved/Uploaded/Rejected/Escalated
    const pendingRequests = await DocumentRequest.find({
      status: { $in: ['Requested', 'Re-upload Required', 'Overdue'] }
    }).populate({
      path: 'client',
      populate: { path: 'user', select: 'name email' }
    }).populate('requestedBy');

    let reminderCountTotal = 0;
    let escalationCountTotal = 0;

    for (const request of pendingRequests) {
      const clientUser = request.client?.user;
      if (!clientUser) continue;

      const dueDate = new Date(request.dueDate);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // days remaining (negative if overdue)
      
      let shouldRemind = false;
      let reason = '';

      // Overdue check
      if (daysDiff < 0 && request.status !== 'Overdue') {
        request.status = 'Overdue';
        await request.save();
      }

      // Check reminder criteria
      // 1. Immediately after request is handled by creation flow.
      // 2. 3 days before due date
      // 3. 1 day before due date
      // 4. Due date
      // 5. Every 2 days after overdue

      if (daysDiff === 3) {
        shouldRemind = true;
        reason = '3 days before due date';
      } else if (daysDiff === 1) {
        shouldRemind = true;
        reason = '1 day before due date';
      } else if (daysDiff === 0) {
        shouldRemind = true;
        reason = 'Due date is today';
      } else if (daysDiff < 0 && Math.abs(daysDiff) % 2 === 0) {
        shouldRemind = true;
        reason = `Overdue by ${Math.abs(daysDiff)} days`;
      }

      // To simulate reminders, we allow executing via API triggering manually, so we check if lastReminderSent was today to avoid spamming
      const lastSent = request.lastReminderSent ? new Date(request.lastReminderSent) : null;
      const alreadySentToday = lastSent && lastSent.toDateString() === today.toDateString();

      // For automated trigger via API, we bypass alreadySentToday if req.body.force is true
      if (shouldRemind && (!alreadySentToday || req.body.force)) {
        request.reminderCount += 1;
        request.lastReminderSent = today;
        
        // Next reminder due date
        const nextDue = new Date(today);
        if (daysDiff > 0) {
          nextDue.setDate(today.getDate() + 1);
        } else {
          nextDue.setDate(today.getDate() + 2);
        }
        request.nextReminderDue = nextDue;

        // Check Escalation (if reminderCount reaches 3 and still pending)
        if (request.reminderCount >= 3) {
          request.status = 'Escalated';
          escalationCountTotal += 1;

          // Notify staff: Creator, TLs, Managers, Admins
          const staffToNotify = await User.find({
            role: { $in: await getStaffReviewerRoles() }
          });

          for (const staff of staffToNotify) {
            await sendNotification({
              recipient: staff._id,
              sender: clientUser._id,
              title: 'ALERT: Document Request Escalated',
              message: `Client ${request.client.companyName} failed to upload document "${request.documentName}" after 3 reminders.`,
              type: 'Document',
              link: '/document-requests', // dashboard portal review
            });
          }

          // Email notification to client warning of escalation
          await sendMail({
            to: clientUser.email,
            subject: `[CRITICAL WARNING] Request Escalated: ${request.documentName}`,
            html: `
              <h3>Dear ${clientUser.name},</h3>
              <p>Your document request for <strong>"${request.documentName}"</strong> (${request.requestId}) has been <strong>ESCALATED</strong> to the CA senior management team due to non-response after 3 reminders.</p>
              <p>Please log in to the Client Portal immediately and upload the requested file to avoid penalties or compliance delays.</p>
              <p>Best regards,<br/>CA Office ERP Team</p>
            `,
          });
        } else {
          reminderCountTotal += 1;

          // Normal reminder
          await sendNotification({
            recipient: clientUser._id,
            title: 'Reminder: Pending Document Request',
            message: `Reminder #${request.reminderCount} for: "${request.documentName}". Due: ${dueDate.toLocaleDateString()}`,
            type: 'Document',
            link: '/client-dashboard',
          });

          await sendMail({
            to: clientUser.email,
            subject: `[REMINDER #${request.reminderCount}] Pending Document: ${request.documentName}`,
            html: `
              <h3>Dear ${clientUser.name},</h3>
              <p>This is reminder #${request.reminderCount} to upload the requested document: <strong>"${request.documentName}"</strong> (${request.requestId}).</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
              <p>Please submit this file in the Client Portal as soon as possible.</p>
              <p>Best regards,<br/>CA Office ERP Team</p>
            `,
          });
        }

        await request.save();
      }
    }

    res.json({
      success: true,
      message: 'Automated reminders process executed successfully.',
      data: {
        totalScanned: pendingRequests.length,
        remindersSent: reminderCountTotal,
        escalationsTriggered: escalationCountTotal,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Resolve Admin, Manager, and TL roles for notification broadcasts
const getStaffReviewerRoles = async () => {
  const roles = await Role.find({ name: { $in: ['Admin', 'CA Login', 'Manager'] } });
  return roles.map(r => r._id);
};
