const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const profileService = require('../services/profile.service');
const { HTTP_STATUS } = require('../constants');

class AuthController {
  async register(req, res) {
    try {
      const data = await authService.register(req.body);
      res.status(HTTP_STATUS.CREATED).json(data);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const loginResult = await authService.login({ email, password });
      const user = loginResult.data.user;
      const refreshToken = await tokenService.storeRefreshToken(user.id, tokenService.generateRefreshToken(user));

      res.json({
        ...loginResult,
        data: {
          ...loginResult.data,
          refreshToken,
        },
      });
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokenData = await tokenService.refreshToken(refreshToken);
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokenData,
      });
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user.id;
      await authService.logout(userId);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Error during logout',
        ...(err.code && { code: err.code }),
      });
    }
  }

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
}

module.exports = new AuthController();