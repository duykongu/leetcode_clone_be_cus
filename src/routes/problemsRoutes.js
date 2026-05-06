const express = require('express');
const router = express.Router();
const problemsController = require('../controllers/ProblemsController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all problems
router.get('/', authMiddleware.optionalAuth, problemsController.getProblems);

// Get problem detail
router.get('/:id', authMiddleware.optionalAuth, problemsController.getProblemDetail);

module.exports = router;
