import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import StudentProfile from '../models/StudentProfile.js';
import { extractTextFromResume } from '../services/textExtractionService.js';
import { extractResumeEntitiesWithAi } from '../services/aiExtractionService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Upload resume (PDF/DOCX) and extract sanitized text
 * @route   POST /api/resumes/upload
 * @access  Private (JWT)
 */
export const uploadResume = async (req, res, next) => {
  try {
    // 1. Verify file presence
    if (!req.file) {
      return sendError(
        res,
        'No resume file provided. Please attach a PDF or DOCX file under field "resume".',
        400
      );
    }

    // 2. Extract and sanitize readable text
    let extracted;
    try {
      extracted = await extractTextFromResume(req.file);
    } catch (extractErr) {
      return sendError(res, extractErr.message, 422);
    }

    // 3. Store resume record in MongoDB
    const resume = await Resume.create({
      userId: req.user._id,
      originalName: req.file.originalname,
      fileType: req.file.mimetype || 'application/octet-stream',
      fileSize: req.file.size,
      rawText: extracted.sanitizedText,
      status: 'parsed',
      extractionStatus: 'pending',
    });

    // 4. Update the student's active resume pointer in StudentProfile
    await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { activeResumeId: resume._id } },
      { upsert: true }
    );

    // 5. Return sanitized response
    return sendSuccess(
      res,
      {
        resume: {
          id: resume._id,
          originalName: resume.originalName,
          fileType: resume.fileType,
          fileSize: resume.fileSize,
          status: resume.status,
          extractionStatus: resume.extractionStatus,
          uploadedAt: resume.createdAt,
          charCount: extracted.charCount,
          wordCount: extracted.wordCount,
          textSnippet:
            extracted.sanitizedText.length > 300
              ? `${extracted.sanitizedText.substring(0, 300)}...`
              : extracted.sanitizedText,
        },
      },
      'Resume uploaded and text extracted successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resumes belonging to the authenticated student
 * @route   GET /api/resumes
 * @access  Private (JWT)
 */
export const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('originalName fileType fileSize status extractionStatus extractionProcessedAt createdAt updatedAt')
      .sort({ createdAt: -1 });

    return sendSuccess(
      res,
      {
        count: resumes.length,
        resumes,
      },
      'Resumes retrieved successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific resume by ID (strictly for authenticated owner)
 * @route   GET /api/resumes/:id
 * @access  Private (JWT)
 */
export const getResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid resume ID format.', 400);
    }

    // Tenant isolation: query must match both _id AND userId
    const resume = await Resume.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!resume) {
      return sendError(res, 'Resume not found.', 404);
    }

    return sendSuccess(
      res,
      {
        resume: {
          id: resume._id,
          originalName: resume.originalName,
          fileType: resume.fileType,
          fileSize: resume.fileSize,
          rawText: resume.rawText,
          status: resume.status,
          extractionStatus: resume.extractionStatus,
          extractionProcessedAt: resume.extractionProcessedAt,
          aiModelUsed: resume.aiModelUsed,
          aiExtractedData: resume.aiExtractedData,
          uploadedAt: resume.createdAt,
          updatedAt: resume.updatedAt,
        },
      },
      'Resume retrieved successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger AI-powered entity extraction for a specific resume
 * @route   POST /api/resumes/:id/extract
 * @access  Private (JWT)
 */
export const extractResumeEntities = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid resume ID format.', 400);
    }

    // Tenant isolation: verify resume belongs to authenticated student
    const resume = await Resume.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!resume) {
      return sendError(res, 'Resume not found.', 404);
    }

    // Validate that resume contains extracted text
    if (!resume.rawText || resume.rawText.trim().length === 0) {
      return sendError(
        res,
        'Resume contains no extracted text to analyze. Please upload a readable resume first.',
        400
      );
    }

    // Update status to processing
    resume.extractionStatus = 'processing';
    await resume.save();

    let extractionResult;
    try {
      extractionResult = await extractResumeEntitiesWithAi(resume.rawText);
    } catch (aiError) {
      resume.extractionStatus = 'failed';
      resume.extractionError = aiError.message;
      await resume.save();

      return sendError(
        res,
        `AI extraction failed: ${aiError.message}`,
        502
      );
    }

    const { extractedData, modelUsed } = extractionResult;

    // Persist structured extraction to MongoDB
    resume.aiExtractedData = extractedData;
    resume.extractionStatus = 'completed';
    resume.extractionProcessedAt = new Date();
    resume.extractionError = '';
    resume.aiModelUsed = modelUsed;

    // Sync parsedData for backward compatibility with Phase 2/4 schemas
    resume.parsedData = {
      summary: '',
      education: extractedData.education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.field,
        year: [e.startYear, e.endYear].filter(Boolean).join(' - '),
        grade: '',
      })),
      experience: extractedData.experience.map((exp) => ({
        company: exp.company,
        role: exp.role,
        duration: '',
        summary: exp.description,
      })),
      projects: extractedData.projects.map((p) => ({
        title: p.name,
        technologies: p.technologies,
        description: p.description,
        link: '',
      })),
      certifications: extractedData.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        year: c.year,
      })),
    };

    await resume.save();

    return sendSuccess(
      res,
      {
        resumeId: resume._id,
        extractionStatus: resume.extractionStatus,
        extractionProcessedAt: resume.extractionProcessedAt,
        aiModelUsed: resume.aiModelUsed,
        extractedEntities: resume.aiExtractedData,
      },
      'AI resume entity extraction completed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resume by ID (strictly for authenticated owner)
 * @route   DELETE /api/resumes/:id
 * @access  Private (JWT)
 */
export const deleteResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid resume ID format.', 400);
    }

    const deletedResume = await Resume.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deletedResume) {
      return sendError(res, 'Resume not found.', 404);
    }

    // If activeResumeId on StudentProfile was pointing to this resume, un-link it
    await StudentProfile.findOneAndUpdate(
      { userId: req.user._id, activeResumeId: id },
      { $set: { activeResumeId: null } }
    );

    return sendSuccess(
      res,
      { deletedResumeId: id },
      'Resume deleted successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};
