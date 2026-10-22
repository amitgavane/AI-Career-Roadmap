import mongoose from 'mongoose';

const requiredSkillSubSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTaxonomy',
      default: null,
    },
    canonicalName: {
      type: String,
      required: [true, 'Skill canonical name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      enum: [
        'Programming Language',
        'Framework',
        'Library',
        'Database',
        'DevOps',
        'Cloud',
        'Tools',
        'Testing',
        'Security',
        'Soft Skills',
        'Other',
      ],
    },
    importance: {
      type: String,
      enum: {
        values: ['critical', 'important', 'good_to_have'],
        message: '{VALUE} is not a valid importance level',
      },
      default: 'important',
    },
    weight: {
      type: Number,
      required: [true, 'Skill weight is required'],
      min: [1, 'Weight cannot be less than 1'],
      max: [5, 'Weight cannot exceed 5'],
      default: 3,
    },
    minimumProficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
  },
  { _id: false }
);

const optionalSkillSubSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTaxonomy',
      default: null,
    },
    canonicalName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Other',
    },
    weight: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
  },
  { _id: false }
);

const jobRoleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job role title is required'],
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job role description is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'Software Engineering',
      trim: true,
    },
    industryDemand: {
      type: String,
      enum: ['high', 'medium', 'emerging'],
      default: 'high',
    },
    typicalExperienceLevel: {
      type: String,
      default: 'Entry Level / Fresher (0-2 years)',
    },
    requiredSkills: [requiredSkillSubSchema],
    optionalSkills: [optionalSkillSubSchema],
    aliases: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const JobRole = mongoose.model('JobRole', jobRoleSchema);
export default JobRole;
