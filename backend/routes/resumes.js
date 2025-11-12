const express = require('express');
const {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
} = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.route('/').get(getResumes).post(createResume);
router.route('/:id').get(getResumeById).put(updateResume).delete(deleteResume);

module.exports = router;
