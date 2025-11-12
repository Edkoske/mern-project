const express = require('express');
const { getPortfolio, upsertPortfolio } = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getPortfolio);
router.put('/', upsertPortfolio);

module.exports = router;

