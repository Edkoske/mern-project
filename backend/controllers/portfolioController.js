const Portfolio = require('../models/Portfolio');

const slugify = (value) =>
  value
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || null;

const buildSlugBase = (input, fallback) => {
  const slug = slugify(input);
  if (slug && slug.length >= 3) {
    return slug;
  }
  return slugify(fallback) || `portfolio-${Math.random().toString(36).slice(2, 8)}`;
};

const ensureUniqueSlug = async (candidate, excludeId) => {
  let uniqueSlug = candidate;
  let suffix = 1;
  const query = (slug) => ({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

  // eslint-disable-next-line no-await-in-loop
  while (await Portfolio.exists(query(uniqueSlug))) {
    uniqueSlug = `${candidate}-${suffix}`;
    suffix += 1;
  }

  return uniqueSlug;
};

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
    const { slug: _slug, isPublished: _isPublished, publishedAt: _publishedAt, ...payload } = req.body;
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { ...payload, user: req.user._id },
      { new: true, upsert: true, runValidators: true },
    ).populate('featuredResume');

    return res.json(updatedPortfolio);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save portfolio', error: error.message });
  }
};

const publishPortfolio = async (req, res) => {
  try {
    const existing = await Portfolio.findOne({ user: req.user._id });
    const desiredSlug =
      req.body.slug ||
      existing?.slug ||
      req.user.name ||
      req.user.email?.split('@')[0] ||
      'portfolio';

    const baseSlug = buildSlugBase(desiredSlug, req.user.name || 'portfolio');
    const slug = await ensureUniqueSlug(baseSlug, existing?._id);

    const updates = {
      slug,
      isPublished: true,
      publishedAt: new Date(),
      user: req.user._id,
    };

    const portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      existing ? updates : { ...updates, ...(req.body.portfolio || {}) },
      { new: true, upsert: true, runValidators: true },
    ).populate('featuredResume');

    return res.json(portfolio);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to publish portfolio', error: error.message });
  }
};

const unpublishPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { isPublished: false, publishedAt: null },
      { new: true },
    ).populate('featuredResume');

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    return res.json(portfolio);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to unpublish portfolio', error: error.message });
  }
};

const getPublicPortfolio = async (req, res) => {
  const { slug } = req.params;

  try {
    const portfolio = await Portfolio.findOne({ slug, isPublished: true })
      .populate('featuredResume')
      .populate('user', 'name');

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    return res.json(portfolio);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load portfolio', error: error.message });
  }
};

module.exports = {
  getPortfolio,
  upsertPortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio,
};

