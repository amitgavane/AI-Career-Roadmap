import mongoose from 'mongoose';
import SkillGapAnalysis from '../models/SkillGapAnalysis.js';
import JobRole from '../models/JobRole.js';
import Resume from '../models/Resume.js';
import { normalizeSkills } from '../services/skillNormalizationService.js';
import { matchSkillsToJobRole } from '../services/skillMatchingService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Extracts all raw skill strings from a resume's Phase 5 aiExtractedData
 */
const extractAllCandidateSkills = (aiExtractedData) => {
  if (!aiExtractedData) return [];

  const rawSkillsSet = new Set();

  const addStrings = (arr) => {
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (typeof item === 'string' && item.trim()) {
          rawSkillsSet.add(item.trim());
        }
      }
    }
  };

  addStrings(aiExtractedData.skills);
  addStrings(aiExtractedData.programmingLanguages);
  addStrings(aiExtractedData.frameworks);
  addStrings(aiExtractedData.databases);
  addStrings(aiExtractedData.tools);

  // Collect any technologies tagged in projects
  if (Array.isArray(aiExtractedData.projects)) {
    for (const proj of aiExtractedData.projects) {
      addStrings(proj?.technologies);
    }
  }

  // Collect any technologies tagged in work experience
  if (Array.isArray(aiExtractedData.experience)) {
    for (const exp of aiExtractedData.experience) {
      addStrings(exp?.technologies);
    }
  }

  return Array.from(rawSkillsSet);
};

/**
 * Format SkillGapAnalysis response object cleanly
 */
const formatAnalysisResponse = (analysis, jobRole = null, resume = null) => {
  const targetRoleData = jobRole || analysis.targetRoleId;
  const resumeData = resume || analysis.resumeId;

  return {
    id: analysis._id,
    userId: analysis.userId,
    targetRole: targetRoleData ? {
      id: targetRoleData._id || targetRoleData.id,
      title: targetRoleData.title,
      slug: targetRoleData.slug,
      department: targetRoleData.department,
    } : null,
    resume: resumeData ? {
      id: resumeData._id || resumeData.id,
      originalName: resumeData.originalName,
    } : null,
    overallMatchPercentage: analysis.overallMatchPercentage,
    overallGapPercentage: analysis.overallGapPercentage,
    weightedScore: analysis.weightedScore,
    totalRequiredSkills: analysis.totalRequiredSkills || (analysis.matchedSkills.length + analysis.partiallyMatchedSkills.length + analysis.missingSkills.length),
    matchedCount: analysis.matchedCount ?? analysis.matchedSkills.length,
    partialCount: analysis.partialCount ?? analysis.partiallyMatchedSkills.length,
    missingCount: analysis.missingCount ?? analysis.missingSkills.length,
    matchedSkills: analysis.matchedSkills,
    partiallyMatchedSkills: analysis.partiallyMatchedSkills,
    partialSkills: analysis.partiallyMatchedSkills,
    missingSkills: analysis.missingSkills,
    categoryBreakdown: analysis.categoryBreakdown,
    evaluatedAt: analysis.evaluatedAt,
    createdAt: analysis.createdAt,
  };
};

/**
 * POST /api/skill-gap/analyze
 * Analyzes candidate's extracted resume skills against a target JobRole's requirements
 */
export const analyzeSkillGap = async (req, res, next) => {
  try {
    const { resumeId, jobRoleId } = req.body;

    // Validate presence of required IDs
    if (!resumeId || !jobRoleId) {
      return sendError(
        res,
        'Both resumeId and jobRoleId are required to perform skill gap analysis.',
        400
      );
    }

    // Validate MongoDB ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return sendError(res, 'Invalid resume ID format.', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(jobRoleId)) {
      return sendError(res, 'Invalid job role ID format.', 400);
    }

    // 1. Fetch resume and verify ownership (tenant isolation)
    const resume = await Resume.findById(resumeId);

    if (!resume || resume.userId.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        'Resume not found or you do not have permission to access it.',
        404
      );
    }

    // Verify Phase 5 extraction has completed
    if (resume.extractionStatus !== 'completed' || !resume.aiExtractedData) {
      return sendError(
        res,
        'Selected resume has not completed AI entity extraction. Please run resume extraction first.',
        400
      );
    }

    // 2. Fetch target JobRole
    const jobRole = await JobRole.findById(jobRoleId);

    if (!jobRole || !jobRole.isActive) {
      return sendError(
        res,
        'Selected target job role does not exist or is currently inactive.',
        404
      );
    }

    if (!Array.isArray(jobRole.requiredSkills) || jobRole.requiredSkills.length === 0) {
      return sendError(
        res,
        'Selected job role does not have any required skills configured for evaluation.',
        400
      );
    }

    // 3. Extract and normalize candidate skills
    const rawSkills = extractAllCandidateSkills(resume.aiExtractedData);
    const { normalizedSkills } = await normalizeSkills(rawSkills);

    // 4. Run semantic and alias skill matching engine
    const matchResult = await matchSkillsToJobRole(normalizedSkills, jobRole);

    // 5. Persist analysis to MongoDB
    const analysis = await SkillGapAnalysis.create({
      userId: req.user._id,
      targetRoleId: jobRole._id,
      resumeId: resume._id,
      matchedSkills: matchResult.matchedSkills,
      partiallyMatchedSkills: matchResult.partiallyMatchedSkills,
      missingSkills: matchResult.missingSkills,
      overallMatchPercentage: matchResult.overallMatchPercentage,
      overallGapPercentage: matchResult.overallGapPercentage,
      weightedScore: matchResult.weightedScore,
      totalRequiredSkills: matchResult.totalRequiredSkills,
      matchedCount: matchResult.matchedCount,
      partialCount: matchResult.partialCount,
      missingCount: matchResult.missingCount,
      categoryBreakdown: matchResult.categoryBreakdown,
      evaluatedAt: new Date(),
    });

    return sendSuccess(
      res,
      {
        analysis: formatAnalysisResponse(analysis, jobRole, resume),
      },
      'Skill gap analysis completed successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skill-gap/:id
 * Retrieves a previously calculated SkillGapAnalysis by ID
 */
export const getSkillGapById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid skill gap analysis ID format.', 400);
    }

    const analysis = await SkillGapAnalysis.findById(id)
      .populate('targetRoleId', 'title slug department description')
      .populate('resumeId', 'originalName fileType');

    if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        'Skill gap analysis record not found or access denied.',
        404
      );
    }

    return sendSuccess(
      res,
      {
        analysis: formatAnalysisResponse(analysis),
      },
      'Skill gap analysis retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skill-gap
 * Retrieves all skill gap analyses conducted by the authenticated student
 */
export const getMySkillGaps = async (req, res, next) => {
  try {
    const analyses = await SkillGapAnalysis.find({ userId: req.user._id })
      .populate('targetRoleId', 'title slug department')
      .populate('resumeId', 'originalName')
      .sort({ evaluatedAt: -1 })
      .lean();

    const formattedList = analyses.map((a) => formatAnalysisResponse(a));

    return sendSuccess(
      res,
      {
        count: formattedList.length,
        analyses: formattedList,
      },
      'Student skill gap analyses retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skill-gap/roles
 * Helper endpoint to retrieve active job roles for selection
 */
export const getAvailableJobRoles = async (req, res, next) => {
  try {
    const roles = await JobRole.find({ isActive: true })
      .select('title slug department industryDemand typicalExperienceLevel requiredSkills.canonicalName requiredSkills.importance requiredSkills.weight')
      .sort({ title: 1 })
      .lean();

    return sendSuccess(
      res,
      {
        count: roles.length,
        roles,
      },
      'Available job roles retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export default {
  analyzeSkillGap,
  getSkillGapById,
  getMySkillGaps,
  getAvailableJobRoles,
};
