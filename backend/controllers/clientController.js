import Client from '../models/Client.js';
import ClientDocument from '../models/ClientDocument.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { sendNotification } from '../utils/notification.js';
import AuditLog from '../models/AuditLog.js';
import Task from '../models/Task.js';
import DocumentRequest from '../models/DocumentRequest.js';


const ALLOWED_CLIENT_TYPES = [
  'Individuals',
  'HUF',
  'Proprietorship',
  'Partnership Firms',
  'LLP',
  'Companies',
  'Trusts / AOP / BOI',
  'Others'
];

const ALLOWED_REGULARITY_TYPES = ['Regular', 'Irregular', 'Inactive'];

const sanitizeClient = (clientDoc) => {
  if (!clientDoc) return null;
  const clientObj = clientDoc.toObject ? clientDoc.toObject() : clientDoc;
  delete clientObj.status;
  return clientObj;
};

// @desc    Pre-generate next available client ID
// @route   GET /api/clients/next-id
// @access  Private (Admin & Manager)
export const getNextClientId = async (req, res) => {
  try {
    const allClients = await Client.find({ clientId: /^C\d+$/ }, { clientId: 1 });
    let maxNum = 100;
    for (const c of allClients) {
      const num = parseInt(c.clientId.substring(1), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    const generatedClientId = `C${maxNum + 1}`;
    res.json({ success: true, clientId: generatedClientId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new client account and profile
// @route   POST /api/clients
// @access  Private (Admin & Manager)
export const createClient = async (req, res) => {
  const {
    clientId,
    assignedTeamLead,
    fileNumber,
    accountantName,
    caseType,
    dobDof,
    email,
    whatsappNumber,
    panNumber,
    aadhaarNumber,
    servicesOpted,
    address,
    regularityType,
    remarks,
    assignedEmployee,
  } = req.body;

  const clientName = req.body.clientName || req.body.name;
  const rawPhoneNumber = req.body.phoneNumber || req.body.phone;
  const clientType = req.body.clientType || 'Individuals';
  const businessName = req.body.businessName || req.body.companyName;

  // Clean phone number (extract last 10 digits and numbers only)
  let phoneNumber = rawPhoneNumber ? String(rawPhoneNumber).replace(/\D/g, '') : '';
  if (phoneNumber.length > 10) {
    phoneNumber = phoneNumber.slice(-10);
  }

  // Basic authorization check (only Admin, Manager, TL can add)
  let userRole = req.user?.role?.name;
  if (!userRole && req.user?.role) {
    const roleDoc = await Role.findById(req.user.role);
    userRole = roleDoc?.name;
  }
  if (!['Admin', 'CA Login', 'Manager'].includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Not authorized to create clients' });
  }

  // Required validations
  if (!clientName || !phoneNumber || !clientType) {
    return res.status(400).json({ success: false, message: 'Client Name, Phone Number, and Client Type are required' });
  }

  if (!ALLOWED_CLIENT_TYPES.includes(clientType)) {
    return res.status(400).json({ success: false, message: 'Invalid Client Type.' });
  }

  if (regularityType && !ALLOWED_REGULARITY_TYPES.includes(regularityType)) {
    return res.status(400).json({ success: false, message: 'Invalid Regularity Type.' });
  }

  // Validation rules
  if (!/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Phone Number must be exactly 10 digits and numeric only' });
  }

  if (email) {
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid Email format' });
    }
  }

  if (panNumber) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return res.status(400).json({ success: false, message: 'PAN must be exactly 10 characters in format ABCDE1234F (Uppercase Only)' });
    }
  }

  if (aadhaarNumber) {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ success: false, message: 'Aadhaar must be exactly 12 digits and numeric only' });
    }
  }

  try {
    // Validate or Generate Client ID
    let finalClientId = clientId;
    if (!finalClientId) {
      const allClients = await Client.find({ clientId: /^C\d+$/ }, { clientId: 1 });
      let maxNum = 100;
      for (const c of allClients) {
        const num = parseInt(c.clientId.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
      finalClientId = `C${maxNum + 1}`;
    } else {
      const existing = await Client.findOne({ clientId: finalClientId });
      if (existing) {
        return res.status(400).json({ success: false, message: `Client ID ${finalClientId} already exists` });
      }
    }

    // Optionally create user account for client login
    let linkedUserId = null;
    if (email) {
      let existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        const clientRoleDoc = await Role.findOne({ name: 'Client' });
        if (clientRoleDoc) {
          existingUser = await User.create({
            name: clientName,
            email: email.toLowerCase(),
            password: 'welcome123', // default temp password
            role: clientRoleDoc._id,
            phone: phoneNumber,
          });
        }
      }
      if (existingUser) {
        linkedUserId = existingUser._id;
      }
    }

    // Set Team Lead if TL created it, or if selected employee is a TL
    let targetTeamLead = assignedTeamLead || null;
    if (userRole === 'Manager') {
      targetTeamLead = req.user._id;
    } else if (assignedEmployee) {
      const selectedEmp = await User.findById(assignedEmployee).populate('role');
      if (selectedEmp && selectedEmp.role?.name === 'Manager') {
        targetTeamLead = selectedEmp._id;
      }
    }

    // Create client profile
    const client = await Client.create({
      clientId: finalClientId,
      clientName,
      fileNumber: fileNumber || '',
      businessName: businessName || '',
      accountantName: accountantName || '',
      clientType,
      caseType: caseType || '',
      dobDof: dobDof || null,
      phoneNumber,
      email: email ? email.toLowerCase() : '',
      whatsappNumber: whatsappNumber || '',
      panNumber: panNumber ? panNumber.toUpperCase() : '',
      aadhaarNumber: aadhaarNumber || '',
      servicesOpted: Array.isArray(servicesOpted) ? servicesOpted : [],
      address: address || '',
      regularityType: regularityType || '',
      remarks: remarks || '',
      status: 'Active',
      assignedTeamLead: targetTeamLead,
      assignedEmployee: assignedEmployee || null,
      user: linkedUserId,
    });

    const populatedClient = await Client.findById(client._id)
      .populate('assignedTeamLead', 'name email employeeId phone')
      .populate('assignedEmployee', 'name email employeeId phone')
      .populate('user', 'name email phone');

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Client Created',
      details: `Created client: ${clientName} (${finalClientId})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Client profile and account created successfully.',
      data: sanitizeClient(populatedClient),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    const tasks = await Task.find({ clientId: client._id })
      .populate('assignedTo', 'name email employeeId')
      .sort({ dueDate: 1 });

    const documentRequests = await DocumentRequest.find({ client: client._id })
      .populate('requestedBy', 'name role')
      .populate('uploadedDocument')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: {
        client: sanitizeClient(client),
        documents,
        tasks,
        documentRequests,
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
          link: `/pending-documents`, // Redirect to applications/client portal review
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

    const sanitizedDocs = documents.map(doc => {
      const docObj = doc.toObject();
      if (docObj.client) docObj.client = sanitizeClient(docObj.client);
      return docObj;
    });

    res.json({
      success: true,
      count: documents.length,
      data: sanitizedDocs,
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

    const docObj = document.toObject();
    if (docObj.client) docObj.client = sanitizeClient(docObj.client);

    res.json({
      success: true,
      message: `Document status updated to: ${status}.`,
      data: docObj,
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
      data: sanitizeClient(client),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all client profiles list
// @route   GET /api/clients
// @access  Private (Employee, TL, Manager, Admin)
export const getClients = async (req, res) => {
  const {
    search,
    status,
    clientType,
    caseType,
    accountantName,
    regularityType,
    servicesOpted,
    assignedTeamLead,
    assignedEmployee,
    sortBy,
    order,
    page,
    limit,
  } = req.query;

  try {
    let query = {};

    // Role-based filtration
    const userRole = req.user?.role?.name;
    if (userRole === 'Employee') {
      query.assignedEmployee = req.user._id;
    } else if (userRole === 'Manager') {
      query.$or = [
        { assignedTeamLead: req.user._id },
        { assignedEmployee: req.user._id }
      ];
    } else if (userRole !== 'Admin' && userRole !== 'CA Login') {
      return res.status(403).json({ success: false, message: 'Not authorized to view client registry' });
    }

    // Apply Search (partial case-insensitive)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { clientId: searchRegex },
        { clientName: searchRegex },
        { businessName: searchRegex },
        { phoneNumber: searchRegex },
        { panNumber: searchRegex },
      ];
    }

    // Apply multi-select filters (status, clientType, etc.)
    const filterFields = [
      'status',
      'clientType',
      'caseType',
      'accountantName',
      'regularityType',
      'assignedTeamLead',
      'assignedEmployee'
    ];

    filterFields.forEach((field) => {
      if (req.query[field]) {
        const values = req.query[field].split(',').map(v => v.trim()).filter(Boolean);
        if (values.length > 0) {
          query[field] = { $in: values };
        }
      }
    });

    if (servicesOpted) {
      const services = servicesOpted.split(',').map(s => s.trim()).filter(Boolean);
      if (services.length > 0) {
        query.servicesOpted = { $in: services };
      }
    }

    // Pagination setup
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Sorting setup
    const sortField = sortBy || 'clientId';
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortQuery = { [sortField]: sortOrder };

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('assignedTeamLead', 'name email employeeId phone')
      .populate('assignedEmployee', 'name email employeeId phone')
      .populate('user', 'name email phone')
      .sort(sortQuery)
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      success: true,
      count: clients.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: clients.map(sanitizeClient),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single client profile by ID
// @route   GET /api/clients/:id
// @access  Private (Employee, TL, Manager, Admin)
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedTeamLead', 'name email employeeId phone')
      .populate('assignedEmployee', 'name email employeeId phone')
      .populate('user', 'name email phone');

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Role-based validation
    const userRole = req.user?.role?.name;
    if (userRole === 'Employee' && client.assignedEmployee?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this client profile' });
    }
    if (userRole === 'TL') {
      const isTLAssigned = client.assignedTeamLead?.toString() === req.user._id.toString();
      const isEmpAssigned = client.assignedEmployee?.toString() === req.user._id.toString();
      if (!isTLAssigned && !isEmpAssigned) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this client profile' });
      }
    }

    res.json({
      success: true,
      data: sanitizeClient(client),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client profile details
// @route   PUT /api/clients/:id
// @access  Private (Employee, TL, Manager, Admin)
export const updateClient = async (req, res) => {
  try {
    let client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const userRole = req.user?.role?.name;

    // Role checks for editing
    if (userRole === 'Employee') {
      if (!client.assignedEmployee || client.assignedEmployee.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this client' });
      }
      // Employee cannot modify status, assigned TL, or assigned Employee
      delete req.body.status;
      delete req.body.assignedTeamLead;
      delete req.body.assignedEmployee;
      delete req.body.clientId; // Non editable
    } else if (userRole === 'Manager') {
      const isTLAssigned = client.assignedTeamLead?.toString() === req.user._id.toString();
      const isEmpAssigned = client.assignedEmployee?.toString() === req.user._id.toString();
      if (!isTLAssigned && !isEmpAssigned) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this client' });
      }
      // TL cannot change Team Lead assignment
      delete req.body.assignedTeamLead;
      delete req.body.clientId; // Non editable
    } else if (userRole === 'Admin' || userRole === 'CA Login') {
      delete req.body.clientId; // Non editable
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to edit client' });
    }

    // Input Validations
    let clientName = req.body.clientName !== undefined ? req.body.clientName : req.body.name;
    let rawPhoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : req.body.phone;
    let clientType = req.body.clientType !== undefined ? req.body.clientType : undefined;
    let businessName = req.body.businessName !== undefined ? req.body.businessName : req.body.companyName;

    let phoneNumber = undefined;
    if (rawPhoneNumber !== undefined && rawPhoneNumber !== null) {
      phoneNumber = String(rawPhoneNumber).replace(/\D/g, '');
      if (phoneNumber.length > 10) {
        phoneNumber = phoneNumber.slice(-10);
      }
    }

    if (clientName !== undefined) req.body.clientName = clientName;
    if (phoneNumber !== undefined) req.body.phoneNumber = phoneNumber;
    if (clientType !== undefined) req.body.clientType = clientType;
    if (businessName !== undefined) req.body.businessName = businessName;

    const { email, panNumber, aadhaarNumber, assignedEmployee } = req.body;

    if (clientName === '') {
      return res.status(400).json({ success: false, message: 'Client Name is required' });
    }
    if (clientType !== undefined && clientType !== '' && !ALLOWED_CLIENT_TYPES.includes(clientType)) {
      return res.status(400).json({ success: false, message: 'Invalid Client Type.' });
    }
    const { regularityType } = req.body;
    if (regularityType !== undefined && regularityType !== '' && !ALLOWED_REGULARITY_TYPES.includes(regularityType)) {
      return res.status(400).json({ success: false, message: 'Invalid Regularity Type.' });
    }

    if (phoneNumber !== undefined) {
      if (!/^\d{10}$/.test(phoneNumber)) {
        return res.status(400).json({ success: false, message: 'Phone Number must be exactly 10 digits and numeric only' });
      }
    }

    if (email) {
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid Email format' });
      }
    }

    if (panNumber) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        return res.status(400).json({ success: false, message: 'PAN must be exactly 10 characters in format ABCDE1234F (Uppercase Only)' });
      }
    }

    if (aadhaarNumber) {
      if (!/^\d{12}$/.test(aadhaarNumber)) {
        return res.status(400).json({ success: false, message: 'Aadhaar must be exactly 12 digits and numeric only' });
      }
    }

    // Update fields
    const fieldsToUpdate = [
      'clientName', 'fileNumber', 'businessName', 'accountantName',
      'clientType', 'caseType', 'dobDof', 'phoneNumber', 'email',
      'whatsappNumber', 'panNumber', 'aadhaarNumber', 'servicesOpted',
      'address', 'regularityType', 'remarks', 'status', 'assignedEmployee'
    ];

    if (userRole === 'Admin' || userRole === 'CA Login') {
      fieldsToUpdate.push('assignedTeamLead');
    }

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    // Automatically set/sync assignedTeamLead if selected assignedEmployee has the TL role
    if (req.body.assignedEmployee !== undefined && req.body.assignedEmployee) {
      const selectedEmp = await User.findById(req.body.assignedEmployee).populate('role');
      if (selectedEmp && selectedEmp.role?.name === 'Manager') {
        client.assignedTeamLead = selectedEmp._id;
      }
    }

    // Optionally create user account for client login if email is newly updated
    if (email && email.toLowerCase() !== client.email) {
      let existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        const clientRoleDoc = await Role.findOne({ name: 'Client' });
        if (clientRoleDoc) {
          existingUser = await User.create({
            name: client.clientName,
            email: email.toLowerCase(),
            password: 'welcome123',
            role: clientRoleDoc._id,
            phone: client.phoneNumber,
          });
        }
      }
      if (existingUser) {
        client.user = existingUser._id;
      }
    }

    await client.save();

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Client Updated',
      details: `Updated client: ${client.clientName} (${client.clientId})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    const populatedClient = await Client.findById(client._id)
      .populate('assignedTeamLead', 'name email employeeId phone')
      .populate('assignedEmployee', 'name email employeeId phone')
      .populate('user', 'name email phone');

    res.json({
      success: true,
      message: 'Client profile updated successfully',
      data: sanitizeClient(populatedClient),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client profile
// @route   DELETE /api/clients/:id
// @access  Private (Manager, Admin only)
export const deleteClient = async (req, res) => {
  try {
    const userRole = req.user?.role?.name;
    if (userRole !== 'Admin' && userRole !== 'CA Login') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete clients. Only Admins and CA Logins are allowed.' });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    await Client.findByIdAndDelete(req.params.id);

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Client Deleted',
      details: `Deleted client: ${client.clientName} (${client.clientId})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Client profile deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search clients (Fast real-time auto-complete)
// @route   GET /api/clients/search
// @access  Private (Employee, TL, Manager, Admin)
export const searchClients = async (req, res) => {
  const { search } = req.query;

  try {
    let query = {};
    const userRole = req.user?.role?.name;

    if (userRole === 'Employee') {
      query.assignedEmployee = req.user._id;
    } else if (userRole === 'Manager') {
      query.$or = [
        { assignedTeamLead: req.user._id },
        { assignedEmployee: req.user._id }
      ];
    } else if (userRole !== 'Admin' && userRole !== 'CA Login') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { clientId: searchRegex },
        { clientName: searchRegex },
        { businessName: searchRegex },
        { phoneNumber: searchRegex },
        { panNumber: searchRegex },
      ];
    }

    const clients = await Client.find(query)
      .populate('assignedTeamLead', 'name')
      .populate('assignedEmployee', 'name')
      .limit(50);

    res.json({
      success: true,
      count: clients.length,
      data: clients.map(sanitizeClient),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Resolve Manager/Admin role IDs
const getReviewerRoles = async () => {
  const roles = await Role.find({ name: { $in: ['Admin', 'CA Login'] } });
  return roles.map(r => r._id);
};
