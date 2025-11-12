const mongoose = require('mongoose');

const portfolioProjectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    link: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { _id: false },
);

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    headline: { type: String, trim: true },
    bio: { type: String, trim: true },
    socialLinks: {
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      twitter: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    skills: [{ type: String, trim: true }],
    projects: [portfolioProjectSchema],
    featuredResume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    theme: {
      palette: {
        primary: { type: String, trim: true },
        secondary: { type: String, trim: true },
        accent: { type: String, trim: true },
      },
      layout: { type: String, trim: true, default: 'classic' },
    },
  },
  {
    timestamps: true,
  },
);

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
