import multer from 'multer';
import path from 'path';
import { sendError } from '../utils/apiResponse.js';

// Maximum resume file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed extensions and MIME types
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/octet-stream', // Fallback for some OS file uploaders when extension matches
]);

// Memory storage to hold files safely in buffer without writing to disk
const storage = multer.memoryStorage();

// File filter to reject unsupported extensions and MIME types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();

  // Validate extension
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const error = new Error('Unsupported file type. Only PDF (.pdf) and Word (.docx) resume documents are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    const error = new Error(`Unsupported MIME type '${mimeType}'. Only PDF and DOCX documents are allowed.`);
    error.code = 'INVALID_MIME_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only 1 file per upload request
  },
  fileFilter,
});

/**
 * Middleware wrapper for single resume file upload on field 'resume'
 * Catches Multer errors (e.g. LIMIT_FILE_SIZE) and formats clean JSON error responses
 */
export const uploadResumeMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('resume');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(
          res,
          'File is too large. Maximum allowed resume file size is 5 MB.',
          400
        );
      }
      if (err.code === 'INVALID_FILE_TYPE' || err.code === 'INVALID_MIME_TYPE') {
        return sendError(res, err.message, 400);
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return sendError(
          res,
          'Unexpected field name. Please upload the file using field name "resume".',
          400
        );
      }
      return sendError(res, `Upload error: ${err.message}`, 400);
    }

    next();
  });
};
