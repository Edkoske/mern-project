const Resume = require('../models/Resume');

const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
    return res.json(resumes);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resumes', error: error.message });
  }
};

const getResumeById = async (req, res) => {
  const { id } = req.params;

  try {
    const resume = await Resume.findOne({ _id: id, user: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.json(resume);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resume', error: error.message });
  }
};

const createResume = async (req, res) => {
  try {
    const resume = await Resume.create({
      ...req.body,
      user: req.user._id,
    });

    return res.status(201).json(resume);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create resume', error: error.message });
  }
};

const updateResume = async (req, res) => {
  const { id } = req.params;

  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { ...req.body },
      { new: true, runValidators: true },
    );

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.json(resume);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update resume', error: error.message });
  }
};

const deleteResume = async (req, res) => {
  const { id } = req.params;

  try {
    const resume = await Resume.findOneAndDelete({ _id: id, user: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete resume', error: error.message });
  }
};

module.exports = {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
};
