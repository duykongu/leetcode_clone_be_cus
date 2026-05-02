const express = require('express');
const router = express.Router();
const problemsController = require('../controllers/ProblemsController');

// Get all problems
router.get('/', problemsController.getProblems);

module.exports = router;
