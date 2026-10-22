import mongoose from 'mongoose';

const learningResourceSubSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'documentation',
        'course',
        'video_playlist',
        'interactive_tutorial',
        'article',
        'book',
        'tutorial',
        'official_docs',
        'other',
      ],
      default: 'documentation',
    },
    platform: {
      type: String,
      default: '',
      trim: true,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const learningModuleSubSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    objective: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    prerequisites: [{ type: String, trim: true }],
    topics: [{ type: String, trim: true }],
    practiceTasks: [{ type: String, trim: true }],
    resources: [learningResourceSubSchema],
    estimatedHours: {
      type: Number,
      default: 4,
      min: 1,
    },
    status: {
      type: String,
      enum: [
        'NOT_STARTED',
        'IN_PROGRESS',
        'COMPLETED',
        'not_started',
        'in_progress',
        'completed',
      ],
      default: 'NOT_STARTED',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Backward compatibility fields
    resourceTitle: {
      type: String,
      default: '',
    },
    resourceType: {
      type: String,
      default: 'documentation',
    },
    resourcePlatform: {
      type: String,
      default: '',
    },
    resourceUrl: {
      type: String,
      default: '',
    },
    isFree: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const practicalProjectSubSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    skillsCovered: [{ type: String, trim: true }],
    skillsPracticed: [{ type: String, trim: true }],
    deliverables: [{ type: String, trim: true }],
    expectedDeliverable: {
      type: String,
      default: '',
    },
    estimatedHours: {
      type: Number,
      default: 10,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
  },
  { _id: false }
);

const milestoneSubSchema = new mongoose.Schema(
  {
    milestoneNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    targetWeeks: {
      type: String,
      required: true,
      trim: true,
    },
    objective: {
      type: String,
      required: true,
    },
    skillsCovered: [{ type: String, trim: true }],
    learningModules: [learningModuleSubSchema],
    milestoneProject: practicalProjectSubSchema,
    practicalProject: practicalProjectSubSchema,
    status: {
      type: String,
      enum: [
        'NOT_STARTED',
        'IN_PROGRESS',
        'COMPLETED',
        'not_started',
        'in_progress',
        'completed',
      ],
      default: 'NOT_STARTED',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const prioritizedSkillSubSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
      trim: true,
    },
    priorityRank: {
      type: Number,
      required: true,
    },
    importance: {
      type: String,
      default: 'important',
    },
    weight: {
      type: Number,
      default: 3,
    },
    matchType: {
      type: String,
      enum: ['missing', 'partial'],
      default: 'missing',
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
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
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillGapAnalysis',
      required: [true, 'Skill-gap analysis reference is required'],
      index: true,
    },
    skillGapAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillGapAnalysis',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Roadmap title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    estimatedDurationWeeks: {
      type: Number,
      default: 8,
      min: 1,
    },
    weeklyHoursCommitment: {
      type: Number,
      default: 15,
      min: 1,
    },
    totalEstimatedHours: {
      type: Number,
      default: 0,
    },
    prerequisitesSummary: [{ type: String }],
    prioritizedSkills: [prioritizedSkillSubSchema],
    modules: [learningModuleSubSchema],
    milestones: [milestoneSubSchema],
    milestoneProjects: [practicalProjectSubSchema],
    status: {
      type: String,
      enum: {
        values: [
          'NOT_STARTED',
          'IN_PROGRESS',
          'COMPLETED',
          'active',
          'paused',
          'completed',
          'archived',
        ],
        message: '{VALUE} is not a valid roadmap status',
      },
      default: 'NOT_STARTED',
      index: true,
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedMilestonesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee fast lookup and enforce duplicate analysis check
roadmapSchema.index({ userId: 1, analysisId: 1 });
roadmapSchema.index({ userId: 1, skillGapAnalysisId: 1 });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;
