import StudentProfile from '../models/StudentProfile.js';
import JobRole from '../models/JobRole.js';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get authenticated student profile
 * @route   GET /api/profile
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('targetRoleId')
      .populate('skills.canonicalSkillId', 'canonicalName category aliases demandScore');

    // If profile was not initialized, create one on demand
    if (!profile) {
      profile = await StudentProfile.create({
        userId: req.user._id,
        headline: 'Student / Aspiring Software Engineer',
      });
    }

    return sendSuccess(res, { profile }, 'Student profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or completely replace authenticated student profile
 * @route   POST /api/profile
 * @route   PUT /api/profile
 * @access  Private
 */
export const upsertProfile = async (req, res, next) => {
  try {
    const {
      headline,
      education,
      skills,
      projects,
      certifications,
      experience,
      targetRoleId,
      profileMetadata,
    } = req.body;

    // If targetRoleId is provided, verify it exists
    if (targetRoleId) {
      const roleExists = await JobRole.findById(targetRoleId);
      if (!roleExists) {
        return sendError(res, 'The selected target job role does not exist.', 400);
      }
    }

    const updateData = {
      ...(headline !== undefined && { headline }),
      ...(education !== undefined && { education }),
      ...(skills !== undefined && { skills }),
      ...(projects !== undefined && { projects }),
      ...(certifications !== undefined && { certifications }),
      ...(experience !== undefined && { experience }),
      ...(targetRoleId !== undefined && { targetRoleId }),
      ...(profileMetadata !== undefined && { profileMetadata }),
    };

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    )
      .populate('targetRoleId')
      .populate('skills.canonicalSkillId', 'canonicalName category aliases');

    return sendSuccess(res, { profile }, 'Student profile updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Partially update authenticated student profile
 * @route   PATCH /api/profile
 * @access  Private
 */
export const patchProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'headline',
      'education',
      'skills',
      'projects',
      'certifications',
      'experience',
      'targetRoleId',
      'profileMetadata',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 'No valid fields provided for update.', 400);
    }

    if (updates.targetRoleId) {
      const roleExists = await JobRole.findById(updates.targetRoleId);
      if (!roleExists) {
        return sendError(res, 'The selected target job role does not exist.', 400);
      }
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('targetRoleId')
      .populate('skills.canonicalSkillId', 'canonicalName category aliases');

    if (!profile) {
      return sendError(res, 'Student profile not found.', 404);
    }

    return sendSuccess(res, { profile }, 'Profile partially updated successfully', 200);
  } catch (error) {
    next(error);
  }
};
