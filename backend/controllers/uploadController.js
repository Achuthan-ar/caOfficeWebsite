import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if credentials are provided
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// @desc    Upload file to Cloudinary (with local fallback)
// @route   POST /api/upload
// @access  Private (Authenticated users)
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  // 1. If Cloudinary credentials are set up, upload directly to Cloudinary
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ca_office_erp',
          resource_type: 'auto', // Accepts images, pdf, zip, docx, etc.
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary stream upload error:', error);
            return res.status(500).json({ success: false, message: 'Cloudinary upload failed' });
          }
          
          return res.json({
            success: true,
            message: 'File uploaded to Cloudinary successfully.',
            url: result.secure_url,
          });
        }
      );
      
      uploadStream.end(req.file.buffer);
      return;
    } catch (err) {
      console.warn('Cloudinary upload failed, attempting local fallback:', err.message);
    }
  }

  // 2. Fallback: Save file to local uploads directory in the backend workspace
  try {
    const uploadDir = path.resolve('uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname);
    const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanName}-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    // Return localized server URL (publicly accessible if /uploads route is served static)
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${serverUrl}/uploads/${filename}`;

    return res.json({
      success: true,
      message: 'File uploaded to local disk successfully (Cloudinary fallback active).',
      url,
    });
  } catch (err) {
    console.error('Local disk write fallback failed:', err.message);
    return res.status(500).json({ success: false, message: 'File upload failed.' });
  }
};
