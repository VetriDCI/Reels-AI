import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype?.startsWith('video/');
    return {
      folder: 'ra-social',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'm4v', 'webm'],
      // Only apply image resize transformation to images — video transformations need different handling.
      transformation: isVideo ? undefined : [{ width: 1920, height: 1080, crop: 'limit' }],
    };
  },
});

const allowedImage = new Set(['image/jpeg','image/png','image/gif','image/webp']);
const allowedVideo = new Set(['video/mp4','video/webm','video/quicktime','video/x-m4v']);
const fileFilter = (req, file, cb) => {
  const mime = String(file.mimetype || '').toLowerCase();
  if (allowedImage.has(mime) || allowedVideo.has(mime)) return cb(null, true);
  const err = new Error('Unsupported media type. Use JPG, PNG, GIF, WEBP, MP4, WEBM, or MOV.');
  err.code = 'INVALID_MEDIA_TYPE';
  cb(err);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1
  }
});

export { cloudinary, upload };