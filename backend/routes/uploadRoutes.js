import express from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

// Expose POST /api/upload endpoint
router.post('/', protect, upload.single('file'), uploadFile);

export default router;
