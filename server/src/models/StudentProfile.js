import mongoose from 'mongoose';

const profileSkillSubSchema = new mongoose.Schema(
  {
    name: {
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
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    source: {
      type: String,
      enum: ['manual', 'resume_extracted'],
      default: 'manual',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const educationSubSchema = new mongoose.Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, default: '', trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    grade: { type: String, default: '' },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false }
);

const projectSubSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    technologies: [{ type: String, trim: true }],
    link: { type: String, default: '' },
    githubRepo: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: false }
);

const certificationSubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String, default: '' },
    credentialUrl: { type: String, default: '' },
  },
  { _id: false }
);

const experienceSubSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    headline: {
      type: String,
      default: '',
      trim: true,
      maxlength: [150, 'Headline cannot exceed 150 characters'],
    },
    education: [educationSubSchema],
    skills: [profileSkillSubSchema],
    projects: [projectSubSchema],
    certifications: [certificationSubSchema],
    experience: [experienceSubSchema],
    targetRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRole',
      default: null,
      index: true,
    },
    activeResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    profileMetadata: {
      bio: { type: String, default: '' },
      githubUrl: { type: String, default: '' },
      linkedinUrl: { type: String, default: '' },
      portfolioUrl: { type: String, default: '' },
      careerGoals: { type: String, default: '' },
      weeklyAvailableHours: { type: Number, default: 15, min: 1, max: 60 },
      preferredWorkMode: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite', 'any'],
        default: 'any',
      },
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
