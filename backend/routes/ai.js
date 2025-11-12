const express = require('express');
const { generateImprovedContent, generatePortfolioIntro } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/improve', generateImprovedContent);
router.post('/portfolio-intro', generatePortfolioIntro);

module.exports = router;
