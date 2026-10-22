import mongoose from 'mongoose';

const skillTaxonomySchema = new mongoose.Schema(
  {
    canonicalName: {
      type: String,
      required: [true, 'Canonical skill name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      enum: {
        values: [
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
        message: '{VALUE} is not an accepted category',
      },
      index: true,
    },
    aliases: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
      default: '',
    },
    relatedSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    prerequisites: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    demandScore: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Index aliases for fast lookup during normalization
skillTaxonomySchema.index({ aliases: 1 });

const SkillTaxonomy = mongoose.model('SkillTaxonomy', skillTaxonomySchema);
export default SkillTaxonomy;
