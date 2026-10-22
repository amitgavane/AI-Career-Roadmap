import express from 'express';
import {
  uploadResume,
  getMyResumes,
  getResumeById,
  extractResumeEntities,
  deleteResumeById,
} from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadResumeMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Guard all resume routes with JWT authentication
router.use(requireAuth);

// Upload resume
router.post('/upload', uploadResumeMiddleware, uploadResume);

// Retrieve all resumes for authenticated student
router.get('/', getMyResumes);

// Retrieve specific resume by ID
router.get('/:id', getResumeById);

// Trigger AI entity extraction for a specific resume
router.post('/:id/extract', extractResumeEntities);

// Delete resume by ID
router.delete('/:id', deleteResumeById);

export default router;
