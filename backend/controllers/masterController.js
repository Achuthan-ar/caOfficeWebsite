import { getMasterModel } from '../models/masterModels.js';
import Client from '../models/Client.js';
import AuditLog from '../models/AuditLog.js';

// Resolve model based on route parameter
const getModel = (req, res) => {
  const { category } = req.params;
  const Model = getMasterModel(category);
  if (!Model) {
    res.status(400).json({ success: false, message: `Invalid master category: ${category}` });
    return null;
  }
  return Model;
};

// Dependency checker helper
const checkMasterDependencies = async (category, recordName) => {
  let count = 0;
  switch (category.toLowerCase()) {
    case 'services':
      count = await Client.countDocuments({ servicesOpted: recordName });
      break;
    case 'accountants':
      count = await Client.countDocuments({ accountantName: recordName });
      break;
    case 'client-types':
      count = await Client.countDocuments({ clientType: recordName });
      break;
    case 'case-types':
      count = await Client.countDocuments({ caseType: recordName });
      break;
    case 'regularity-types':
      count = await Client.countDocuments({ regularityType: recordName });
      break;
    default:
      break;
  }
  return count;
};

// @desc    Get master list entries
// @route   GET /api/masters/:category
// @access  Private (All authenticated staff)
export const getMasterList = async (req, res) => {
  const Model = getModel(req, res);
  if (!Model) return;

  const { category } = req.params;
  const { search, status, sortBy, order, page, limit } = req.query;

  try {
    let query = {};

    // Search query by name or description (or associate fields for accountants)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      if (category.toLowerCase() === 'accountants') {
        query.$or = [{ associate_name: searchRegex }, { email: searchRegex }, { phone_number: searchRegex }];
      } else {
        query.$or = [{ name: searchRegex }, { description: searchRegex }];
      }
    }

    // Filter by status (multi-select value support)
    if (status) {
      const statusValues = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statusValues.length > 0) {
        query.status = { $in: statusValues };
      }
    }

    // Pagination setup
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Sorting setup
    const sortField = sortBy || (category.toLowerCase() === 'accountants' ? 'associate_name' : 'name');
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortQuery = { [sortField]: sortOrder };

    const total = await Model.countDocuments(query);
    const data = await Model.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sortQuery)
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      success: true,
      count: data.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create master list entry
// @route   POST /api/masters/:category
// @access  Private (Admin, Manager, TL)
export const createMasterEntry = async (req, res) => {
  const Model = getModel(req, res);
  if (!Model) return;

  const { category } = req.params;

  if (category.toLowerCase() === 'accountants') {
    const { associate_name, email, phone_number, status } = req.body;

    if (!associate_name || !associate_name.trim()) {
      return res.status(400).json({ success: false, message: 'Associate Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email Address is required' });
    }
    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ success: false, message: 'Phone Number is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    try {
      const duplicate = await Model.findOne({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `An associate with email "${email}" already exists` });
      }

      const newRecord = await Model.create({
        associate_name: associate_name.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone_number.trim(),
        status: status || 'Active',
        createdBy: req.user._id,
      });

      const populatedRecord = await Model.findById(newRecord._id).populate('createdBy', 'name');

      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role.name,
        action: 'Master Record Created',
        details: `Created associate "${associate_name}" in category "${category}".`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      return res.status(201).json({
        success: true,
        message: 'Associate created successfully',
        data: populatedRecord,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const { name, description, status } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  try {
    // Check for duplicate name (case insensitive)
    const duplicate = await Model.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (duplicate) {
      return res.status(400).json({ success: false, message: `An option with name "${name}" already exists` });
    }

    const newRecord = await Model.create({
      name: name.trim(),
      description: description || '',
      status: status || 'Active',
      createdBy: req.user._id,
    });

    const populatedRecord = await Model.findById(newRecord._id).populate('createdBy', 'name');

    // Audit Log Integration
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role.name,
      action: 'Master Record Created',
      details: `Created master entry "${name}" in category "${category}". New Value: Name: "${name}", Status: "${status || 'Active'}", Description: "${description || ''}".`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Master option created successfully',
      data: populatedRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update master list entry
// @route   PUT /api/masters/:category/:id
// @access  Private (Admin, Manager, TL)
export const updateMasterEntry = async (req, res) => {
  const Model = getModel(req, res);
  if (!Model) return;

  const { category } = req.params;

  if (category.toLowerCase() === 'accountants') {
    const { associate_name, email, phone_number, status } = req.body;
    try {
      let record = await Model.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Master record not found' });
      }

      if (email && email.trim().toLowerCase() !== record.email.toLowerCase()) {
        const duplicate = await Model.findOne({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });
        if (duplicate) {
          return res.status(400).json({ success: false, message: `An associate with email "${email}" already exists` });
        }
      }

      const oldName = record.associate_name;
      const oldStatus = record.status;

      if (associate_name !== undefined) record.associate_name = associate_name.trim();
      if (email !== undefined) record.email = email.trim().toLowerCase();
      if (phone_number !== undefined) record.phone_number = phone_number.trim();
      if (status !== undefined) record.status = status;
      record.updatedBy = req.user._id;

      await record.save();

      const populatedRecord = await Model.findById(record._id)
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role.name,
        action: oldStatus !== status && status !== undefined ? 'Master Status Changed' : 'Master Record Updated',
        details: `Updated associate "${oldName}" in "${category}". New Value: [Name: "${record.associate_name}", Status: "${record.status}", Email: "${record.email}", Phone: "${record.phone_number}"].`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      return res.json({
        success: true,
        message: 'Associate updated successfully',
        data: populatedRecord,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const { name, description, status } = req.body;

  try {
    let record = await Model.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Master record not found' });
    }

    // Check duplicate name if name is changing
    if (name && name.trim().toLowerCase() !== record.name.toLowerCase()) {
      const duplicate = await Model.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `An option with name "${name}" already exists` });
      }
    }

    const oldName = record.name;
    const oldStatus = record.status;
    const oldDescription = record.description;

    const action = oldStatus !== status && status !== undefined ? 'Master Status Changed' : 'Master Record Updated';

    if (name !== undefined) record.name = name.trim();
    if (description !== undefined) record.description = description;
    if (status !== undefined) record.status = status;
    record.updatedBy = req.user._id;

    await record.save();

    const populatedRecord = await Model.findById(record._id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    // Audit Log Integration
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role.name,
      action,
      details: `${action} for "${oldName}" in "${category}". Old Value: [Name: "${oldName}", Status: "${oldStatus}", Desc: "${oldDescription}"]. New Value: [Name: "${record.name}", Status: "${record.status}", Desc: "${record.description}"].`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Master option updated successfully',
      data: populatedRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete master list entry
// @route   DELETE /api/masters/:category/:id
// @access  Private (Admin, Manager only)
export const deleteMasterEntry = async (req, res) => {
  const Model = getModel(req, res);
  if (!Model) return;

  const { category } = req.params;

  try {
    const record = await Model.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Master record not found' });
    }

    // Role-based protection: TL and Employee cannot delete
    const userRole = req.user.role.name;
    if (userRole !== 'Admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete master records. Only Managers and Admins are allowed.' });
    }

    // Check Client Dependencies (Delete Rules)
    const recordName = category.toLowerCase() === 'accountants' ? record.associate_name : record.name;
    const linkedClientsCount = await checkMasterDependencies(category, recordName);
    if (linkedClientsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `This ${category.replace(/-/g, ' ').slice(0, -1)} "${recordName}" is linked to ${linkedClientsCount} client(s) and cannot be deleted. You can mark it as Inactive instead.`,
      });
    }

    await Model.findByIdAndDelete(req.params.id);

    // Audit Log Integration
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role.name,
      action: 'Master Record Deleted',
      details: `Deleted master entry "${recordName}" in category "${category}". Old Value: Name: "${recordName}".`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Master option deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
