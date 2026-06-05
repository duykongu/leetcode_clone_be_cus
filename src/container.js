const AuthService = require('./services/auth.service');
const ProfileService = require('./services/profile.service');
const problemsService = require('./services/problem.service');
const TokenService = require('./services/token.service');

const AuthController = require('./controllers/auth.controller');
const ProblemsController = require('./controllers/problems.controller');
const UserController = require('./controllers/user.controller');
const ExecutionService = require('./services/execution.service');
const ExecutionController = require('./controllers/execution.controller');
const ScraperService = require('./services/scraper.service');
const ScraperController = require('./controllers/scraper.controller');
// 1. Instantiate Services
const tokenService = new TokenService();
const authService = new AuthService({ tokenService });
const profileService = new ProfileService();
const problemService = new problemsService();
const executionService = new ExecutionService();
// 2. Instantiate Controllers with injected dependencies
const authController = new AuthController({
  authService,
  tokenService,
});

const problemsController = new ProblemsController({
  problemService,
});

const userController = new UserController({
  authService,
  profileService,
});
const executionController = new ExecutionController({
  executionService, // Bơm service vào controller
});

const scraperController = new ScraperController();

module.exports = {
  authController,
  problemsController,
  userController,
  executionController,
  scraperController,
};
