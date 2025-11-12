const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, trim: true },
    company: { type: String, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    description: { type: String, trim: true },
    achievements: [{ type: String, trim: true }],
  },
  { _id: false },
);

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    link: { type: String, trim: true },
    techStack: [{ type: String, trim: true }],
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    personalInfo: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      location: { type: String, trim: true },
      website: { type: String, trim: true },
      summary: { type: String, trim: true },
    },
    experiences: [experienceSchema],
    education: [educationSchema],
    skills: [{ type: String, trim: true }],
    projects: [projectSchema],
    aiMetadata: {
      lastPrompt: { type: String, trim: true },
      lastModel: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  },
);

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
