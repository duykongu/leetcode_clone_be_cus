const AuthService = require('./services/auth.service');
const ProfileService = require('./services/profile.service');
const problemsService = require('./services/problem.service');
const TokenService = require('./services/token.service');

const AuthController = require('./controllers/auth.controller');
const ProblemsController = require('./controllers/problems.controller');
const UserController = require('./controllers/user.controller');

// 1. Instantiate Services
const tokenService = new TokenService();
const authService = new AuthService({ tokenService });
const profileService = new ProfileService();
const problemService = new problemsService();

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

module.exports = {
  authController,
  problemsController,
  userController,
};
