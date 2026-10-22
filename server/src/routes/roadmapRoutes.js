import express from 'express';
import {
  generateRoadmap,
  getRoadmapById,
  getMyRoadmaps,
  updateRoadmapProgress,
} from '../controllers/roadmapController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all roadmap routes with JWT authentication
router.use(requireAuth);

// POST /api/roadmaps/generate - Generate personalized career roadmap from SkillGapAnalysis
router.post('/generate', generateRoadmap);

// GET /api/roadmaps - Retrieve authenticated student's roadmaps
router.get('/', getMyRoadmaps);

// GET /api/roadmaps/:id - Retrieve specific roadmap by ID
router.get('/:id', getRoadmapById);

// PATCH /api/roadmaps/:id/progress - Update progress tracking for modules/milestones
router.patch('/:id/progress', updateRoadmapProgress);

export default router;
