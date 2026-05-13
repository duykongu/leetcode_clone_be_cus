const express = require('express');
const router = express.Router();
const problemsController = require('../controllers/problems.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get all problems
router.get('/', authMiddleware.optionalAuth, problemsController.getProblems);

// Get problem detail
router.get('/:id', authMiddleware.optionalAuth, problemsController.getProblemDetail);

// Import problem (Should be admin-only in production)
router.post('/import', problemsController.importProblem);


module.exports = router;
