import express from 'express';
import {
  getProfile,
  upsertProfile,
  patchProfile,
} from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All profile routes require authentication
router.use(requireAuth);

router.get('/', getProfile);
router.post('/', upsertProfile);
router.put('/', upsertProfile);
router.patch('/', patchProfile);

export default router;
