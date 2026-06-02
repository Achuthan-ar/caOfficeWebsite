import User from '../models/User.js';
import Role from '../models/Role.js';
import AuditLog from '../models/AuditLog.js';
import Client from '../models/Client.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin & Manager)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate({
        path: 'role',
        populate: { path: 'permissions' },
      })
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!role || !['Admin', 'Manager', 'TL', 'Employee', 'Intern', 'Client'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing role parameter' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent changing own role (to avoid locking oneself out of admin)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own role' });
    }

    // Find Role document
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(404).json({ success: false, message: `Role '${role}' not found` });
    }

    user.role = roleDoc._id;
    await user.save();

    const populatedUser = await User.findById(user._id).populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'User Role Updated',
      details: `User "${populatedUser.name}" role updated to ${role}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `User role updated successfully to ${role}`,
      data: {
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Cascade delete client profile if user is a client
    await Client.deleteOne({ user: user._id });

    await User.findByIdAndDelete(req.params.id);

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'User Deleted',
      details: `User "${user.name}" account deleted`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user password by admin (excluding clients)
// @route   PUT /api/users/:id/password
// @access  Private (Admin only)
export const updateUserPassword = async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.params.id).populate('role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Exclude clients from password modifications
    if (user.role && user.role.name === 'Client') {
      return res.status(400).json({ success: false, message: 'Client passwords cannot be modified by the admin' });
    }

    user.password = password;
    await user.save();

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'User Password Changed by Admin',
      details: `Password of user "${user.name}" (${user.email}) changed by Admin`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Password for user "${user.name}" updated successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

