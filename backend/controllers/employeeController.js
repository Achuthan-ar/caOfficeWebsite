import User from '../models/User.js';
import Role from '../models/Role.js';
import Department from '../models/Department.js';
import AuditLog from '../models/AuditLog.js';
import { sendOneTimeRegistrationEmail } from '../services/emailService.js';

// @desc    Get all employees with filters (excluding password, including salary for admin/manager)
// @route   GET /api/employees
// @access  Private (Admin, Manager)
export const getEmployees = async (req, res) => {
  const { search, department, role } = req.query;

  try {
    const query = {};

    // Filter out Clients from the Employee list
    const clientRole = await Role.findOne({ name: 'Client' });
    if (clientRole) {
      query.role = { $ne: clientRole._id };
    }

    // Apply Search (matches name, email, or employeeId)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    // Apply Department filter
    if (department) {
      query.department = department;
    }

    // Apply Role filter
    if (role) {
      query.role = role;
    }

    // Admins and Managers are allowed to view salary, so we select '+salary'
    const employees = await User.find(query)
      .select('+salary')
      .populate('role', 'name description')
      .populate('department', 'name')
      .sort({ employeeId: 1 });

    res.json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new employee user account
// @route   POST /api/employees
// @access  Private (Admin, Manager)
export const createEmployee = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    employeeId,
    phone,
    department,
    joiningDate,
    salary,
    address,
    emergencyContact,
    documents,
  } = req.body;

  if (!name || !email || !role || !employeeId) {
    return res.status(400).json({ success: false, message: 'Name, email, role, and Employee ID are required' });
  }

  try {
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check if Employee ID already exists
    const idExists = await User.findOne({ employeeId });
    if (idExists) {
      return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }

    // Resolve Role ID if role name is passed
    let roleId = role;
    if (typeof role === 'string' && role.length < 24) {
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) {
        return res.status(404).json({ success: false, message: `Role '${role}' not found` });
      }
      roleId = roleDoc._id;
    }

    const employee = await User.create({
      name,
      email,
      password: password || 'welcome123', // Default temporary password
      role: roleId,
      employeeId,
      phone,
      department: department || null,
      joiningDate: joiningDate || new Date(),
      salary: salary || 0,
      address: address || '',
      emergencyContact: emergencyContact || { name: '', phone: '' },
      documents: documents || [],
    });

    const populatedEmployee = await User.findById(employee._id)
      .select('+salary')
      .populate('role', 'name')
      .populate('department', 'name');

    // Trigger one-time registration welcome email to the new employee on behalf of the registering manager
    try {
      await sendOneTimeRegistrationEmail(
        populatedEmployee.email,
        populatedEmployee.name,
        password || 'welcome123',
        req.user.name,
        req.user.email,
        populatedEmployee.role?.name || 'Employee'
      );
    } catch (err) {
      console.error('Failed to send one-time welcome credentials email:', err.message);
    }

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Employee Created',
      details: `Created employee user: ${name} (${employeeId})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: populatedEmployee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update employee profile details
// @route   PUT /api/employees/:id
// @access  Private (Admin, Manager)
export const updateEmployee = async (req, res) => {
  const {
    name,
    email,
    role,
    employeeId,
    phone,
    department,
    joiningDate,
    salary,
    address,
    emergencyContact,
    documents,
  } = req.body;

  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if Employee ID is changed and already taken by another user
    if (employeeId && employeeId !== employee.employeeId) {
      const idExists = await User.findOne({ employeeId, _id: { $ne: employee._id } });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'Employee ID already in use' });
      }
    }

    // Resolve Role ID if role name is passed
    let roleId = role;
    if (role && typeof role === 'string' && role.length < 24) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        roleId = roleDoc._id;
      }
    }

    const fieldsToUpdate = [
      'name',
      'email',
      'employeeId',
      'phone',
      'department',
      'joiningDate',
      'salary',
      'address',
      'emergencyContact',
      'documents',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    });

    if (roleId) {
      // Prevent changing own role
      if (employee._id.toString() !== req.user._id.toString()) {
        employee.role = roleId;
      }
    }

    await employee.save();

    const populatedEmployee = await User.findById(employee._id)
      .select('+salary')
      .populate('role', 'name')
      .populate('department', 'name');

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Employee Updated',
      details: `Updated employee profile for user: ${employee.name} (${employee.employeeId})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Employee details updated successfully.',
      data: populatedEmployee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete employee user account
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Prevent deleting own account
    if (employee._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Employee Deleted',
      details: `Deleted employee user: ${employee.name} (${employee.employeeId})`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
