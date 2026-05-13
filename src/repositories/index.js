const prisma = require("../config/database");
const userRepository = require("./user.repository");
const tokenRepository = require("./token.repository");
const profileRepository = require("./profile.repository");
const problemsRepository = require("./problems.repository");

module.exports = {
  prisma,
  userRepository,
  tokenRepository,
  profileRepository,
  problemsRepository,
};
