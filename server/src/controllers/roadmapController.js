import mongoose from 'mongoose';
import Roadmap from '../models/Roadmap.js';
import SkillGapAnalysis from '../models/SkillGapAnalysis.js';
import {
  generateRoadmapFromAnalysis,
  persistRoadmap,
} from '../services/roadmapService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Format Roadmap response cleanly
 */
const formatRoadmapResponse = (roadmap, populatedRole = null, populatedAnalysis = null) => {
  const role = populatedRole || roadmap.targetRoleId;
  const analysis = populatedAnalysis || roadmap.analysisId;

  return {
    id: roadmap._id,
    userId: roadmap.userId,
    targetRole: role && role.title ? {
      id: role._id || role.id,
      title: role.title,
      slug: role.slug,
      department: role.department,
    } : role,
    skillGapAnalysisId: roadmap.skillGapAnalysisId || roadmap.analysisId,
    analysisId: roadmap.analysisId || roadmap.skillGapAnalysisId,
    analysisSummary: analysis && typeof analysis.overallMatchPercentage === 'number' ? {
      matchPercentage: analysis.overallMatchPercentage,
      gapPercentage: analysis.overallGapPercentage,
      matchedCount: analysis.matchedCount,
      missingCount: analysis.missingCount,
    } : null,
    title: roadmap.title,
    description: roadmap.description,
    estimatedDurationWeeks: roadmap.estimatedDurationWeeks,
    weeklyHoursCommitment: roadmap.weeklyHoursCommitment,
    totalEstimatedHours: roadmap.totalEstimatedHours,
    prerequisitesSummary: roadmap.prerequisitesSummary,
    prioritizedSkills: roadmap.prioritizedSkills,
    modules: roadmap.modules,
    milestones: roadmap.milestones,
    milestoneProjects: roadmap.milestoneProjects,
    status: roadmap.status,
    overallProgress: roadmap.overallProgress ?? roadmap.progressPercentage ?? 0,
    progressPercentage: roadmap.progressPercentage ?? roadmap.overallProgress ?? 0,
    completedMilestonesCount: roadmap.completedMilestonesCount || 0,
    createdAt: roadmap.createdAt,
    updatedAt: roadmap.updatedAt,
  };
};

/**
 * POST /api/roadmaps/generate
 * Generates a personalized learning roadmap from an authentic persisted SkillGapAnalysis
 */
export const generateRoadmap = async (req, res, next) => {
  try {
    const { skillGapAnalysisId } = req.body;

    // 1. Validate presence of skillGapAnalysisId
    if (!skillGapAnalysisId) {
      return sendError(
        res,
        'skillGapAnalysisId is required to generate a personalized roadmap.',
        400
      );
    }

    // 2. Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(skillGapAnalysisId)) {
      return sendError(res, 'Invalid skill gap analysis ID format.', 400);
    }

    // 3. Fetch SkillGapAnalysis and enforce tenant isolation
    const analysis = await SkillGapAnalysis.findById(skillGapAnalysisId)
      .populate('targetRoleId')
      .populate('resumeId');

    if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        'Skill gap analysis record not found or access denied.',
        404
      );
    }

    // Verify JobRole presence
    if (!analysis.targetRoleId) {
      return sendError(
        res,
        'Target job role associated with this skill gap analysis is missing or unavailable.',
        400
      );
    }

    // 4. Duplicate Check: If roadmap already exists for this analysis, return existing roadmap
    const existingRoadmap = await Roadmap.findOne({
      userId: req.user._id,
      $or: [
        { analysisId: analysis._id },
        { skillGapAnalysisId: analysis._id },
      ],
    }).populate('targetRoleId');

    if (existingRoadmap) {
      return sendSuccess(
        res,
        {
          roadmap: formatRoadmapResponse(existingRoadmap),
          isExisting: true,
        },
        'Existing personalized roadmap for this analysis retrieved successfully',
        200
      );
    }

    // 5. Generate roadmap data from authentic skill gap data
    const roadmapData = await generateRoadmapFromAnalysis(analysis, {
      weeklyHoursCommitment: req.body.weeklyHoursCommitment || 15,
    });

    // 6. Persist to MongoDB
    const savedRoadmap = await persistRoadmap(roadmapData);

    return sendSuccess(
      res,
      {
        roadmap: formatRoadmapResponse(savedRoadmap, analysis.targetRoleId, analysis),
        isExisting: false,
      },
      'Personalized career roadmap generated successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roadmaps/:id
 * Retrieves a single roadmap by ID with ownership verification
 */
export const getRoadmapById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid roadmap ID format.', 400);
    }

    const roadmap = await Roadmap.findById(id)
      .populate('targetRoleId')
      .populate('analysisId');

    if (!roadmap || roadmap.userId.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        'Roadmap record not found or access denied.',
        404
      );
    }

    return sendSuccess(
      res,
      {
        roadmap: formatRoadmapResponse(roadmap),
      },
      'Roadmap retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roadmaps
 * Retrieves all roadmaps generated by the authenticated student
 */
export const getMyRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id })
      .populate('targetRoleId')
      .populate('analysisId')
      .sort({ createdAt: -1 });

    const formattedList = roadmaps.map((r) => formatRoadmapResponse(r));

    return sendSuccess(
      res,
      {
        count: formattedList.length,
        roadmaps: formattedList,
      },
      'Student career roadmaps retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/roadmaps/:id/progress
 * Updates progress for a module or stage and recalculates overallProgress
 */
export const updateRoadmapProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { milestoneIndex, moduleIndex, status, progress } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid roadmap ID format.', 400);
    }

    const roadmap = await Roadmap.findById(id);

    if (!roadmap || roadmap.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Roadmap record not found or access denied.', 404);
    }

    // Validate progress bounds if provided
    if (progress !== undefined) {
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return sendError(res, 'Progress must be a numeric value between 0 and 100.', 400);
      }
    }

    // Update specific milestone module if indices provided
    if (typeof milestoneIndex === 'number' && roadmap.milestones[milestoneIndex]) {
      const milestone = roadmap.milestones[milestoneIndex];
      if (typeof moduleIndex === 'number' && milestone.learningModules[moduleIndex]) {
        const mod = milestone.learningModules[moduleIndex];
        if (status) mod.status = status;
        if (progress !== undefined) mod.progress = progress;
      } else {
        if (status) milestone.status = status;
        if (progress !== undefined) milestone.progress = progress;
      }
    }

    // Also update top-level module if moduleIndex given without milestoneIndex
    if (typeof moduleIndex === 'number' && typeof milestoneIndex !== 'number' && roadmap.modules[moduleIndex]) {
      const mod = roadmap.modules[moduleIndex];
      if (status) mod.status = status;
      if (progress !== undefined) mod.progress = progress;
    }

    // Recalculate overall progress
    if (roadmap.modules && roadmap.modules.length > 0) {
      const totalModProgress = roadmap.modules.reduce((sum, m) => sum + (m.progress || 0), 0);
      const computedProgress = Math.round(totalModProgress / roadmap.modules.length);
      roadmap.overallProgress = computedProgress;
      roadmap.progressPercentage = computedProgress;

      if (computedProgress === 100) {
        roadmap.status = 'COMPLETED';
      } else if (computedProgress > 0) {
        roadmap.status = 'IN_PROGRESS';
      }
    }

    await roadmap.save();

    return sendSuccess(
      res,
      {
        roadmap: formatRoadmapResponse(roadmap),
      },
      'Roadmap progress updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

export default {
  generateRoadmap,
  getRoadmapById,
  getMyRoadmaps,
  updateRoadmapProgress,
};
