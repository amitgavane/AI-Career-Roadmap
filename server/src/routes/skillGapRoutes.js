import express from 'express';
import {
  analyzeSkillGap,
  getSkillGapById,
  getMySkillGaps,
  getAvailableJobRoles,
} from '../controllers/skillGapController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all skill gap routes with JWT authentication
router.use(requireAuth);

// Analyze skill gap between candidate resume and target JobRole
router.post('/analyze', analyzeSkillGap);

// List available job roles for selection
router.get('/roles', getAvailableJobRoles);

// Retrieve all past analyses for the authenticated student
router.get('/my', getMySkillGaps);

// Retrieve specific skill gap analysis by ID
router.get('/:id', getSkillGapById);

export default router;
