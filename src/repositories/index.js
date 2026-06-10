const prisma = require("../config/database");
const userRepository = require("./user.repository");
const tokenRepository = require("./token.repository");
const profileRepository = require("./profile.repository");
const problemsRepository = require("./problems.repository");
const submissionRepository = require("./submission.repository");
const announcementRepository = require("./announcement.repository");
const discussionRepository = require("./discussion.repository");
module.exports = {
  prisma,
  userRepository,
  tokenRepository,
  profileRepository,
  problemsRepository,
  submissionRepository,
  announcementRepository,
  discussionRepository
};
