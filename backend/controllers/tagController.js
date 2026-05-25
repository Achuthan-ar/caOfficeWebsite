import Tag from '../models/Tag.js';

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
export const getTags = async (req, res) => {
  try {
    const tags = await Tag.find({}).sort({ name: 1 });
    res.json({ success: true, count: tags.length, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a tag
// @route   POST /api/tags
// @access  Private (Admin, Manager, TL)
export const createTag = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Please provide a tag name' });
  }

  try {
    const exists = await Tag.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Tag already exists' });
    }

    const tag = await Tag.create({ name });
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a tag
// @route   DELETE /api/tags/:id
// @access  Private (Admin only)
export const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    await Tag.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
