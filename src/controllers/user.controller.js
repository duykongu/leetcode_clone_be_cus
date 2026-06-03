const { HTTP_STATUS } = require('../constants');
const { getPagination } = require('../utils/pagination');

class UserController {
  constructor({ authService, profileService }) {
    this.authService = authService;
    this.profileService = profileService;
  }

  me = async (req, res) => {
    try {
      const user = await this.profileService.getProfile(req.user.id);
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

  uploadAvatar = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Vui lòng chọn file ảnh',
        });
      }
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const user = await this.profileService.uploadAvatar(req.user.id, req.file, baseUrl);
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

  updateProfile = async (req, res) => {
    try {
      const user = await this.profileService.updateProfile(req.user.id, req.body);
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

  getUsers = async (req, res) => {
    try {
      const { page, limit } = getPagination(req.query, 10);
      const result = await this.authService.getUsers(page, limit);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = UserController;
