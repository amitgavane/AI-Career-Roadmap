import mongoose from 'mongoose';

const extractedSkillSubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Other',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0,
    },
    rawTextMention: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: 0,
    },
    storagePath: {
      type: String,
      default: '',
    },
    rawText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['uploaded', 'processing', 'parsed', 'failed'],
        message: '{VALUE} is not a valid processing status',
      },
      default: 'uploaded',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    parsedData: {
      summary: { type: String, default: '' },
      education: [
        {
          institution: { type: String, default: '' },
          degree: { type: String, default: '' },
          fieldOfStudy: { type: String, default: '' },
          year: { type: String, default: '' },
          grade: { type: String, default: '' },
        },
      ],
      experience: [
        {
          company: { type: String, default: '' },
          role: { type: String, default: '' },
          duration: { type: String, default: '' },
          summary: { type: String, default: '' },
        },
      ],
      projects: [
        {
          title: { type: String, default: '' },
          technologies: [{ type: String }],
          description: { type: String, default: '' },
          link: { type: String, default: '' },
        },
      ],
      certifications: [
        {
          name: { type: String, default: '' },
          issuer: { type: String, default: '' },
          year: { type: String, default: '' },
        },
      ],
    },
    extractedSkills: [extractedSkillSubSchema],
    aiExtractedData: {
      skills: [{ type: String, trim: true }],
      programmingLanguages: [{ type: String, trim: true }],
      frameworks: [{ type: String, trim: true }],
      databases: [{ type: String, trim: true }],
      tools: [{ type: String, trim: true }],
      projects: [
        {
          name: { type: String, default: '', trim: true },
          description: { type: String, default: '', trim: true },
          technologies: [{ type: String, trim: true }],
        },
      ],
      education: [
        {
          degree: { type: String, default: '', trim: true },
          institution: { type: String, default: '', trim: true },
          field: { type: String, default: '', trim: true },
          startYear: { type: String, default: '', trim: true },
          endYear: { type: String, default: '', trim: true },
        },
      ],
      experience: [
        {
          role: { type: String, default: '', trim: true },
          company: { type: String, default: '', trim: true },
          description: { type: String, default: '', trim: true },
          technologies: [{ type: String, trim: true }],
        },
      ],
      certifications: [
        {
          name: { type: String, default: '', trim: true },
          issuer: { type: String, default: '', trim: true },
          year: { type: String, default: '', trim: true },
        },
      ],
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    extractionProcessedAt: {
      type: Date,
      default: null,
    },
    extractionError: {
      type: String,
      default: '',
    },
    aiModelUsed: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
