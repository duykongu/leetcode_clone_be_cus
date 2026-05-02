const userService = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');

class AuthController {
  async register(req, res) {
    try {
      const data = await userService.register(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const loginResult = await userService.login({ email, password });

      // Generate and store refresh token
      const user = loginResult.data.user;
      const refreshToken = await userService.storeRefreshToken(user.id, userService.generateRefreshToken(user));

      res.json({
        ...loginResult,
        data: {
          ...loginResult.data,
          refreshToken,
        },
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokenData = await userService.refreshToken(refreshToken);
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokenData,
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user.id;
      await userService.logout(userId);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error during logout',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async me(req, res) {
    try {
      const user = await userService.getProfile(req.user.id);
      res.json({
        success: true,
        data: { user },
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        ...(err.code && { code: err.code }),
      });
    }
  }
}

module.exports = new AuthController();