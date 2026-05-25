import Department from '../models/Department.js';

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Authenticated users)
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    res.json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private (Admin, Manager)
export const createDepartment = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Please provide a department name' });
  }

  try {
    const exists = await Department.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    const dept = await Department.create({ name, description });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
export const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
