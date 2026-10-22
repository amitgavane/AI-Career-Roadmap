import mongoose from 'mongoose';

const matchedSkillSubSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    canonicalSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTaxonomy',
      default: null,
    },
    category: {
      type: String,
      default: 'Other',
    },
    importance: {
      type: String,
      enum: ['critical', 'important', 'good_to_have'],
      default: 'important',
    },
    weight: {
      type: Number,
      default: 3,
    },
    matchType: {
      type: String,
      enum: ['exact', 'alias', 'semantic'],
      default: 'exact',
    },
    similarityScore: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    candidateSkillFound: {
      type: String,
      default: '',
    },
    skill: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const partiallyMatchedSkillSubSchema = new mongoose.Schema(
  {
    targetSkill: {
      type: String,
      required: true,
      trim: true,
    },
    skill: {
      type: String,
      trim: true,
    },
    canonicalSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTaxonomy',
      default: null,
    },
    candidateSkillFound: {
      type: String,
      required: true,
      trim: true,
    },
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    weight: {
      type: Number,
      default: 3,
    },
    importance: {
      type: String,
      default: 'important',
    },
    recommendationNote: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const missingSkillSubSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    skill: {
      type: String,
      trim: true,
    },
    canonicalSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTaxonomy',
      default: null,
    },
    category: {
      type: String,
      default: 'Other',
    },
    importance: {
      type: String,
      enum: ['critical', 'important', 'good_to_have'],
      default: 'important',
    },
    importanceScore: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    priorityRank: {
      type: Number,
      default: 1,
    },
    prerequisites: [{ type: String }],
    reasoning: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const skillGapAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student user reference is required'],
      index: true,
    },
    targetRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRole',
      required: [true, 'Target job role reference is required'],
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
      index: true,
    },
    matchedSkills: [matchedSkillSubSchema],
    partiallyMatchedSkills: [partiallyMatchedSkillSubSchema],
    missingSkills: [missingSkillSubSchema],
    overallMatchPercentage: {
      type: Number,
      required: [true, 'Match percentage is required'],
      min: 0,
      max: 100,
    },
    overallGapPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    weightedScore: {
      type: Number,
      default: 0,
    },
    totalRequiredSkills: {
      type: Number,
      default: 0,
    },
    matchedCount: {
      type: Number,
      default: 0,
    },
    partialCount: {
      type: Number,
      default: 0,
    },
    missingCount: {
      type: Number,
      default: 0,
    },
    categoryBreakdown: {
      programmingLanguages: { type: Number, default: 0 },
      frameworks: { type: Number, default: 0 },
      databases: { type: Number, default: 0 },
      tools: { type: Number, default: 0 },
      devops: { type: Number, default: 0 },
      softSkills: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const SkillGapAnalysis = mongoose.model('SkillGapAnalysis', skillGapAnalysisSchema);
export default SkillGapAnalysis;
