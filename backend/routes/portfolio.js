const express = require('express');
const {
  getPortfolio,
  upsertPortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio,
} = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/public/:slug', getPublicPortfolio);

router.use(authMiddleware);

router.get('/', getPortfolio);
router.put('/', upsertPortfolio);
router.post('/publish', publishPortfolio);
router.post('/unpublish', unpublishPortfolio);

module.exports = router;

