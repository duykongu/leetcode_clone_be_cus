const jwt = require('jsonwebtoken');
const { userRepository: userRepo } = require('../repositories');
const { HTTP_STATUS } = require('../constants');

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'No token provided',
          code: 'MISSING_TOKEN',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid token format',
          code: 'INVALID_TOKEN_FORMAT',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      const user = await userRepo.findById(decoded.id, {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      console.error('Auth middleware error:', err);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        const user = await userRepo.findById(decoded.id, {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            createdAt: true,
            avatarUrl: true,
          },
        });

        if (user) {
          req.user = user;
        }
      }

      next();
    } catch (err) {
      // For optional auth, just continue even if token is invalid
      next();
    }
  }
}

module.exports = new AuthMiddleware();
