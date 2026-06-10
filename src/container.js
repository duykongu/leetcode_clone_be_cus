const AuthService = require('./services/auth.service');
const ProfileService = require('./services/profile.service');
const problemsService = require('./services/problem.service');
const TokenService = require('./services/token.service');

const AuthController = require('./controllers/auth.controller');
const ProblemsController = require('./controllers/problems.controller');
const UserController = require('./controllers/user.controller');
const ExecutionService = require('./services/execution.service');
const ExecutionController = require('./controllers/execution.controller');

const AnnouncementService = require('./services/announcement.service');
const AnnouncementController = require('./controllers/announcement.controller');

const DiscussionService = require('./services/discussion.service');
const DiscussionController = require('./controllers/discussion.controller');

const tokenService = new TokenService();
const authService = new AuthService({ tokenService });
const profileService = new ProfileService();
const problemService = new problemsService();
const executionService = new ExecutionService();


const announcementService = new AnnouncementService();
const discussionService = new DiscussionService();


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
  executionService,
});

const announcementController = new AnnouncementController({
  announcementService,
});
const discussionController = new DiscussionController({ discussionService });


module.exports = {
  authController,
  problemsController,
  userController,
  executionController,
  announcementController,
  discussionController,
};
