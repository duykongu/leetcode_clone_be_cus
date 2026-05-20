const authService = require('../services/auth.service');
const profileService = require('../services/profile.service');
const { HTTP_STATUS } = require('../constants');

class UserController {
  async me(req, res) {
    try {
      const user = await profileService.getProfile(req.user.id);
      res.json({
        success: true,
        data: { user },
      });
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message,
        ...(err.code && { code: err.code }),
      });
    }
  }

  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await authService.getUsers(page, limit);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new UserController();
