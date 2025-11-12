const Portfolio = require('../models/Portfolio');

const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id }).populate('featuredResume');

    if (!portfolio) {
      return res.json(null);
    }

    return res.json(portfolio);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch portfolio', error: error.message });
  }
};

const upsertPortfolio = async (req, res) => {
  try {
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, user: req.user._id },
      { new: true, upsert: true, runValidators: true },
    ).populate('featuredResume');

    return res.json(updatedPortfolio);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save portfolio', error: error.message });
  }
};

module.exports = {
  getPortfolio,
  upsertPortfolio,
};

