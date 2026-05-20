const { HTTP_STATUS } = require('../constants');

class AuthController {
  constructor({ authService, tokenService }) {
    this.authService = authService;
    this.tokenService = tokenService;
  }

  register = async (req, res) => {
    try {
      const data = await this.authService.register(req.body);
      res.status(HTTP_STATUS.CREATED).json(data);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const loginResult = await this.authService.login({ email, password });
      const user = loginResult.data.user;
      const refreshToken = await this.tokenService.storeRefreshToken(user.id, this.tokenService.generateRefreshToken(user));

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

  refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const tokenData = await this.tokenService.refreshToken(refreshToken);
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

  logout = async (req, res) => {
    try {
      const userId = req.user.id;
      await this.authService.logout(userId);

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
}

module.exports = AuthController;